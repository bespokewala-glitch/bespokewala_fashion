export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';

// Increase Next.js route timeout to 120 seconds
export const maxDuration = 120;

/** Sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a fetch call up to `maxRetries` times when the response is retryable (503 / retryable flag).
 * Uses exponential back-off: 3s, 6s, 12s …
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 4,
): Promise<{ res: Response; data: any }> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));

      // Retry on server-busy status codes or explicit retryable flags
      const isRetryable =
        res.status === 503 ||
        res.status === 429 ||
        res.status === 502 ||
        res.status === 504 ||
        data?.detail?.retryable === true ||
        data?.retryable === true ||
        data?.detail?.code === 'vton_preflight_unavailable';

      if (!isRetryable || attempt === maxRetries) {
        return { res, data };
      }

      const backoff = Math.min(2500 * Math.pow(1.8, attempt), 15000); // 2.5s, 4.5s, 8.1s, 14.5s
      console.warn(
        `[VTO] PixelAPI busy/retryable (attempt ${attempt + 1}/${maxRetries}, status ${res.status}). Retrying in ${(backoff / 1000).toFixed(1)}s…`,
        data?.detail?.code || data?.detail || '',
      );
      await sleep(backoff);
    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries) break;
      const backoff = Math.min(2500 * Math.pow(1.8, attempt), 15000);
      await sleep(backoff);
    }
  }
  throw lastError ?? new Error('Max retries exceeded');
}

/**
 * Recursively search any API response tree for an image URL or base64 data.
 */
