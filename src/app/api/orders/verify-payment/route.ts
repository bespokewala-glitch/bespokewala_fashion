import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { sendMetaEvent } from "@/lib/metaConversions";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      shippingDetails,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ message: "Missing payment verification fields" }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature — critical security step
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ message: "Payment gateway not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ message: "Payment verification failed: invalid signature" }, { status: 400 });
    }

    // Signature valid — now create the order in DB
    await dbConnect();

    let calculatedSubtotal = 0;
    const finalItems = [];

    const productSlugs = items.map((i: any) => {
      if (!i.productSlug) throw new Error("Product slug is required");
      return i.productSlug;
    });

    const products = await Product.find({ slug: { $in: productSlugs } }).lean();
    const productMap = new Map(products.map((p: any) => [p.slug, p]));

    for (const item of items) {
      const product = productMap.get(item.productSlug);
      if (!product) {
        return NextResponse.json({ message: `Product not found: ${item.productSlug}` }, { status: 404 });
      }
      calculatedSubtotal += product.price * item.quantity;
      finalItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: item.image || (product.images && product.images[0]) || "",
        size: item.size,
      });
    }

    const calculatedShipping = calculatedSubtotal > 10000 ? 0 : 500;
    const calculatedTotal = calculatedSubtotal + calculatedShipping;

    let userId = (user as any).userId || (user as any).id;
    if (userId && typeof userId === 'object' && userId.buffer) {
      userId = Buffer.from(Object.values(userId.buffer)).toString('hex');
    } else if (userId) {
      userId = userId.toString();
    }

    const newOrder = await Order.create({
      user: userId || null,
      items: finalItems,
      shippingDetails,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayOrderId,
      razorpayPaymentId,
      orderStatus: "confirmed",
      subtotal: calculatedSubtotal,
      shippingCost: calculatedShipping,
      total: calculatedTotal,
    });

    // --- META CONVERSIONS API: Purchase Event ---
    const eventId = `purchase_${newOrder._id.toString()}`;
    await sendMetaEvent({
      eventName: "Purchase",
      eventId,
      sourceUrl: request.headers.get("referer") || "",
      clientIp: request.headers.get("x-forwarded-for") || undefined,
      clientUserAgent: request.headers.get("user-agent") || undefined,
      userData: {
        email: shippingDetails?.email,
        phone: shippingDetails?.phone,
        firstName: shippingDetails?.firstName,
        lastName: shippingDetails?.lastName,
        city: shippingDetails?.city,
        state: shippingDetails?.state,
        zipCode: shippingDetails?.zipCode,
        country: shippingDetails?.country || "India",
      },
      customData: {
        value: calculatedTotal,
        currency: "INR",
        content_ids: items.map((i: any) => i.productSlug),
        content_type: "product",
        num_items: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
      },
    });
    // ---------------------------------------------

    return NextResponse.json(
      { success: true, orderId: newOrder._id.toString(), message: "Payment verified and order placed" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
