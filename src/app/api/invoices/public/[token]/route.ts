export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Invoice from '@/models/Invoice';
import { invoiceFilename, renderInvoiceBytes, verifyInvoiceToken } from '@/lib/invoice/service';

/**
 * GET /api/invoices/public/:token
 * Expiring, HMAC-signed link used as the WhatsApp document URL (Meta's servers
 * fetch the PDF without a login cookie). The token only grants access to ONE
 * invoice and expires after 30 days.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const invoiceId = verifyInvoiceToken(token);
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: 'Link is invalid or has expired.' }, { status: 404 });
    }

    await dbConnect();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const bytes = await renderInvoiceBytes(invoice);
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoiceFilename(invoice.invoiceNumber)}"`,
        'Cache-Control': 'private, max-age=300',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e: any) {
    console.error('[invoice] public download failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to load invoice.' }, { status: 500 });
  }
}
