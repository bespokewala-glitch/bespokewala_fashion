import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';

// ─── Runtime declaration ──────────────────────────────────────────────────────
// REQUIRED: This route uses native Node.js modules (sharp, @google-cloud/storage).
// Without this, Vercel may attempt to run the route in the Edge Runtime, which
// does NOT support native addons and will produce a bare 500 with no stack trace.
export const runtime = 'nodejs';

// REQUIRED: Every /api/media/ request is dynamic by nature (GCS fetch).
// Prevents Next.js from accidentally pre-rendering this route at build time.
export const dynamic = 'force-dynamic';

// ─── MIME type map ────────────────────────────────────────────────────────────
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
};

function getMimeType(key: string, fallback = 'application/octet-stream'): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? fallback;
}

// ─── Thumbnail dimensions ─────────────────────────────────────────────────────
const VARIANT_CONFIG: Record<string, { width: number; quality: number }> = {
  micro: { width: 120, quality: 70 },
  small: { width: 300, quality: 75 },
  thumbnail: { width: 600, quality: 80 },
  medium: { width: 1000, quality: 85 },
  large: { width: 1600, quality: 85 },
};

// Transparent 1×1 PNG — used as a controlled fallback for missing files.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

// ─── Route Handler ────────────────────────────────────────────────────────────
// NOTE: `sharp` is intentionally NOT imported at the top level.
//
// Rationale: sharp is a native C++ addon. If its platform binary fails to load
// (e.g., ABI mismatch, missing libvips), a top-level static import causes the
// ENTIRE route module to crash during initialisation — before any GET handler
// runs, producing a bare 500 with no useful log output.
//
// By importing sharp dynamically inside the variant-generation block (inside a
// try/catch), any native-load failure is caught, logged with a full stack trace,
// and the route gracefully falls through to serve the original image instead of
// returning 500.
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

    const variant = request.nextUrl.searchParams.get('v');
    const isImage = /\.(jpg|jpeg|png|webp|avif)$/i.test(fileParam);
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

      // FAST ETAG CHECK (NO GCS DOWNLOAD)
      // Since variants are immutable, the path itself is a safe ETag
      const etag = `"${variantPath}"`;
      if (request.headers.get('if-none-match') === etag) {
        console.log(`[media] 304 variant (fast cached) ${variantPath} (${Date.now() - startMs}ms)`);
        return new NextResponse(null, { status: 304 });
      }

      // Check GCS for an already-generated variant
      const [variantExists] = await variantFile.exists();

      if (variantExists) {
        // ✅ Fast path: variant already generated — stream it directly
        const [fileBuffer] = await variantFile.download();

        console.log(
          `[media] 200 variant ${variantPath}` +
          ` — ${fileBuffer.length} bytes, image/webp (${Date.now() - startMs}ms)`,
        );

        return new NextResponse(fileBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': 'image/webp',
            'Content-Length': String(fileBuffer.length),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': etag,
            'Vary': 'Accept-Encoding',
            'Content-Disposition': 'inline',
            'X-Content-Type-Options': 'nosniff',
            'X-Variant': variant ?? '',
            'X-Served-From': 'gcs-variant',
          },
        });
      }

      // ⚡ Variant does NOT exist yet.
      // KEY CHANGE: We MUST block and generate the thumbnail inline.
      // If we serve the original here, Vercel will cache the 3MB file under the thumbnail URL!
      console.log(
        `[media] ℹ️  Variant not found: "${variantPath}". Generating inline...`,
      );

      const gcsFile = bucket.file(fileParam);
      const [exists] = await gcsFile.exists();

      if (!exists) {
        console.warn(`[media] ❌ GCS object not found: "${fileParam}" (${Date.now() - startMs}ms)`);
        return new NextResponse(PLACEHOLDER_PNG, {
          status: 404,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-store, max-age=0',
            'X-Media-Miss': fileParam,
          },
        });
      }

      const [originalBuffer] = await gcsFile.download();

      // ── Dynamic sharp import ─────────────────────────────────────────────────
      // IMPORTANT: sharp is loaded here (not at module top-level) so that any
      // native-binary failure is caught by this try/catch and logged properly,
      // rather than crashing the entire route module at startup.
      try {
        const sharp = (await import('sharp')).default;
        sharp.concurrency(1); // Prevent event loop starvation when generating many variants at once

        const optimizedBuffer = await sharp(originalBuffer)
          .resize(variantCfg.width, null, { withoutEnlargement: true })
          .webp({ quality: variantCfg.quality })
          .toBuffer();

        // Await saving back to GCS to prevent serverless execution from halting early
        await bucket.file(variantPath).save(optimizedBuffer, {
          contentType: 'image/webp',
          metadata: { cacheControl: 'public, max-age=31536000, immutable' },
        }).catch(err => {
          console.error(`[media] ⚠️  Background variant save failed for "${variantPath}":`, err);
        });

        const variantEtag = `"${variantPath}"`;

        console.log(
          `[media] 200 variant generated "${variantPath}"` +
          ` — ${optimizedBuffer.length} bytes, image/webp (${Date.now() - startMs}ms)`,
        );

        return new NextResponse(optimizedBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': 'image/webp',
            'Content-Length': String(optimizedBuffer.length),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': variantEtag,
            'Vary': 'Accept-Encoding',
            'Content-Disposition': 'inline',
            'X-Content-Type-Options': 'nosniff',
            'X-Variant': variant ?? '',
            'X-Served-From': 'gcs-generated',
          },
        });
      } catch (sharpErr: unknown) {
        // ── Sharp failed (binary missing / ABI mismatch / libvips error) ──────
        // Log the full error with stack so Vercel logs show the real cause.
        // Fall through to serve the original image rather than returning 500.
        const errMsg = sharpErr instanceof Error
          ? `${sharpErr.message}\n${sharpErr.stack}`
          : String(sharpErr);
        console.error(
          `[media] ⚠️  sharp failed for "${variantPath}" — falling back to original.\n` +
          `  Error: ${errMsg}`,
        );
        // Fall through to original-file serving below ↓
      }
    }

    // ── Serve the original GCS file ───────────────────────────────────────────
    const etagOrig = `"${fileParam}"`;
    if (request.headers.get('if-none-match') === etagOrig) {
      console.log(`[media] 304 original (fast cached) ${fileParam} (${Date.now() - startMs}ms)`);
      return new NextResponse(null, { status: 304 });
    }

    const gcsFile = bucket.file(fileParam);
    const [exists] = await gcsFile.exists();

    if (!exists) {
      console.warn(`[media] ❌ GCS object not found: "${fileParam}" (${Date.now() - startMs}ms)`);

      // Return a transparent 1×1 PNG placeholder — prevents broken-image browser icon.
      // Status 404 so the browser doesn't cache it as "found".
      return new NextResponse(PLACEHOLDER_PNG, {
        status: 404,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, max-age=0',
          'X-Media-Miss': fileParam,
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

    console.log(
      `[media] 200 original "${fileParam}"` +
      ` — ${fileBuffer.length} bytes, ${contentType} (${Date.now() - startMs}ms)`,
    );

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        // Immutable: file content never changes for a given key
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etagOrig,
        'Vary': 'Accept-Encoding',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'X-Served-From': 'gcs-original',
      },
    });

  } catch (error: unknown) {
    // ── Top-level catch: log full stack for Vercel logs ─────────────────────
    const errMsg = error instanceof Error
      ? `${error.message}\n${error.stack}`
      : String(error);
    console.error(`[media] 💥 Unhandled error:\n${errMsg}`);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}



