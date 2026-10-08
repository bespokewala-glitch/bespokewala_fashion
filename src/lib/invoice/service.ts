/**
 * Invoice service — issue (idempotent), render, sign download links, deliver.
 *
 * Entry points:
 *   issueInvoiceForOrder(orderId)      create the snapshot if missing (never duplicates)
 *   issueAndDeliverInvoice(orderId)    issue + email + WhatsApp (each claimed atomically)
 *   renderInvoiceForOrder(orderId)     PDF bytes for account / admin downloads
 *   signInvoiceToken / verifyInvoiceToken   expiring public link for WhatsApp
 */

import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Invoice, { InvoiceCounter } from '@/models/Invoice';
import { getSiteUrl } from '@/lib/auth';
import { sendInvoiceEmail } from '@/lib/email';
import { isWhatsAppConfigured, normalizeWhatsAppNumber, sendInvoiceWhatsApp } from '@/lib/whatsapp';
import { amountInWords, computeLines, computeTotals, fiscalYearLabel } from './calc';
import { getSellerProfile, normalizeState, resolveTaxClass, stateCodeFor } from './config';
import { renderInvoicePdf } from './pdf';

const TOKEN_TTL_DAYS = 30;

// ─── Signed public links ──────────────────────────────────────────────────────

function linkSecret(): string {
  const s = process.env.INVOICE_LINK_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('[invoice] INVOICE_LINK_SECRET or JWT_SECRET must be set');
    return 'dev-only-invoice-link-secret';
  }
  return s;
}

const sign = (payload: string) =>
  crypto.createHmac('sha256', linkSecret()).update(payload).digest('base64url');

