export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Give Vercel 30 s on the chatbot route (default is 10 s).
// The LLM call + cold-start overhead can exceed 10 s.
export const maxDuration = 30;

import { cookies } from 'next/headers';

import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import { searchFAQ, SUPPORT_CONTACTS } from '@/lib/chatbot/faqData';
import { detectIntent } from '@/lib/chatbot/intentDetector';
import { extractPrice } from '@/lib/chatbot/priceParser';
import { detectCategory } from '@/lib/chatbot/categoryMap';
import { getResponse } from '@/lib/chatbot/router';

// ── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface ProductContext {
  slug?: string;
  name?: string;
  category?: string;
  productType?: string;
  price?: number;
  colors?: string[];
  sizes?: string[];
}

// ── Tool Implementations ─────────────────────────────────────────────────────

async function searchProducts(args: {
  productType?: string;
  category?: string;
  subcategory?: string;
  occasion?: string;
  colors?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  limit?: number;
}) {
  await dbConnect();
  const limit = Math.min(args.limit || 4, 8);
  const query: Record<string, unknown> = {};

  if (args.productType) query.productType = { $regex: new RegExp(args.productType, 'i') };
  if (args.category) query.category = { $regex: new RegExp(args.category, 'i') };
  if (args.subcategory) query.subcategory = { $regex: new RegExp(args.subcategory, 'i') };
  if (args.occasion) query.occasion = { $regex: new RegExp(args.occasion, 'i') };
  if (args.colors) query.colors = { $regex: new RegExp(args.colors, 'i') };
  if (args.minPrice || args.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (args.minPrice) priceFilter.$gte = args.minPrice;
    if (args.maxPrice) priceFilter.$lte = args.maxPrice;
    query.price = priceFilter;
  }
  if (args.q) {
    const words = args.q.trim().split(/\s+/).filter(Boolean);
    const regexPattern = words.map((w: string) => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');
    query.$or = [
      { name: { $regex: regexPattern, $options: 'i' } },
      { category: { $regex: regexPattern, $options: 'i' } },
      { subcategory: { $regex: regexPattern, $options: 'i' } },
      { collectionName: { $regex: regexPattern, $options: 'i' } },
    ];
  }

  const products = await Product.find(query)
    .select('_id name slug price originalPrice images category subcategory productType occasion colors inventoryCount isFeatured')
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .lean() as Array<Record<string, any>>;

  if (products.length === 0) {
    return { found: false, message: 'No products found matching these criteria.', products: [] };
  }

  return {
    found: true,
    count: products.length,
    products: products.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice,
      image: Array.isArray(p.images) ? p.images[0] : null,
      category: p.category,
      subcategory: p.subcategory,
      productType: p.productType,
      occasion: p.occasion,
      colors: p.colors,
      inStock: (p.inventoryCount as number) > 0,
      isFeatured: p.isFeatured,
    })),
  };
}

async function getProductDetails(args: { slug: string }) {
  await dbConnect();
  const product = await Product.findOne({ slug: args.slug })
    .select('_id name slug price originalPrice images category subcategory productType occasion colors sizes inventoryCount description details')
    .lean() as Record<string, unknown> | null;

  if (!product) {
    return { found: false, message: `Product with slug "${args.slug}" was not found.` };
  }

  return {
    found: true,
    product: {
      id: String(product._id),
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      image: Array.isArray(product.images) ? product.images[0] : null,
      images: product.images,
      category: product.category,
      subcategory: product.subcategory,
      productType: product.productType,
      occasion: product.occasion,
      colors: product.colors,
      sizes: product.sizes,
      inStock: (product.inventoryCount as number) > 0,
      inventoryCount: product.inventoryCount,
      description: product.description,
      details: product.details,
    },
  };
}