function extractImageUrl(obj: any): string | undefined {
  if (!obj) return undefined;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
      return trimmed;
    }
    if (trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    // Check if it's raw base64 data
    if (trimmed.length > 500 && /^[A-Za-z0-9+/=]+$/.test(trimmed.slice(0, 80))) {
      return `data:image/png;base64,${trimmed}`;
    }
    return undefined;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = extractImageUrl(item);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof obj === 'object') {
    const priority = [
      'output', 'outputs', 'result_urls', 'result_url', 'result_image_url',
      'output_image_url', 'output_url', 'image_url', 'imageUrl', 'image',
      'images', 'result', 'results', 'data', 'url', 'urls', 'result_image',
      'result_image_b64', 'b64_json', 'file_url', 'file', 'files', 'job'
    ];
    for (const key of priority) {
      if (key in obj && obj[key] !== null && obj[key] !== undefined) {
        const found = extractImageUrl(obj[key]);
        if (found) return found;
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      if (!priority.includes(k) && k !== 'person_image' && k !== 'garment_image' && k !== 'model_image') {
        const found = extractImageUrl(v);
        if (found) return found;
      }
    }
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = (process.env.PIXELAPI_KEY || process.env.FASHN_API_KEY || '').trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Virtual Try-On is currently unavailable (API key missing)' },
        { status: 500 },
      );
    }

    // ── POLLING branch ──────────────────────────────────────────────────────
    if (body.jobId) {
      const { res: statusRes, data: statusData } = await fetchWithRetry(
        `https://api.pixelapi.dev/v1/virtual-tryon/jobs/${body.jobId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'User-Agent': 'Bespokewala/1.0',
          },
        },
      );

      if (!statusRes.ok) {
        return NextResponse.json(statusData, { status: statusRes.status });
      }

      // Robustly extract the generated image from any property in the API response
      const finalOutput = extractImageUrl(statusData);

      const mappedResponse = {
        ...statusData,
        status: statusData.status, // queued | processing | completed | failed
        output: finalOutput,
        outputs: finalOutput ? [finalOutput] : undefined,
        output_image_url: finalOutput,
        result_urls: finalOutput ? [finalOutput] : statusData.result_urls,
        error:
          statusData.status === 'failed'
            ? statusData.error || statusData.error_message || statusData.detail || 'Virtual Try-On processing failed.'
            : undefined,
      };

      return NextResponse.json(mappedResponse);
    }

    // ── INITIAL request branch ───────────────────────────────────────────────
    const { userImageBase64, productImageUrl } = body;

    if (!userImageBase64) {
      return NextResponse.json(
        { error: 'Please upload a photo of yourself first.' },
        { status: 400 },
      );
    }

    // Strip data-URI prefix and optimize person image if needed
    let person_image = userImageBase64.replace(/^data:image\/\w+;base64,/, '');
    try {
      const sharp = (await import('sharp')).default;
      const userBuf = Buffer.from(person_image, 'base64');
      const optimizedUserBuf = await sharp(userBuf)
        .resize(1024, 1536, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      person_image = optimizedUserBuf.toString('base64');
    } catch {
      // Keep original person_image base64 if sharp optimization fails
    }

    // Fetch garment image and convert to base64
    let garment_image = '';
    try {
      if (!productImageUrl || typeof productImageUrl !== 'string') {
        throw new Error('Garment image URL is missing or invalid');
      }

      if (productImageUrl.startsWith('data:image')) {
        garment_image = productImageUrl.replace(/^data:image\/\w+;base64,/, '');
      } else {
        let buffer: Buffer | null = null;

        // 1. Try direct GCS download first (fastest, handles private bucket)
        let gcsKey: string | null = null;
        if (productImageUrl.startsWith('/api/media/')) {
          gcsKey = productImageUrl.replace(/^\/api\/media\//, '').split('?')[0];
        } else if (productImageUrl.includes('/api/media/')) {
          gcsKey = productImageUrl.split('/api/media/')[1]?.split('?')[0];
        } else if (productImageUrl.startsWith('uploads/')) {
          gcsKey = productImageUrl.split('?')[0];
        } else if (productImageUrl.includes('storage.googleapis.com/')) {
          const match = productImageUrl.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
          if (match && match[1]) {
            gcsKey = match[1].split('?')[0];
          }
        }

        if (gcsKey) {
          try {
            const [gcsBuf] = await bucket.file(gcsKey).download();
            buffer = gcsBuf;
          } catch (gcsErr: any) {
            console.warn(`[VTO] GCS direct download failed for "${gcsKey}":`, gcsErr?.message);
          }
        }

        // 2. Fallback to HTTP fetch with absolute URL resolution
        if (!buffer) {
          const host = req.headers.get('host');
          const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
          const siteUrl = host ? `${proto}://${host}` : (process.env.SITE_URL || 'https://www.bespokewala.com');

          const resolvedUrl = productImageUrl.startsWith('/')
            ? `${siteUrl.replace(/\/$/, '')}${productImageUrl}`
            : productImageUrl;

          const productRes = await fetch(resolvedUrl);
          if (!productRes.ok) {
            throw new Error(`HTTP ${productRes.status} loading image from ${resolvedUrl}`);
          }
          const productBuffer = await productRes.arrayBuffer();
          buffer = Buffer.from(productBuffer);
        }

        if (!buffer || buffer.length === 0) {
          throw new Error('Retrieved garment image is empty');
        }

        // Optimize & normalize garment image format to standard JPEG
        try {
          const sharp = (await import('sharp')).default;
          const optimizedBuf = await sharp(buffer)
            .resize(1024, 1536, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer();
          garment_image = optimizedBuf.toString('base64');
        } catch {
          garment_image = buffer.toString('base64');
        }
      }
    } catch (e: any) {
      console.error('[VTO] Failed to convert garment image to base64:', e?.message || e);
      return NextResponse.json(
        { error: 'Failed to process garment image. Please ensure the product image is accessible.' },
        { status: 400 },
      );
    }

    // Map to valid PixelAPI categories: upperbody | lowerbody | dress | saree | lehenga | kurti | sherwani
    let category = 'dress';
    const rawCat = (body.category || '').toLowerCase();
    if (rawCat.includes('saree')) category = 'saree';
    else if (rawCat.includes('lehenga')) category = 'lehenga';
    else if (rawCat.includes('kurti') || rawCat.includes('kurta')) category = 'kurti';
    else if (rawCat.includes('sherwani') || rawCat.includes('suit') || rawCat.includes('blazer')) category = 'sherwani';
    else if (rawCat.includes('top') || rawCat.includes('shirt')) category = 'upperbody';
    else if (rawCat.includes('pant') || rawCat.includes('trouser') || rawCat.includes('bottom')) category = 'lowerbody';

    const payload = {
      person_image,
      garment_image,
      category,
    };

    const { res: runRes, data: runData } = await fetchWithRetry(
      'https://api.pixelapi.dev/v1/virtual-tryon',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Bespokewala/1.0',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!runRes.ok) {
      console.error(`[VTO] PixelAPI Error (status ${runRes.status}):`, JSON.stringify(runData));

      let errorMessage = '';
      if (typeof runData.detail === 'string') {
        errorMessage = runData.detail;
      } else if (Array.isArray(runData.detail) && runData.detail.length > 0) {
        errorMessage = runData.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join('; ');
      } else if (runData.detail?.message) {
        errorMessage = runData.detail.message;
      } else if (runData.message) {
        errorMessage = runData.message;
      } else if (runData.error) {
        errorMessage = typeof runData.error === 'string' ? runData.error : runData.error.message || JSON.stringify(runData.error);
      } else {
        errorMessage = 'The try-on service is temporarily busy. Please try again in a moment.';
      }

      return NextResponse.json({ error: errorMessage, details: runData }, { status: runRes.status });
    }

    // Map job_id → id for the frontend
    return NextResponse.json({ id: runData.job_id, ...runData });
  } catch (error: any) {
    console.error('Virtual Try On Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while communicating with the try-on service.' },
      { status: 500 },
    );
  }
}
