/**
 * email.ts — Nodemailer transporter + ALL branded transactional email templates.
 *
 * Required env vars:
 *   SMTP_HOST        — e.g. smtp.gmail.com
 *   SMTP_PORT        — e.g. 587
 *   SMTP_USER        — sender address / Gmail account
 *   SMTP_PASS        — app password (NOT your Gmail login password)
 *   EMAIL_FROM       — display name + address, e.g. "Bespokewala <no-reply@bespokewala.com>"
 *   EMAIL_ADMIN_TO   — admin email(s) for order/system notifications (comma-separated)
 *
 * Gmail quick-start:
 *   1. Enable 2-Step Verification on your Google account.
 *   2. Create an App Password (Google Account → Security → App Passwords).
 *   3. Use that 16-char password as SMTP_PASS.
 *
 * Email categories implemented:
 *   Account  : OTP (login + reset), welcome/registration, login security alert
 *   Orders   : Order confirmation (customer), new order (admin)
 *   Status   : production, dispatched, delivered, cancelled
 *   Payment  : payment failure, refund initiated
 */

import nodemailer, { Transporter } from 'nodemailer';

// ─── Transporter (lazy singleton) ─────────────────────────────────────────────

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      '[email] SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local.'
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });

  return _transporter;
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const B = {
  name: 'Bespokewala',
  color: '#1a1a1a',
  accent: '#c8a96e',
  accentLight: '#f5edd8',
  bg: '#f8f5f0',
  muted: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://bespokewala.com',
};

// ─── Layout helpers ────────────────────────────────────────────────────────────

function wrap(content: string, footerNote?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${B.name}</title>
</head>
<body style="margin:0;padding:0;background:${B.bg};font-family:${B.fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${B.bg};padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);max-width:580px;">
        <!-- Header -->
        <tr>
          <td style="background:${B.color};padding:26px 40px;text-align:center;">
            <a href="${B.siteUrl}" style="text-decoration:none;">
              <span style="color:${B.accent};font-size:20px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">${B.name}</span>
            </a>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f3efe9;padding:20px 40px;text-align:center;border-top:1px solid #e8e2da;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;">
              ${footerNote || `You received this email from ${B.name}.`}
            </p>
            <p style="margin:0;font-size:12px;color:#bbb;">
              &copy; ${new Date().getFullYear()} ${B.name}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${B.color};">${text}</h1>`;
}

function para(text: string, style = ''): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;${style}">${text}</p>`;
}

function ctaButton(label: string, href: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:${B.color};color:${B.accent};text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:14px 36px;border-radius:4px;">${label}</a>
  </div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #ede8e2;margin:24px 0;" />`;
}

function badge(text: string, color = B.accent): string {
  return `<span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 10px;border-radius:20px;">${text}</span>`;
}

// ─── Order summary table ───────────────────────────────────────────────────────

interface OrderItem { name: string; quantity: number; price: number; size?: string; }
interface ShippingDetails { firstName: string; lastName: string; address: string; city: string; state: string; zipCode: string; country: string; phone: string; email?: string; }

function orderItemsTable(items: OrderItem[], subtotal: number, shippingCost: number, total: number, currency = '₹'): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;font-size:14px;color:#333;">
        ${item.name}${item.size ? ` <span style="color:#999;font-size:12px;">(${item.size})</span>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;font-size:14px;color:#666;text-align:center;">×${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;font-size:14px;color:#333;text-align:right;font-weight:600;">${currency}${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;">
    <thead>
      <tr>
        <th style="text-align:left;font-size:11px;color:#999;letter-spacing:0.06em;text-transform:uppercase;padding:0 0 8px;border-bottom:2px solid #ede8e2;">Item</th>
        <th style="text-align:center;font-size:11px;color:#999;letter-spacing:0.06em;text-transform:uppercase;padding:0 0 8px;border-bottom:2px solid #ede8e2;">Qty</th>
        <th style="text-align:right;font-size:11px;color:#999;letter-spacing:0.06em;text-transform:uppercase;padding:0 0 8px;border-bottom:2px solid #ede8e2;">Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:8px 0 4px;font-size:13px;color:#666;">Subtotal</td>
        <td style="padding:8px 0 4px;font-size:13px;color:#333;text-align:right;">${currency}${subtotal.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0;font-size:13px;color:#666;">Shipping</td>
        <td style="padding:4px 0;font-size:13px;color:#333;text-align:right;">${shippingCost > 0 ? `${currency}${shippingCost.toLocaleString('en-IN')}` : 'Free'}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:12px 0 0;font-size:16px;font-weight:700;color:${B.color};border-top:2px solid ${B.color};">Total</td>
        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:${B.color};text-align:right;border-top:2px solid ${B.color};">${currency}${total.toLocaleString('en-IN')}</td>
      </tr>
    </tfoot>
  </table>`;
}

