/**
 * WhatsApp delivery via the Meta WhatsApp Business Cloud API.
 *
 * WhatsApp does NOT allow a business to start a conversation with a free-form
 * message / PDF. The first message to a customer must use a pre-approved
 * TEMPLATE. Create one in Meta Business Manager → WhatsApp Manager → Message
 * templates with:
 *   - Category: UTILITY
 *   - Header:   DOCUMENT   (this is where the invoice PDF goes)
 *   - Body:     "Hi {{1}}, thank you for your Bespokewala order #{{2}}.
 *                Your GST invoice is attached."
 *
 * Required env vars (feature is silently skipped when any is missing):
 *   WHATSAPP_ACCESS_TOKEN          Permanent system-user token
 *   WHATSAPP_PHONE_NUMBER_ID       Sender phone-number ID
 *   WHATSAPP_INVOICE_TEMPLATE      Approved template name
 *   WHATSAPP_TEMPLATE_LANG         Template language code (default "en")
 */

export interface WhatsAppResult { success: boolean; skipped?: boolean; error?: string; messageId?: string; }

export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_INVOICE_TEMPLATE
  );
}

/** Normalise to E.164 digits without '+'. Assumes India for bare 10-digit numbers. */
export function normalizeWhatsAppNumber(raw?: string | null): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

export async function sendInvoiceWhatsApp(args: {
  to: string;
  customerName: string;
  orderShortId: string;
  documentUrl: string;
  filename: string;
}): Promise<WhatsAppResult> {
  if (!isWhatsAppConfigured()) return { success: false, skipped: true, error: 'WhatsApp not configured' };

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: args.to,
        type: 'template',
        template: {
          name: process.env.WHATSAPP_INVOICE_TEMPLATE,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [
            {
              type: 'header',
              parameters: [{ type: 'document', document: { link: args.documentUrl, filename: args.filename } }],
            },
            {
              type: 'body',
              parameters: [
                { type: 'text', text: (args.customerName.split(' ')[0] || 'there').slice(0, 60) },
                { type: 'text', text: args.orderShortId },
              ],
            },
          ],
        },
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error?.message || `WhatsApp API ${res.status}` };
    }
    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'WhatsApp request failed' };
  }
}