export function signInvoiceToken(invoiceId: string, ttlDays = TOKEN_TTL_DAYS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 86400;
  const payload = `${invoiceId}.${exp}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

export function verifyInvoiceToken(token: string): string | null {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return null;
    const payload = Buffer.from(b64, 'base64url').toString('utf8');
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const [invoiceId, exp] = payload.split('.');
    if (!invoiceId || !exp || Number(exp) < Math.floor(Date.now() / 1000)) return null;
    return invoiceId;
  } catch {
    return null;
  }
}

// ─── Issue ────────────────────────────────────────────────────────────────────

async function nextInvoiceNumber(issuedAt: Date) {
  const fiscalYear = fiscalYearLabel(issuedAt);
  const counter: any = await InvoiceCounter.findOneAndUpdate(
    { _id: fiscalYear },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const sequence = counter.seq as number;
  return { fiscalYear, sequence, invoiceNumber: `BW/${fiscalYear}/${String(sequence).padStart(6, '0')}` };
}

/** Creates the invoice snapshot for a PAID order. Returns the existing one if already issued. */
export async function issueInvoiceForOrder(orderId: string): Promise<any | null> {
  await dbConnect();

  const existing = await Invoice.findOne({ order: orderId });
  if (existing) return existing;

  const order: any = await Order.findById(orderId).lean();
  if (!order || order.paymentStatus !== 'completed') return null;

  const seller = getSellerProfile();
  const ship = order.shippingDetails || {};
  const user: any = order.user ? await User.findById(order.user).select('name email mobileNumber').lean() : null;

  const productIds = (order.items || []).map((i: any) => i.productId).filter(Boolean);
  const products: any[] = await Product.find({ _id: { $in: productIds } })
    .select('productType category details.styleCode slug')
    .lean();
  const pMap = new Map(products.map((p) => [String(p._id), p]));

  const buyerState = ship.state || '';
  const buyerStateCode = stateCodeFor(buyerState);
  const sellerStateNorm = normalizeState(seller.state);
  const interState = !!buyerState && normalizeState(buyerState) !== sellerStateNorm;

  const rawLines = (order.items || []).map((it: any) => {
    const p = pMap.get(String(it.productId));
    const cls = resolveTaxClass(p?.productType, p?.category);
    return {
      description: it.name,
      sku: p?.details?.styleCode || undefined,
      size: it.size || undefined,
      hsn: cls.hsn,
      quantity: it.quantity,
      unitPriceInclusive: it.price,
      gstRate: cls.rateFor(it.price),
    };
  });

  const lines = computeLines(rawLines, interState, order.shippingCost || 0);
  const totals = computeTotals(lines);

  const issuedAt = new Date();
  const buyerName = `${ship.firstName || ''} ${ship.lastName || ''}`.trim() || user?.name || 'Customer';

  const base = {
    order: order._id,
    user: order.user || undefined,
    issuedAt,
    seller,
    buyer: {
      name: buyerName,
      email: ship.email || user?.email,
      phone: ship.phone || user?.mobileNumber,
      addressLines: [
        ship.address,
        [ship.city, ship.state, ship.zipCode].filter(Boolean).join(', '),
        ship.country,
      ].filter(Boolean),
      state: buyerState,
      stateCode: buyerStateCode,
    },
    placeOfSupply: buyerState || seller.state,
    isInterState: interState,
    lines,
    totals,
    amountInWords: amountInWords(totals.grandTotal),
    paymentMethod: order.paymentMethod === 'razorpay' ? 'Razorpay' : order.paymentMethod,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
  };

  // Retry once if two requests race to create the same invoice (unique index on `order`).
  for (let attempt = 0; attempt < 2; attempt++) {
    const num = await nextInvoiceNumber(issuedAt);
    try {
      return await Invoice.create({ ...base, ...num });
    } catch (e: any) {
      if (e?.code === 11000) {
        const dup = await Invoice.findOne({ order: orderId });
        if (dup) return dup;
        continue;
      }
      throw e;
    }
  }
  return null;
}

// ─── Render ───────────────────────────────────────────────────────────────────

export async function renderInvoiceBytes(invoice: any): Promise<Uint8Array> {
  const plain = typeof invoice.toObject === 'function' ? invoice.toObject() : invoice;
  return renderInvoicePdf(plain);
}

export function invoiceFilename(invoiceNumber: string) {
  return `Invoice-${invoiceNumber.replace(/[\/\\]/g, '-')}.pdf`;
}

/** Used by account/admin downloads — lazily issues for paid orders that pre-date this feature. */
export async function renderInvoiceForOrder(orderId: string) {
  const invoice = await issueInvoiceForOrder(orderId);
  if (!invoice) return null;
  return { invoice, bytes: await renderInvoiceBytes(invoice), filename: invoiceFilename(invoice.invoiceNumber) };
}

// ─── Deliver ──────────────────────────────────────────────────────────────────

/**
 * Issue (if needed) and send the invoice to the customer by email + WhatsApp.
 * Safe to call from several places (verify-payment, webhooks): each channel is
 * claimed with an atomic update so it is attempted at most once at a time and
 * never repeated after success. Never throws — failures are logged.
 */
export async function issueAndDeliverInvoice(orderId: string): Promise<void> {
  try {
    const invoice: any = await issueInvoiceForOrder(orderId);
    if (!invoice) return;

    const buyer = invoice.buyer || {};
    const shortId = String(orderId).slice(-8).toUpperCase();
    const site = getSiteUrl();
    const bytes = await renderInvoiceBytes(invoice);

    // ── Email ──
    if (buyer.email) {
      const claimed = await Invoice.findOneAndUpdate(
        { _id: invoice._id, 'delivery.emailSentAt': null },
        { $set: { 'delivery.emailSentAt': new Date(), 'delivery.emailTo': buyer.email } }
      );
      if (claimed) {
        const res = await sendInvoiceEmail(
          buyer.email,
          buyer.name || 'Customer',
          { orderId: String(orderId), invoiceNumber: invoice.invoiceNumber, total: invoice.totals.grandTotal, accountUrl: `${site}/account/orders` },
          bytes
        );
        if (!res.success) {
          await Invoice.updateOne({ _id: invoice._id }, { $set: { 'delivery.emailSentAt': null } });
          console.error('[invoice] email failed:', res.error);
        }
      }
    }

    // ── WhatsApp ──
    if (isWhatsAppConfigured()) {
      const isLocal = /localhost|127\.0\.0\.1/.test(site);
      if (isLocal) {
        console.warn('[invoice] WhatsApp skipped: SITE_URL is not publicly reachable (Meta must be able to fetch the PDF).');
      } else {
        // Prefer the delivery phone, fall back to the number registered on the account.
        const user: any = invoice.user ? await User.findById(invoice.user).select('mobileNumber').lean() : null;
        const candidates = Array.from(
          new Set([normalizeWhatsAppNumber(buyer.phone), normalizeWhatsAppNumber(user?.mobileNumber)].filter(Boolean) as string[])
        );

        if (candidates.length) {
          const claimed = await Invoice.findOneAndUpdate(
            { _id: invoice._id, 'delivery.whatsappSentAt': null },
            { $set: { 'delivery.whatsappSentAt': new Date() } }
          );
          if (claimed) {
            const documentUrl = `${site}/api/invoices/public/${signInvoiceToken(String(invoice._id))}`;
            let sentTo: string | null = null;
            let lastErr = '';
            for (const to of candidates) {
              const r = await sendInvoiceWhatsApp({
                to,
                customerName: buyer.name || 'Customer',
                orderShortId: shortId,
                documentUrl,
                filename: invoiceFilename(invoice.invoiceNumber),
              });
              if (r.success) { sentTo = to; break; }
              lastErr = r.error || 'unknown error';
            }
            await Invoice.updateOne(
              { _id: invoice._id },
              sentTo
                ? { $set: { 'delivery.whatsappTo': sentTo, 'delivery.whatsappError': null } }
                : { $set: { 'delivery.whatsappSentAt': null, 'delivery.whatsappError': lastErr } }
            );
            if (!sentTo) console.error('[invoice] WhatsApp failed:', lastErr);
          }
        }
      }
    }
  } catch (e: any) {
    console.error('[invoice] issue/deliver failed:', e?.message || e);
  }
}
