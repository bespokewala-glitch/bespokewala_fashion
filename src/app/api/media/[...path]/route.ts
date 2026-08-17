import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';
import sharp from 'sharp';

// ─── MIME type map ────────────────────────────────────────────────────────────
const MIME_TYPES: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif:  'image/gif',
  svg:  'image/svg+xml',
  mp4:  'video/mp4',
  webm: 'video/webm',
  pdf:  'application/pdf',
};

function getMimeType(key: string, fallback = 'application/octet-stream'): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? fallback;
}

// ─── Thumbnail dimensions ─────────────────────────────────────────────────────
const VARIANT_CONFIG: Record<string, { width: number; quality: number }> = {
  thumbnail: { width: 600,  quality: 80 },
  medium:    { width: 1000, quality: 85 },
  large:     { width: 1600, quality: 85 },
};

/**
 * Fire-and-forget thumbnail generation.
 * Called AFTER we've already started streaming the original to the browser.
 * Any failure here is logged but does NOT affect the response.
 */
async function generateVariantInBackground(
  fileParam: string,
  variantName: string,
  variantPath: string,
  cfg: { width: number; quality: number },
): Promise<void> {
  try {
    const gcsFile = bucket.file(fileParam);
    const [exists] = await gcsFile.exists();
    if (!exists) return;

    const [originalBuffer] = await gcsFile.download();
    const optimizedBuffer = await sharp(originalBuffer)
      .resize(cfg.width, null, { withoutEnlargement: true })
      .webp({ quality: cfg.quality })
      .toBuffer();

    await bucket.file(variantPath).save(optimizedBuffer, {
      contentType: 'image/webp',
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });

    console.log(`[media] ✅ Background variant saved: ${variantPath} (${optimizedBuffer.length} bytes)`);
  } catch (err) {
    console.error(
      `[media] ⚠️  Background variant generation failed for "${variantPath}":`,
      err instanceof Error ? err.message : err,
    );
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const startMs = Date.now();

  try {
    const resolvedParams = await params;

    // ── Guard: path must be present ──────────────────────────────────────────
    if (!resolvedParams?.path || resolvedParams.path.length === 0) {
      console.warn('[media] ❌ Request missing file path');
      return new NextResponse('File path is missing', { status: 400 });
    }

    // ── Build the GCS object key from path segments ──────────────────────────
    // Next.js decodes each segment individually, so we just join with '/'.
    // Example: [...path] = ['uploads', '1786453431393-g43-1.png']
    //          fileParam  = 'uploads/1786453431393-g43-1.png'
    const fileParam = resolvedParams.path.join('/');

    // ── Safety: block path traversal ─────────────────────────────────────────
    if (fileParam.includes('..') || fileParam.includes('\0')) {
      console.warn('[media] ❌ Path traversal attempt blocked:', fileParam);
      return new NextResponse('Invalid file path', { status: 400 });
    }

    const variant   = request.nextUrl.searchParams.get('v');
    const isImage   = /\.(jpg|jpeg|png|webp|avif)$/i.test(fileParam);
    const variantCfg = variant ? VARIANT_CONFIG[variant] : null;

    // ── DIAGNOSTIC LOG (production-safe — no credentials/tokens) ────────────
    console.log(
      `[media] → ${request.method} /${fileParam}` +
      (variant ? ` (v=${variant})` : '') +
      (request.headers.get('via')?.includes('next/image') ? ' [via /_next/image ⚠️]' : ''),
    );

    // ── Variant path: _variants/<variant>/<gcsKey>.webp ──────────────────────
    if (isImage && variantCfg) {
      const variantPath = `_variants/${variant}/${fileParam}.webp`;
      const variantFile = bucket.file(variantPath);

      // Check GCS for an already-generated variant
      const [variantExists] = await variantFile.exists();

      if (variantExists) {
        // ✅ Fast path: variant already generated — stream it directly
        const [fileBuffer] = await variantFile.download();
        const etag = `"${variantPath}-${fileBuffer.length}"`;

        if (request.headers.get('if-none-match') === etag) {
          console.log(`[media] 304 variant (cached) ${variantPath} (${Date.now() - startMs}ms)`);
          return new NextResponse(null, { status: 304 });
        }

        console.log(
          `[media] 200 variant ${variantPath}` +
          ` — ${fileBuffer.length} bytes, image/webp (${Date.now() - startMs}ms)`,
        );

        return new NextResponse(fileBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type':            'image/webp',
            'Content-Length':          String(fileBuffer.length),
            'Cache-Control':           'public, max-age=31536000, immutable',
            'ETag':                    etag,
            'Vary':                    'Accept-Encoding',
            'Content-Disposition':     'inline',
            'X-Content-Type-Options':  'nosniff',
            'X-Variant':               variant ?? '',
            'X-Served-From':           'gcs-variant',
          },
        });
      }

      // ⚡ Variant does NOT exist yet.
      // KEY CHANGE: Do NOT block the response on thumbnail generation.
      // Serve the original immediately, then generate the thumbnail in the background.
      // This prevents Vercel timeouts when processing many products at once.
      console.log(
        `[media] ℹ️  Variant not found: "${variantPath}". ` +
        `Serving original and scheduling background generation.`,
      );
      // Fall through to serve original (no return here — intentional)
    }

    // ── Serve the original GCS file ───────────────────────────────────────────
    const gcsFile = bucket.file(fileParam);
    const [exists] = await gcsFile.exists();

    if (!exists) {
      console.warn(`[media] ❌ GCS object not found: "${fileParam}" (${Date.now() - startMs}ms)`);

      // Return a transparent 1×1 PNG placeholder — prevents broken-image browser icon.
      // Status 404 so the browser doesn't cache it as "found".
      const placeholder = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      return new NextResponse(placeholder, {
        status: 404,
        headers: {
          'Content-Type':  'image/png',
          'Cache-Control': 'no-store, max-age=0',
          'X-Media-Miss':  fileParam,
        },
      });
    }

    // Detect content-type from GCS metadata first, then fall back to extension
    let contentType: string;
    try {
      const [metadata] = await gcsFile.getMetadata();
      contentType = (metadata.contentType as string) || getMimeType(fileParam);
    } catch {
      contentType = getMimeType(fileParam);
    }

    // Download the original from GCS
    const [fileBuffer] = await gcsFile.download();

    // Conditional request support (ETag / If-None-Match)
    const etag        = `"${fileParam}-${fileBuffer.length}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      console.log(`[media] 304 original (cached) ${fileParam} (${Date.now() - startMs}ms)`);
      return new NextResponse(null, { status: 304 });
    }

    console.log(
      `[media] 200 original "${fileParam}"` +
      ` — ${fileBuffer.length} bytes, ${contentType} (${Date.now() - startMs}ms)`,
    );

    const response = new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type':           contentType,
        'Content-Length':         String(fileBuffer.length),
        // Immutable: file content never changes for a given key
        'Cache-Control':          'public, max-age=31536000, immutable',
        'ETag':                   etag,
        'Vary':                   'Accept-Encoding',
        'Content-Disposition':    'inline',
        'X-Content-Type-Options': 'nosniff',
        'X-Served-From':          'gcs-original',
      },
    });

    // ⚡ Fire-and-forget: generate the missing thumbnail variant asynchronously.
    // The response is already being streamed — this runs after.
    if (isImage && variantCfg && variant) {
      const variantPath = `_variants/${variant}/${fileParam}.webp`;
      // Use void to explicitly mark as intentionally unawaited
      void generateVariantInBackground(fileParam, variant, variantPath, variantCfg);
    }

    return response;

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[media] 💥 Unhandled error: ${msg}`);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