function shippingBlock(s: ShippingDetails): string {
  return `
  <div style="background:${B.bg};border-radius:6px;padding:16px 20px;margin:16px 0;font-size:13px;color:#555;line-height:1.8;">
    <div style="font-weight:700;color:${B.color};margin-bottom:4px;font-size:14px;">Shipping Address</div>
    ${s.firstName} ${s.lastName}<br/>
    ${s.address}<br/>
    ${s.city}, ${s.state} ${s.zipCode}<br/>
    ${s.country}<br/>
    📞 ${s.phone}
  </div>`;
}

// ─── Core send helper ─────────────────────────────────────────────────────────

export interface SendResult { success: boolean; error?: string; }

export interface EmailAttachment { filename: string; content: Buffer | Uint8Array; contentType?: string; }

async function send(
  to: string | string[],
  subject: string,
  html: string,
  text: string,
  attachments?: EmailAttachment[]
): Promise<SendResult> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"${B.name}" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      ...(attachments?.length
        ? { attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content), contentType: a.contentType })) }
        : {}),
    });
    return { success: true };
  } catch (err: any) {
    console.error('[email] Send failed:', err?.message ?? err);
    return { success: false, error: 'Failed to deliver email. Please try again.' };
  }
}

function adminRecipients(): string[] {
  const raw = process.env.EMAIL_ADMIN_TO || process.env.SMTP_USER || '';
  return raw.split(',').map(e => e.trim()).filter(Boolean);
}

// ═════════════════════════════════════════════════════════════════════════════
// ACCOUNT EMAILS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * OTP email (login or password reset).
 * Plain OTP is NEVER logged.
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: 'login' | 'reset-password',
  expiresInMinutes = 10
): Promise<SendResult> {
  const isLogin = purpose === 'login';
  const subject = isLogin ? `Your ${B.name} login code` : `Your ${B.name} password reset code`;
  const title = isLogin ? 'Your Login Code' : 'Password Reset Code';
  const purposeLabel = isLogin ? 'sign in to your account' : 'reset your password';

  const html = wrap(`
    ${h1(title)}
    ${para(`Use the code below to ${purposeLabel}. It expires in <strong>${expiresInMinutes} minutes</strong>.`)}
    <div style="background:${B.accentLight};border:2px solid ${B.accent};border-radius:8px;padding:28px;text-align:center;margin:4px 0 28px;">
      <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:${B.color};font-family:monospace;">${otp}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#999;line-height:1.8;">
      • Valid for <strong>${expiresInMinutes} minutes</strong> only.<br/>
      • Never share this code with anyone.<br/>
      • If you did not request this, please ignore this email.
    </p>
  `, `This is a security email from ${B.name}. Do not share this code.`);

  return send(to, subject, html,
    `Your ${B.name} ${isLogin ? 'login' : 'password reset'} code: ${otp}\n\nExpires in ${expiresInMinutes} minutes. Never share this code.`
  );
}

/**
 * Welcome email sent after a new account is created.
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<SendResult> {
  const subject = `Welcome to ${B.name}, ${name.split(' ')[0]}!`;

  const html = wrap(`
    ${h1(`Welcome, ${name.split(' ')[0]}!`)}
    ${para(`Thank you for joining <strong>${B.name}</strong> — where fashion meets craftsmanship. Your account is ready.`)}
    ${ctaButton('Explore Collections', `${B.siteUrl}/products`)}
    ${divider()}
    ${para(`If you have any questions, reply to this email or contact our support team. We're here to help.`, `font-size:13px;color:#888;`)}
  `);

  return send(to, subject, html,
    `Welcome to ${B.name}, ${name}!\n\nYour account has been created. Visit ${B.siteUrl}/products to explore our collections.`
  );
}

/**
 * Security alert sent when a new login is detected.
 * Only sent for password-based logins (not OTP, not OAuth).
 */
