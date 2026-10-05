import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { sendMetaEvent } from "@/lib/metaConversions";
import { validateAddress } from "@/lib/addressValidation";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      shippingDetails,
      displayCurrency,
      exchangeRate,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ message: "Missing payment verification fields" }, { status: 400 });
    }

    if (shippingDetails) {
      const valRes = await validateAddress(shippingDetails);
      if (!valRes.isValid) {
        return NextResponse.json({ message: valRes.message || "Invalid address provided." }, { status: 400 });
      }
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

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(razorpaySignature, 'utf-8');
    const isValidSignature =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValidSignature) {
      return NextResponse.json({ message: "Payment verification failed: invalid signature" }, { status: 400 });
    }

    await dbConnect();

    // ── Idempotency: prevent duplicate orders for same payment ID ─────────────
    const existingOrder = await Order.findOne({ razorpayPaymentId }).lean();
    if (existingOrder) {
      return NextResponse.json(
        { success: true, orderId: (existingOrder as any)._id.toString(), message: "Order already exists" },
        { status: 200 }
      );
    }

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

    const calculatedShipping = 0;
    const calculatedTotal = calculatedSubtotal + calculatedShipping;

    // ── Cross-check: fetch Razorpay order to verify amount was not tampered ───
    try {
      const keyId = process.env.RAZORPAY_KEY_ID;
      if (keyId && keySecret) {
        const rzpOrderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
          headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
        });
        if (rzpOrderRes.ok) {
          const rzpOrder = await rzpOrderRes.json();
          const rzpAmountInRupees = rzpOrder.amount / 100;
          if (Math.abs(rzpAmountInRupees - calculatedTotal) > 1) {
            console.error(`Amount mismatch: Razorpay=${rzpAmountInRupees}, Calculated=${calculatedTotal}`);
            return NextResponse.json({ message: "Payment amount mismatch. Please contact support." }, { status: 400 });
          }
        }
      }
    } catch (e) {
      console.warn("Razorpay amount cross-check failed (non-fatal):", e);
    }

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
      paymentStatus: "completed",   // enum: pending | completed | failed
      razorpayOrderId,
      razorpayPaymentId,
      orderStatus: "confirmed",
      subtotal: calculatedSubtotal,
      shippingCost: calculatedShipping,
      total: calculatedTotal,
      displayCurrency: displayCurrency || "INR",
      exchangeRate: exchangeRate || 1,
      displaySubtotal: calculatedSubtotal * (exchangeRate || 1),
      displayShippingCost: calculatedShipping * (exchangeRate || 1),
      displayTotal: calculatedTotal * (exchangeRate || 1),
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

    // ── Transactional emails (non-fatal) ─────────────────────────────────────
    const emailData = {
      orderId: newOrder._id.toString(),
      items: finalItems,
      shippingDetails,
      subtotal: calculatedSubtotal,
      shippingCost: calculatedShipping,
      total: calculatedTotal,
      currency: displayCurrency || 'INR',
      paymentMethod: 'Razorpay',
      razorpayPaymentId,
    };

    const customerEmail = shippingDetails?.email;
    if (customerEmail) {
      sendOrderConfirmationEmail(customerEmail, emailData).catch((e) =>
        console.error('[email] Order confirmation failed:', e?.message)
      );
    }
    sendNewOrderAdminEmail(emailData).catch((e) =>
      console.error('[email] Admin order alert failed:', e?.message)
    );
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json(
      { success: true, orderId: newOrder._id.toString(), message: "Payment verified and order placed" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { message: "Payment verification encountered an unexpected error. If your account was debited, our concierge team will verify and confirm your order shortly." },
      { status: 500 }
    );
  }
}

