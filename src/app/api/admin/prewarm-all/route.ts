/**
 * /api/admin/prewarm-all - One-time backfill to pre-generate all image variants
 *
 * Call this ONCE after deploying to generate variants for all existing products.
 * Security: requires ?secret=PREWARM_SECRET query param.
 * Add PREWARM_SECRET to your .env.local / Vercel environment variables.
 *
 * Usage: curl "https://yoursite.com/api/admin/prewarm-all?secret=YOUR_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { preWarmMany } from '@/lib/preWarmVariants';

import { requireAdmin } from '@/lib/auth';
import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Rate limit this heavy operation
  const rl = await checkAdminRateLimit(req, 'adminSensitive');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.PREWARM_SECRET;
  let authorized = false;
  let actorId = 'system';
  let actorEmail = 'system@bespokewala.internal';

  if (expectedSecret && secret === expectedSecret) {
    authorized = true;
  } else {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.errorResponse && adminCheck.user) {
      authorized = true;
      actorId = adminCheck.user.userId;
      actorEmail = adminCheck.user.email;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication or valid PREWARM_SECRET required' }, { status: 401 });
  }

  await dbConnect();
  const products = await Product.find({})
    .select('_id slug images referenceImages')
    .lean();

  const total = products.length;
  let processed = 0;
  let warmed = 0;

  console.log(`[prewarm-all] Starting backfill for ${total} products...`);

  const BATCH_SIZE = 5;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (product: any) => {
        const urls: string[] = [
          ...(Array.isArray(product.images) ? product.images : []),
          product.referenceImages?.front,
          product.referenceImages?.back,
          product.referenceImages?.left,
          product.referenceImages?.right,
        ].filter(Boolean) as string[];

        if (urls.length > 0) {
          await preWarmMany(urls);
          warmed += urls.length;
          console.log(`[prewarm-all] Processed: ${product.slug} (${urls.length} images)`);
        }
        processed++;
      }),
    );
  }

  await logAdminAction({
    actor_id: actorId,
    actor_email: actorEmail,
    action: 'system.settings_updated',
    target_type: 'system',
    meta: {
      operation: 'prewarm_all_images',
      totalProducts: total,
      processed,
      imageUrlsWarmed: warmed,
    },
    req,
  });

  return NextResponse.json({
    success: true,
    totalProducts: total,
    processed,
    imageUrlsWarmed: warmed,
    message: `Pre-warmed variants for ${processed} products (${warmed} image URLs).`,
  });
}