async function getSimilarProducts(args: { slug: string; limit?: number }) {
  await dbConnect();
  const limit = Math.min(args.limit || 4, 8);

  const reference = await Product.findOne({ slug: args.slug })
    .select('category productType price')
    .lean() as Record<string, unknown> | null;

  if (!reference) {
    return { found: false, products: [] };
  }

  const priceMin = (reference.price as number) * 0.5;
  const priceMax = (reference.price as number) * 2.0;

  const products = await Product.find({
    slug: { $ne: args.slug },
    category: (reference as any).category,
    productType: (reference as any).productType,
    price: { $gte: priceMin, $lte: priceMax },
  })
    .select('_id name slug price originalPrice images category subcategory productType occasion colors inventoryCount')
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .lean() as Array<Record<string, any>>;

  return {
    found: products.length > 0,
    products: products.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice,
      image: Array.isArray(p.images) ? p.images[0] : null,
      category: p.category,
      productType: p.productType,
      colors: p.colors,
      inStock: (p.inventoryCount as number) > 0,
    })),
  };
}

async function getOrderStatus(args: { orderId?: string }, userId: string | null) {
  if (!userId) {
    return {
      authenticated: false,
      message: 'To look up your order, please log in to your account first.',
    };
  }

  await dbConnect();

  let order;
  if (args.orderId) {
    order = await Order.findOne({ _id: args.orderId, user: userId })
      .select('_id items orderStatus paymentStatus total shippingCost subtotal createdAt shippingDetails')
      .lean();
  } else {
    // Return the most recent order
    order = await Order.findOne({ user: userId })
      .select('_id items orderStatus paymentStatus total shippingCost subtotal createdAt shippingDetails')
      .sort({ createdAt: -1 })
      .lean();
  }

  if (!order) {
    return {
      authenticated: true,
      found: false,
      message: 'No order was found for your account with that ID.',
    };
  }

  const orderData = order as Record<string, unknown>;
  const items = orderData.items as Array<Record<string, unknown>>;
  const shipping = orderData.shippingDetails as Record<string, unknown>;

  return {
    authenticated: true,
    found: true,
    order: {
      id: String(orderData._id),
      orderStatus: orderData.orderStatus,
      paymentStatus: orderData.paymentStatus,
      total: orderData.total,
      subtotal: orderData.subtotal,
      shippingCost: orderData.shippingCost,
      createdAt: orderData.createdAt,
      itemCount: items?.length || 0,
      items: items?.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        image: item.image,
      })) || [],
      shippingCity: shipping?.city,
      shippingCountry: shipping?.country,
    },
  };
}

function getFAQAnswer(args: { query: string }) {
  const result = searchFAQ(args.query);
  if (result) {
    return { found: true, ...result };
  }
  return {
    found: false,
    message: 'No specific FAQ entry was found. For personalised assistance, contact us:',
    contactWhatsapp: SUPPORT_CONTACTS.whatsapp,
    contactEmail: SUPPORT_CONTACTS.email,
  };
}

