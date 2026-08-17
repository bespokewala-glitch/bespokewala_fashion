import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';
import sharp from 'sharp';

// Map file extensions to MIME types for correct Content-Type headers
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;

    if (!resolvedParams?.path || resolvedParams.path.length === 0) {
      return new NextResponse('File path is missing', { status: 400 });
    }

    const fileParam = resolvedParams.path.join('/');

    // Safety: block path traversal attempts
    if (fileParam.includes('..') || fileParam.includes('\0')) {
      return new NextResponse('Invalid file path', { status: 400 });
    }

    const variant = request.nextUrl.searchParams.get('v');
    const isImage = fileParam.match(/\.(jpg|jpeg|png|webp|avif)$/i);

    if (isImage && (variant === 'thumbnail' || variant === 'medium' || variant === 'large')) {
      const variantPath = `_variants/${variant}/${fileParam}.webp`;
      const variantFile = bucket.file(variantPath);

      // Check if variant already exists
      const [variantExists] = await variantFile.exists();
      if (variantExists) {
        const [fileBuffer] = await variantFile.download();
        const etag = `"${variantPath}-${fileBuffer.length}"`;
        if (request.headers.get('if-none-match') === etag) {
          return new NextResponse(null, { status: 304 });
        }
        return new NextResponse(fileBuffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'image/webp',
            'Content-Length': String(fileBuffer.length),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': etag,
            'Vary': 'Accept-Encoding',
          },
        });
      }

      // Variant doesn't exist, generate it
      const gcsFile = bucket.file(fileParam);
      const [exists] = await gcsFile.exists();
      if (exists) {
        const [originalBuffer] = await gcsFile.download();
        let targetWidth = 600;
        let quality = 80;

        if (variant === 'medium') {
          targetWidth = 1000;
          quality = 85;
        } else if (variant === 'large') {
          targetWidth = 1600;
          quality = 85;
        }

        try {
          const optimizedBuffer = await sharp(originalBuffer)
            .resize(targetWidth, null, { withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();

          // Save back to GCS
          await variantFile.save(optimizedBuffer, {
            contentType: 'image/webp',
            metadata: { cacheControl: 'public, max-age=31536000, immutable' },
          });

          const etag = `"${variantPath}-${optimizedBuffer.length}"`;
          return new NextResponse(optimizedBuffer as any, {
            status: 200,
            headers: {
              'Content-Type': 'image/webp',
              'Content-Length': String(optimizedBuffer.length),
              'Cache-Control': 'public, max-age=31536000, immutable',
              'ETag': etag,
              'Vary': 'Accept-Encoding',
            },
          });
        } catch (err) {
          console.error('[media] Sharp optimization error:', err);
          // Fall through to serve original if sharp fails
        }
      }
    }

    console.log('[media] Serving original GCS file:', fileParam);

    const gcsFile = bucket.file(fileParam);
    const [exists] = await gcsFile.exists();

    if (!exists) {
      console.warn('[media] File not found in GCS:', fileParam);
      // Return a transparent 1x1 PNG as placeholder instead of a broken-image icon
      const placeholder = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      return new NextResponse(placeholder, {
        status: 404,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Detect content type: prefer GCS metadata, fall back to extension
    let contentType: string;
    try {
      const [metadata] = await gcsFile.getMetadata();
      contentType = (metadata.contentType as string) || getMimeType(fileParam);
    } catch {
      contentType = getMimeType(fileParam);
    }

    // Download file buffer from private GCS using server credentials
    const [fileBuffer] = await gcsFile.download();

    // Support conditional requests (ETag / If-None-Match)
    const etag = `"${fileParam}-${fileBuffer.length}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type':  contentType,
        'Content-Length': String(fileBuffer.length),
        // Cache aggressively — file content never changes for a given key
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag':          etag,
        // Allow CDN caching
        'Vary':          'Accept-Encoding',
      },
    });
  } catch (error: any) {
    console.error('[media] Error serving GCS file:', error.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
