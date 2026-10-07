export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import https from "https";
import { validateAddress } from "@/lib/addressValidation";
import dbConnect from "@/lib/mongoose";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { isStockEnforced } from "@/lib/inventory";

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const body = await request.json();
    const { items, currency = "INR", shippingDetails } = body;

    // ── Validate cart items ──────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.productSlug) {
        return NextResponse.json({ message: "Product slug is required for all items" }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ message: `Invalid quantity for item: ${item.productSlug}` }, { status: 400 });
      }
    }

    // ── Validate address if provided ────────────────────────────────────────
    if (shippingDetails) {
      const valRes = await validateAddress(shippingDetails);
      if (!valRes.isValid) {
        return NextResponse.json({ message: valRes.message || "Invalid address provided." }, { status: 400 });
      }
    }

    // ── Server-side price calculation & stock check ─────────────────────────
    await dbConnect();
    const productSlugs = items.map((i: any) => i.productSlug);
    const products = await Product.find({ slug: { $in: productSlugs } })
      .select("slug price name images inventoryCount")
      .lean();
    const productMap = new Map((products as any[]).map((p: any) => [p.slug, p]));

    let calculatedSubtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.productSlug);
      if (!product) {
        return NextResponse.json({ message: `Product not found: ${item.productSlug}` }, { status: 404 });
      }
      // Stock blocking is opt-in (ENFORCE_STOCK_LIMITS=true). Bespoke/made-to-order items
      // legitimately have inventoryCount missing or 0, so by default we do not block them.
      if (isStockEnforced() && typeof product.inventoryCount === 'number' && product.inventoryCount < item.quantity) {
        return NextResponse.json({ message: `"${product.name}" is currently out of stock.` }, { status: 400 });
      }
      calculatedSubtotal += (product as any).price * item.quantity;
    }

    const shippingCost = 0; // Free shipping — update when shipping logic is added
    const authorativeTotal = calculatedSubtotal + shippingCost;

    if (authorativeTotal <= 0) {
      return NextResponse.json({ message: "Order total must be greater than zero" }, { status: 400 });
    }

    // ── Create Razorpay order with server-calculated amount ──────────────────
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials missing");
      return NextResponse.json({ message: "Payment gateway not configured" }, { status: 500 });
    }

    const razorpayOrder = await createRazorpayOrder(
      { amount: Math.round(authorativeTotal * 100), currency, receipt: `receipt_${Date.now()}` },
      keyId,
      keySecret
    );

    // ── Persist pending order in MongoDB to protect against orphaned payments ─
    try {
      const orderItems = items.map((item: any) => {
        const product = productMap.get(item.productSlug);
        return {
          productId: product?._id,
          productSlug: item.productSlug,
          name: product?.name || item.name || "Bespoke Creation",
          price: product?.price || 0,
          quantity: item.quantity,
          image: item.image || (product?.images && product.images[0]) || "",
          size: item.size,
        };
      });

      let userId = (user as any)?.userId || (user as any)?.id;
      if (userId && typeof userId === 'object' && userId.buffer) {
        userId = Buffer.from(Object.values(userId.buffer)).toString('hex');
      } else if (userId) {
        userId = userId.toString();
      }

      await Order.create({
        user: userId || null,
        items: orderItems,
        shippingDetails,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        orderStatus: "pending",
        subtotal: calculatedSubtotal,
        shippingCost,
        total: authorativeTotal,
        razorpayOrderId: razorpayOrder.id,
        displayCurrency: currency || "INR",
        exchangeRate: 1,
        displaySubtotal: calculatedSubtotal,
        displayShippingCost: shippingCost,
        displayTotal: authorativeTotal,
      });
    } catch (orderSaveErr) {
      console.error("Warning: Failed to persist pending order in MongoDB:", orderSaveErr);
      // Non-fatal for client: verify-payment fallback will still attempt creation
    }

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,       // paise — authoritative server amount
      currency: razorpayOrder.currency,
      razorpayKeyId: keyId,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { message: "Unable to initiate payment session. Please try again or contact concierge support." },
      { status: 500 }
    );
  }
}

function createRazorpayOrder(
  data: { amount: number; currency: string; receipt: string },
  keyId: string,
  keySecret: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const body = JSON.stringify(data);
    const options: https.RequestOptions = {
      hostname: "api.razorpay.com",
      path: "/v1/orders",
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => { responseData += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.description || `Razorpay API error: ${res.statusCode}`));
          }
        } catch {
          reject(new Error("Failed to parse Razorpay response"));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}