// ── Tool Dispatcher ───────────────────────────────────────────────────────────
async function dispatchTool(name: string, args: Record<string, unknown>, userId: string | null) {
  switch (name) {
    case 'searchProducts':
      return searchProducts(args as Parameters<typeof searchProducts>[0]);
    case 'getProductDetails':
      return getProductDetails(args as { slug: string });
    case 'getSimilarProducts':
      return getSimilarProducts(args as { slug: string; limit?: number });
    case 'getOrderStatus':
      return getOrderStatus(args as { orderId?: string }, userId);
    case 'getFAQAnswer':
      return getFAQAnswer(args as { query: string });
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Rate Limiting (In-Memory) ───────────────────────────────────────────────────
const ipRequestCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function checkAdminRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip) || { count: 0, windowStart: now };

  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.windowStart = now;
  } else {
    record.count++;
  }

  ipRequestCounts.set(ip, record);
  return record.count <= MAX_REQUESTS_PER_WINDOW;
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (!checkAdminRateLimit(ip)) {
    return NextResponse.json({
      text: "You're sending messages a bit too fast. Please wait a moment.",
      products: [],
      orderInfo: null,
      fallback: true,
    }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { messages, pageContext, userContext, cart, wishlist } = body as {
      messages: ChatMessage[];
      pageContext?: ProductContext;
      userContext?: string | null;
      cart?: any[];
      wishlist?: any[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request: messages array required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.parts[0]?.text || '';
    
    // Normalize string: Trim and remove redundant spaces
    const normalizedText = userText.trim().replace(/\s+/g, ' ');

    // ── Layer 2: Deterministic Intent Detection ────────────────────────────
    const { intent, confidence } = detectIntent(normalizedText);

    // ── Get authenticated user ─────────────────────────────────────────────
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value || cookieStore.get('token')?.value;
      if (token) {
        const payload = await verifyToken(token);
        const rawId = payload?.userId || payload?.id;
        
        if (typeof rawId === 'string') {
          userId = rawId;
        } else if (rawId && typeof rawId === 'object' && 'buffer' in rawId) {
          // Fix for ObjectId buffers serialized to JWT
          userId = Buffer.from(Object.values(rawId.buffer as Record<string, number>)).toString('hex');
        } else if (rawId) {
          userId = String(rawId);
        }
      }
    } catch {
      // Not authenticated — that's fine
    }

    // ── Handlers (No AI) ───────────────────────────────────────────────────
    
    // 1. FAQ Handler (Removed in favor of 3-Tier Router)

    // 2. Contact Handler
    if (intent === 'CONTACT') {
      console.log(`[CHATBOT] intent=CONTACT ai=false time=${Date.now() - startTime}ms`);
      return NextResponse.json({
        text: `You can reach our support team via WhatsApp at ${SUPPORT_CONTACTS.whatsapp} or email us at ${SUPPORT_CONTACTS.email}. We typically reply within 24 hours.`,
        products: [],
        orderInfo: null,
        fallback: false,
      });
    }

    // 3. Order Tracking Handler
    if (intent === 'ORDER_TRACKING') {
      console.log(`[CHATBOT] intent=ORDER_TRACKING ai=false time=${Date.now() - startTime}ms`);
      if (!userId) {
        return NextResponse.json({
          text: 'To look up your order status, please log in to your account first.',
          products: [],
          orderInfo: null,
          fallback: false,
        });
      }
      
      const orderResult = await getOrderStatus({}, userId);
      if (orderResult.found) {
        return NextResponse.json({
          text: 'Here is the status of your most recent order:',
          products: [],
          orderInfo: orderResult.order,
          fallback: false,
        });
      } else {
        return NextResponse.json({
          text: 'I couldn\'t find any recent orders associated with your account.',
          products: [],
          orderInfo: null,
          fallback: false,
        });
      }
    }

    // 4. Product Search Handler
    if (intent === 'PRODUCT_SEARCH') {
      const categoryFilters = detectCategory(normalizedText);
      const priceFilters = extractPrice(normalizedText);
      
      const searchResult = await searchProducts({
        ...categoryFilters,
        ...priceFilters,
        q: normalizedText, // Fallback text search
        limit: 4,
      });
      
      if (searchResult.found) {
        console.log(`[CHATBOT] intent=PRODUCT_SEARCH ai=false time=${Date.now() - startTime}ms filters=${JSON.stringify({ ...categoryFilters, ...priceFilters })}`);
        return NextResponse.json({
          text: 'I found these pieces that match what you\'re looking for:',
          products: searchResult.products,
          orderInfo: null,
          fallback: false,
        });
      }
      // If nothing found, fall through to AI for better conversational handling
    }

    // 5. Category Browse
    if (intent === 'CATEGORY_BROWSE') {
      const categoryFilters = detectCategory(normalizedText);
      
      // Map it to frontend routes
      let navRoute = null;
      if (categoryFilters.productType === 'footwear') navRoute = '/products/footwear';
      else if (categoryFilters.productType === 'jewellery') navRoute = '/products/jewellery/all';
      else if (categoryFilters.category && categoryFilters.subcategory) navRoute = `/products/couture/${categoryFilters.category.toLowerCase()}/${categoryFilters.subcategory.toLowerCase()}`;
      else if (categoryFilters.category) navRoute = `/products/couture/${categoryFilters.category.toLowerCase()}`;
      else if (categoryFilters.productType === 'couture') navRoute = '/products/couture';

      if (navRoute) {
        console.log(`[CHATBOT] intent=CATEGORY_BROWSE ai=false time=${Date.now() - startTime}ms route=${navRoute}`);
        return NextResponse.json({
          text: 'Taking you to our collection...',
          navigate: navRoute,
          products: [],
          orderInfo: null,
          fallback: false,
        });
      }
    }

    // 6. Wishlist / Cart Actions
    if (intent === 'WISHLIST_CART') {
      console.log(`[CHATBOT] intent=WISHLIST_CART ai=false time=${Date.now() - startTime}ms`);
      
      const isAskingAboutCart = /cart|bag/i.test(normalizedText);
      const isAskingAboutWishlist = /wishlist/i.test(normalizedText);
      const isAskingPrice = /price|how much|cost|total|amount/i.test(normalizedText);

      let text = 'To add items to your cart or wishlist, please use the buttons directly on the product cards or product pages. I can help you find products if you like!';
      let productsToReturn: any[] = [];
      
      if (userContext) {
        if (isAskingAboutCart && userContext.includes('Cart items:')) {
          const cartPart = userContext.split('Cart items: ')[1]?.split('. Wishlist')[0];
          if (cartPart) {
            text = isAskingPrice 
              ? `Your cart contains: ${cartPart}. Proceed to checkout to see the final total including shipping.`
              : `Here are the items currently in your cart:`;
            productsToReturn = cart || [];
          } else {
            text = "Your cart is currently empty.";
          }
        } else if (isAskingAboutWishlist && userContext.includes('Wishlist items:')) {
          const wishPart = userContext.split('Wishlist items: ')[1];
          if (wishPart) {
            text = isAskingPrice
              ? `Here are the prices for the items in your wishlist: ${wishPart}.`
              : `Here are the items currently in your wishlist:`;
            productsToReturn = wishlist || [];
          } else {
             text = "Your wishlist is currently empty.";
          }
        } else if (isAskingAboutCart) {
          text = "Your cart is currently empty.";
        } else if (isAskingAboutWishlist) {
          text = "Your wishlist is currently empty.";
        }
      } else {
         if (isAskingAboutCart) text = "Your cart is currently empty.";
         else if (isAskingAboutWishlist) text = "Your wishlist is currently empty.";
      }

      // If returning products, limit to 4 for cleaner UI
      return NextResponse.json({
        text,
        products: productsToReturn.slice(0, 4),
        orderInfo: null,
        fallback: false,
      });
    }

    // ── Layer 3: AI Fallback ───────────────────────────────────────────────
    // If we reach here, we actually need the AI

    // Optional: Pre-fetch candidates to give the AI context without requiring a tool call round-trip
    let preFilteredProducts: any[] = [];
    if (intent === 'AI_RECOMMENDATION' || intent === 'UNKNOWN' || intent === 'PRODUCT_SEARCH') {
      const categoryFilters = detectCategory(normalizedText);
      const priceFilters = extractPrice(normalizedText);
      
      if (Object.keys(categoryFilters).length > 0 || Object.keys(priceFilters).length > 0) {
        const searchResult = await searchProducts({
          ...categoryFilters,
          ...priceFilters,
          limit: 4,
        });
        if (searchResult.found) {
          preFilteredProducts = searchResult.products;
        }
      }
    }

    // Call the new 3-tier token-efficient router
    const routerResult = await getResponse(normalizedText, messages);
    console.log(`[CHATBOT] intent=${intent} tier=${routerResult.tier} time=${Date.now() - startTime}ms`);

    return NextResponse.json({
      text: routerResult.text,
      products: preFilteredProducts.slice(0, 4), // Max 4 cards for cleaner UI
      orderInfo: null,
      fallback: false,
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Chatbot API] Unhandled error:', errMsg);
    return NextResponse.json({
      text: "I apologise — I'm having a brief moment. Please try again, or contact us on WhatsApp at +91 75067 67452 for immediate assistance.",
      products: [],
      orderInfo: null,
      error: true,
    });
  }
}

