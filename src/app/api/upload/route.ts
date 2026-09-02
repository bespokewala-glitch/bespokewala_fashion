import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';

// ─── Thumbnail sizes generated eagerly at upload time ─────────────────────────
// These match the variants checked by /api/media/[...path]/route.ts.
// Pre-generating them here means the storefront NEVER has to generate them
// on-demand inside a cold Vercel function — which was the root cause of the
// 2–2.4 second TTFB per image on the storefront.
const THUMBNAIL_VARIANTS = [
  { name: 'micro',     width: 120,  quality: 70  },
  { name: 'thumbnail', width: 600,  quality: 80  },
  { name: 'medium',    width: 1000, quality: 85  },
  { name: 'large',     width: 1600, quality: 85  },
] as const;

/**
 * Generate a single webp variant from an image buffer and save it to GCS.
 * Errors are caught and logged — they must NOT fail the upload response.
 */
async function generateAndSaveVariant(
  originalBuffer: Buffer,
  gcsKey: string,
  variantName: string,
  width: number,
  quality: number,
): Promise<void> {
  const variantPath = `_variants/${variantName}/${gcsKey}.webp`;
  try {
    const sharp = (await import('sharp')).default;
    const optimized = await sharp(originalBuffer)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    await bucket.file(variantPath).save(optimized, {
      contentType: 'image/webp',
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });

    console.log(`[upload] ✅ Pre-generated variant: ${variantPath} (${optimized.length} bytes)`);
  } catch (err) {
    // Non-fatal: log only. The /api/media route will serve the original as fallback.
    console.error(`[upload] ⚠️  Failed to pre-generate variant "${variantPath}":`, err instanceof Error ? err.message : err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'The uploaded file is empty (0 bytes). If using a cloud drive, please ensure the file is fully downloaded to your device before uploading.' },
        { status: 400 }
      );
    }

    // Sanitize filename: replace spaces and special chars
    const safeName       = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const uniqueFilename = `${Date.now()}-${safeName}`;
    const gcsKey         = `uploads/${uniqueFilename}`;

    // ── Step 1: Upload original to GCS ────────────────────────────────────────
    const gcsFile = bucket.file(gcsKey);
    await gcsFile.save(buffer, {
      contentType: file.type || 'application/octet-stream',
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });
    console.log(`[upload] ✅ Uploaded original: ${gcsKey} (${buffer.length} bytes)`);

    // ── Step 2: Pre-generate webp variants for image files ────────────────────
    // This runs BEFORE returning the response, so by the time the product is
    // published and appears in the storefront, thumbnails ALREADY exist in GCS.
    // The /api/media route can then serve them instantly with zero on-demand work.
    const isImage = /\.(jpg|jpeg|png|webp|avif)$/i.test(file.name);
    if (isImage) {
      // Generate thumbnail and medium in parallel — both are small operations.
      // We await both so we know they succeeded before returning a 201.
      await Promise.allSettled(
        THUMBNAIL_VARIANTS.map(v =>
          generateAndSaveVariant(buffer, gcsKey, v.name, v.width, v.quality)
        )
      );
    }

    // ── Step 3: Return the proxy URL ──────────────────────────────────────────
    // IMPORTANT: Return the internal proxy URL, NOT a direct GCS CDN URL.
    // The GCS bucket is PRIVATE. Direct GCS URLs return 403 in the browser.
    // The /api/media/[...path] route authenticates with GCS server-side and
    // streams the file bytes back to the browser securely.
    const mediaUrl = `/api/media/${gcsKey}`;
    return NextResponse.json({ success: true, videoUrl: mediaUrl, mediaUrl }, { status: 201 });

  } catch (error: any) {
    console.error('[upload] Error uploading file to GCS:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
