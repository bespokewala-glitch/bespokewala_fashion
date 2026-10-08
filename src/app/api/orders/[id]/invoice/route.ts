export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { renderInvoiceForOrder } from '@/lib/invoice/service';

/**
 * GET /api/orders/:id/invoice
 * Streams the GST invoice PDF. Only the order's owner (or an admin) may download it.
 * Add ?inline=1 to open in the browser instead of downloading.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    await dbConnect();
    const order: any = await Order.findById(id).select('user paymentStatus').lean();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const userId = String((user as any).userId || (user as any).id || '');
    const isOwner = order.user && String(order.user) === userId;
    const isAdmin = (user as any).role === 'admin';
    if (!isOwner && !isAdmin) {
      // 404 (not 403) so order ids can't be probed
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus !== 'completed') {
      return NextResponse.json({ error: 'An invoice is available once payment is confirmed.' }, { status: 409 });
    }

    const result = await renderInvoiceForOrder(id);
    if (!result) return NextResponse.json({ error: 'Invoice could not be generated.' }, { status: 500 });

    const inline = new URL(request.url).searchParams.get('inline') === '1';
    return new Response(Buffer.from(result.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${result.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e: any) {
    console.error('[invoice] download failed:', e?.message || e);
    return NextResponse.json({ error: 'Failed to generate invoice.' }, { status: 500 });
  }
}
