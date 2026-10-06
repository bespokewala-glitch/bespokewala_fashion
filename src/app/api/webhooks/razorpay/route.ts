export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import {
  sendPaymentFailureEmail,
  sendRefundEmail,
  sendOrderConfirmationEmail,
  sendNewOrderAdminEmail,
} from "@/lib/email";

/**
 * Razorpay Webhook Handler
 * -----------------------------------------------------------------------------
 * Configure this URL in your Razorpay Dashboard:
 *   Settings ? Webhooks ? Add New Webhook
 *   URL: https://yourdomain.com/api/webhooks/razorpay
 *   Secret: set RAZORPAY_WEBHOOK_SECRET in your environment
 *
 * Events to subscribe to:
 *   - payment.captured
 *   - payment.failed
 *   - order.paid
 *   - refund.created
 */
export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ message: "Webhook not configured" }, { status: 500 });
    }

    // Step 1: Verify webhook signature
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ message: "Missing signature" }, { status: 400 });
    }

    const rawBody = await request.text();
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(signature, 'utf-8');
    const isValidSignature =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValidSignature) {
      console.warn("[Razorpay Webhook] Invalid signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    // Step 2: Parse and handle event
    const event = JSON.parse(rawBody);
    const eventType: string = event.event;
    console.log(`[Razorpay Webhook] Received: ${eventType}`);

    await dbConnect();

    switch (eventType) {
      case "payment.captured": {
        const paymentId = event.payload?.payment?.entity?.id;
        const razorpayOrderId = event.payload?.payment?.entity?.order_id;
        if (paymentId && razorpayOrderId) {
          const updated = await Order.findOneAndUpdate(
            {
              $or: [{ razorpayPaymentId: paymentId }, { razorpayOrderId }],
              paymentStatus: { $ne: "completed" },
            },
            { $set: { paymentStatus: "completed", razorpayPaymentId: paymentId, orderStatus: "confirmed" } },
            { new: true }
          );
          if (updated) {
            console.log(`[Razorpay Webhook] payment.captured: Order ${updated._id} marked completed`);
            // Transactional emails if order was completed via webhook
            const customerEmail = updated.shippingDetails?.email;
            const emailData = {
              orderId: updated._id.toString(),
              items: updated.items,
              shippingDetails: updated.shippingDetails,
              subtotal: updated.subtotal,
              shippingCost: updated.shippingCost,
              total: updated.total,
              currency: updated.displayCurrency || "INR",
              paymentMethod: "Razorpay",
              razorpayPaymentId: paymentId,
            };
            if (customerEmail) {
              sendOrderConfirmationEmail(customerEmail, emailData).catch((e) =>
                console.error("[email] Webhook order confirmation failed:", e?.message)
              );
            }
            sendNewOrderAdminEmail(emailData).catch((e) =>
              console.error("[email] Webhook admin order alert failed:", e?.message)
            );
          }
        }
        break;
      }

      case "payment.failed": {
        const razorpayOrderId = event.payload?.payment?.entity?.order_id;
        const customerEmail = event.payload?.payment?.entity?.email;
        if (razorpayOrderId) {
          const order = await Order.findOneAndUpdate(
            { razorpayOrderId, paymentStatus: "pending" },
            { $set: { paymentStatus: "failed", orderStatus: "cancelled" } },
            { new: true }
          );
          console.log(`[Razorpay Webhook] payment.failed: Order for ${razorpayOrderId} marked failed`);

          const targetEmail = customerEmail || order?.shippingDetails?.email;
          const targetName = order?.shippingDetails
            ? `${order.shippingDetails.firstName} ${order.shippingDetails.lastName}`.trim()
            : "Customer";

          if (targetEmail) {
            sendPaymentFailureEmail(targetEmail, targetName, razorpayOrderId).catch((e) =>
              console.error("[email] Payment failure email failed:", e?.message)
            );
          }
        }
        break;
      }

      case "order.paid": {
        const razorpayOrderId = event.payload?.order?.entity?.id;
        const paymentId = event.payload?.payment?.entity?.id;
        if (razorpayOrderId) {
          const updated = await Order.findOneAndUpdate(
            { razorpayOrderId, paymentStatus: { $ne: "completed" } },
            { $set: { paymentStatus: "completed", ...(paymentId ? { razorpayPaymentId: paymentId } : {}), orderStatus: "confirmed" } },
            { new: true }
          );
          console.log(`[Razorpay Webhook] order.paid: ${razorpayOrderId} confirmed`);
        }
        break;
      }

      case "refund.created": {
        const paymentId = event.payload?.refund?.entity?.payment_id;
        const refundId = event.payload?.refund?.entity?.id;
        const refundAmount = event.payload?.refund?.entity?.amount;
        const amountRupees = refundAmount ? refundAmount / 100 : 0;
        console.log(`[Razorpay Webhook] refund.created: ${refundId} for payment ${paymentId}, amount: Rs.${amountRupees.toFixed(2)}`);

        if (paymentId) {
          const order = await Order.findOne({ razorpayPaymentId: paymentId });
          if (order && order.shippingDetails?.email) {
            const customerName = `${order.shippingDetails.firstName} ${order.shippingDetails.lastName}`.trim();
            sendRefundEmail(
              order.shippingDetails.email,
              customerName,
              refundId,
              amountRupees,
              order._id.toString()
            ).catch((e) => console.error("[email] Refund notification failed:", e?.message));
          }
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Razorpay Webhook] Error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