export async function sendLoginAlertEmail(to: string, name: string, ip: string, time: Date): Promise<SendResult> {
  const subject = `New sign-in to your ${B.name} account`;
  const timeStr = time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  const html = wrap(`
    ${h1('New Sign-In Detected')}
    ${para(`Hi ${name.split(' ')[0]}, we noticed a new sign-in to your ${B.name} account.`)}
    <div style="background:${B.bg};border-radius:6px;padding:16px 20px;margin:16px 0 24px;font-size:13px;color:#555;line-height:1.8;">
      <strong>Time:</strong> ${timeStr} IST<br/>
      <strong>IP Address:</strong> ${ip}
    </div>
    ${para(`If this was you, no action is needed. If you did not sign in, please <a href="${B.siteUrl}/forgot-password" style="color:${B.color};font-weight:600;">reset your password immediately</a>.`)}
  `, `This is a security notification from ${B.name}.`);

  return send(to, subject, html,
    `Hi ${name}, a new sign-in was detected on your ${B.name} account at ${timeStr} from IP ${ip}.\n\nIf this wasn't you, reset your password at ${B.siteUrl}/forgot-password`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ORDER EMAILS — CUSTOMER
// ═════════════════════════════════════════════════════════════════════════════

export interface OrderEmailData {
  orderId: string;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency?: string;
  paymentMethod?: string;
  razorpayPaymentId?: string;
}

/**
 * Order confirmation email — sent immediately after successful payment.
 * This is the most important customer email.
 */
export async function sendOrderConfirmationEmail(to: string, order: OrderEmailData): Promise<SendResult> {
  const cur = order.currency || '₹';
  const shortId = order.orderId.slice(-8).toUpperCase();
  const subject = `Order confirmed — #${shortId} | ${B.name}`;

  const html = wrap(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:8px;">✅</div>
      ${h1('Order Confirmed!')}
      ${para(`Thank you for your purchase. Your order <strong>#${shortId}</strong> has been confirmed and is now being prepared.`)}
      ${badge('Confirmed', B.success)}
    </div>
    ${divider()}
    ${orderItemsTable(order.items, order.subtotal, order.shippingCost, order.total, cur)}
    ${divider()}
    ${shippingBlock(order.shippingDetails)}
    ${order.razorpayPaymentId ? `<p style="margin:8px 0 0;font-size:12px;color:#999;">Payment ID: ${order.razorpayPaymentId}</p>` : ''}
    ${ctaButton('Track Your Order', `${B.siteUrl}/track-order`)}
    ${divider()}
    ${para(`Our team typically takes <strong>7–14 business days</strong> for bespoke garments. We'll email you at every stage.`, `font-size:13px;color:#888;`)}
  `);

  return send(to, subject, html,
    `Order Confirmed — #${shortId}\n\nTotal: ${cur}${order.total.toLocaleString('en-IN')}\nShipping to: ${order.shippingDetails.firstName} ${order.shippingDetails.lastName}, ${order.shippingDetails.city}\n\nTrack your order: ${B.siteUrl}/track-order`
  );
}

/**
 * GST invoice email — PDF attached. Sent right after payment is confirmed.
 */
export async function sendInvoiceEmail(
  to: string,
  customerName: string,
  info: { orderId: string; invoiceNumber: string; total: number; accountUrl: string },
  pdf: Uint8Array
): Promise<SendResult> {
  const shortId = info.orderId.slice(-8).toUpperCase();
  const subject = `Your GST invoice ${info.invoiceNumber} — Order #${shortId} | ${B.name}`;
  const first = customerName.split(' ')[0] || 'there';

  const html = wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:34px;margin-bottom:8px;">🧾</div>
      ${h1('Your Invoice Is Ready')}
      ${badge(info.invoiceNumber, B.color)}
    </div>
    ${divider()}
    ${para(`Hi ${first},`)}
    ${para(`Thank you for your order <strong>#${shortId}</strong>. Your GST invoice for <strong>₹${info.total.toLocaleString('en-IN')}</strong> is attached to this email as a PDF.`)}
    ${para(`You can also download it any time from <em>My Account → Orders</em>.`, 'font-size:13px;color:#888;')}
    ${ctaButton('View My Orders', info.accountUrl)}
  `, `This is a transactional email from ${B.name}.`);

  return send(
    to,
    subject,
    html,
    `Hi ${first},\n\nYour GST invoice ${info.invoiceNumber} for order #${shortId} (₹${info.total.toLocaleString('en-IN')}) is attached.\nDownload it any time: ${info.accountUrl}`,
    [{ filename: `Invoice-${info.invoiceNumber.replace(/[\/\\]/g, '-')}.pdf`, content: pdf, contentType: 'application/pdf' }]
  );
}

/**
 * Order status update emails — sent when admin changes order status.
 */
const STATUS_CONFIG: Record<string, { emoji: string; title: string; bodyText: string; badgeColor: string; }> = {
  production: {
    emoji: '✂️',
    title: 'Your Order Is Being Crafted',
    bodyText: 'Great news! Our skilled artisans have begun work on your bespoke garment. We\'ll notify you when it moves to quality check.',
    badgeColor: '#d97706',
  },
  qc: {
    emoji: '🔍',
    title: 'Quality Check in Progress',
    bodyText: 'Your order is currently undergoing our rigorous quality inspection to ensure every stitch meets our standards.',
    badgeColor: '#7c3aed',
  },
  dispatched: {
    emoji: '📦',
    title: 'Your Order Has Been Dispatched',
    bodyText: 'Your order is on its way! Our courier partner has picked it up and it will be delivered to your address shortly.',
    badgeColor: '#2563eb',
  },
  in_transit: {
    emoji: '🚚',
    title: 'Your Order Is In Transit',
    bodyText: 'Your package is moving through our shipping network and will reach you soon.',
    badgeColor: '#0891b2',
  },
  delivered: {
    emoji: '🎉',
    title: 'Your Order Has Been Delivered!',
    bodyText: 'Your order has been delivered. We hope you love your new garment! If you have any questions or feedback, we\'d love to hear from you.',
    badgeColor: B.success,
  },
  cancelled: {
    emoji: '❌',
    title: 'Your Order Has Been Cancelled',
    bodyText: 'Your order has been cancelled. If you did not request this or have any questions, please contact our support team immediately.',
    badgeColor: B.danger,
  },
};

export async function sendOrderStatusEmail(
  to: string,
  customerName: string,
  order: Pick<OrderEmailData, 'orderId' | 'items' | 'total' | 'currency'>,
  status: string
): Promise<SendResult> {
  const config = STATUS_CONFIG[status];
  if (!config) return { success: false, error: `No email template for status: ${status}` };

  const shortId = order.orderId.slice(-8).toUpperCase();
  const cur = order.currency || '₹';
  const subject = `${config.emoji} ${config.title} — #${shortId} | ${B.name}`;

  const html = wrap(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:8px;">${config.emoji}</div>
      ${h1(config.title)}
      ${badge(status.replace('_', ' ').toUpperCase(), config.badgeColor)}
    </div>
    ${divider()}
    ${para(`Hi ${customerName.split(' ')[0]},`)}
    ${para(config.bodyText)}
    <div style="background:${B.bg};border-radius:6px;padding:14px 20px;margin:16px 0;font-size:13px;color:#555;">
      <strong>Order:</strong> #${shortId} &nbsp;|&nbsp; <strong>Total:</strong> ${cur}${order.total.toLocaleString('en-IN')}
    </div>
    ${status === 'delivered'
      ? ctaButton('Leave a Review', `${B.siteUrl}/account`)
      : ctaButton('Track Your Order', `${B.siteUrl}/track-order`)
    }
  `);

  return send(to, subject, html,
    `${config.title}\n\nOrder #${shortId} — Status: ${status}\n\nTrack: ${B.siteUrl}/track-order`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ORDER EMAILS — ADMIN / BUSINESS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * New order alert sent to the admin/business email immediately after an order is confirmed.
 */
export async function sendNewOrderAdminEmail(order: OrderEmailData): Promise<SendResult> {
  const cur = order.currency || '₹';
  const shortId = order.orderId.slice(-8).toUpperCase();
  const subject = `🛍️ New Order #${shortId} — ${cur}${order.total.toLocaleString('en-IN')} | ${B.name}`;
  const s = order.shippingDetails;

  const html = wrap(`
    ${h1(`New Order — #${shortId}`)}
    ${badge('Action Required', B.danger)}
    ${divider()}
    <div style="background:${B.accentLight};border-radius:6px;padding:16px 20px;margin:16px 0;font-size:14px;color:${B.color};line-height:1.8;">
      <strong>Customer:</strong> ${s.firstName} ${s.lastName}<br/>
      <strong>Email:</strong> ${s.email || 'N/A'}<br/>
      <strong>Phone:</strong> ${s.phone}<br/>
      <strong>Payment:</strong> ${order.paymentMethod || 'Razorpay'}${order.razorpayPaymentId ? ` (${order.razorpayPaymentId})` : ''}
    </div>
    ${orderItemsTable(order.items, order.subtotal, order.shippingCost, order.total, cur)}
    ${divider()}
    ${shippingBlock(s)}
    ${ctaButton('Manage Orders', `${B.siteUrl}/dashboard/orders`)}
  `);

  const admins = adminRecipients();
  if (admins.length === 0) return { success: false, error: 'No admin recipients configured (EMAIL_ADMIN_TO).' };
  return send(admins, subject, html,
    `New Order #${shortId}\nCustomer: ${s.firstName} ${s.lastName} (${s.email})\nTotal: ${cur}${order.total}\n\nManage: ${B.siteUrl}/dashboard/orders`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAYMENT EMAILS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Payment failure notification — sent to customer when payment.failed webhook fires.
 */
export async function sendPaymentFailureEmail(
  to: string,
  customerName: string,
  razorpayOrderId: string
): Promise<SendResult> {
  const subject = `Payment failed — action required | ${B.name}`;

  const html = wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;">⚠️</div>
    </div>
    ${h1('Payment Was Not Successful')}
    ${para(`Hi ${customerName.split(' ')[0]}, unfortunately your recent payment could not be processed.`)}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:14px 20px;margin:16px 0;font-size:13px;color:#b91c1c;">
      Your cart and items are still saved. No charges have been applied to your account.
    </div>
    ${para('Please try placing your order again. If the issue persists, contact your bank or try a different payment method.')}
    ${ctaButton('Try Again', `${B.siteUrl}/checkout`)}
  `);

  return send(to, subject, html,
    `Hi ${customerName}, your payment for order ${razorpayOrderId} failed.\n\nNo charges were applied. Please try again at ${B.siteUrl}/checkout`
  );
}

/**
 * Refund initiated notification — sent when refund.created webhook fires.
 */
export async function sendRefundEmail(
  to: string,
  customerName: string,
  refundId: string,
  amountRupees: number,
  orderId: string
): Promise<SendResult> {
  const subject = `Refund initiated — ₹${amountRupees.toLocaleString('en-IN')} | ${B.name}`;

  const html = wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;">💸</div>
    </div>
    ${h1('Refund Initiated')}
    ${para(`Hi ${customerName.split(' ')[0]}, a refund has been initiated for your order.`)}
    <div style="background:${B.bg};border-radius:6px;padding:16px 20px;margin:16px 0;font-size:14px;color:#555;line-height:1.8;">
      <strong>Refund Amount:</strong> ₹${amountRupees.toLocaleString('en-IN')}<br/>
      <strong>Refund ID:</strong> ${refundId}<br/>
      <strong>Order:</strong> #${orderId.slice(-8).toUpperCase()}
    </div>
    ${para('Refunds typically take <strong>5–7 business days</strong> to reflect in your account depending on your bank.')}
    ${para(`If you have any questions, reply to this email.`, `font-size:13px;color:#888;`)}
  `);

  return send(to, subject, html,
    `Refund Initiated\n\nHi ${customerName}, a refund of ₹${amountRupees} has been initiated.\nRefund ID: ${refundId}\n\nIt may take 5–7 business days to appear in your account.`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DIAGNOSTIC / TEST EMAIL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Verifies SMTP transport connectivity without sending an email.
 */
export async function verifySmtpConnection(): Promise<{ configured: boolean; valid: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return { configured: false, valid: false, error: 'SMTP credentials missing in environment (SMTP_HOST, SMTP_USER, SMTP_PASS).' };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { configured: true, valid: true };
  } catch (err: any) {
    return { configured: true, valid: false, error: err?.message || 'SMTP connection verification failed.' };
  }
}

/**
 * Sends a diagnostic test email to confirm real-world delivery.
 */
export async function sendTestEmail(to: string): Promise<SendResult> {
  const subject = `Bespokewala — SMTP Test Delivery (${new Date().toLocaleTimeString('en-IN')})`;
  const html = wrap(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;">✉️</div>
    </div>
    ${h1('SMTP Configuration Verified')}
    ${para('Congratulations! Your transactional email service is properly configured and successfully delivering messages.')}
    <div style="background:${B.bg};border-radius:6px;padding:16px 20px;margin:16px 0;font-size:13px;color:#555;line-height:1.8;">
      <strong>Sender:</strong> ${process.env.EMAIL_FROM || process.env.SMTP_USER}<br/>
      <strong>Host:</strong> ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'}<br/>
      <strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
    </div>
    ${ctaButton('Open Dashboard', `${B.siteUrl}/dashboard`)}
  `, 'This is an automated test message triggered from your Bespokewala Admin Dashboard.');

  return send(to, subject, html, `Bespokewala SMTP Test: Email delivery is working correctly at ${new Date().toISOString()}.`);
}

