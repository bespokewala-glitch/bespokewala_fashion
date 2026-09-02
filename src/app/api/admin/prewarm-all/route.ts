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

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.PREWARM_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  return NextResponse.json({
    success: true,
    totalProducts: total,
    processed,
    imageUrlsWarmed: warmed,
    message: `Pre-warmed variants for ${processed} products (${warmed} image URLs).`,
  });
}
