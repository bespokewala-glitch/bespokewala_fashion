import { NextResponse } from 'next/server';

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
      const data = await res.json();

      // If the service says it is retryable (e.g. vton_preflight_unavailable), retry
      const isRetryable =
        (res.status === 503 || res.status === 429) &&
        (data?.detail?.retryable === true || data?.retryable === true);

      if (!isRetryable || attempt === maxRetries) {
        return { res, data };
      }

      const backoff = Math.min(3000 * Math.pow(2, attempt), 20000); // 3s, 6s, 12s, 20s
      console.warn(
        `[VTO] Retryable error (attempt ${attempt + 1}/${maxRetries}). Retrying in ${backoff / 1000}s…`,
        data?.detail?.code,
      );
      await sleep(backoff);
    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries) break;
      const backoff = Math.min(3000 * Math.pow(2, attempt), 20000);
      await sleep(backoff);
    }
  }
  throw lastError ?? new Error('Max retries exceeded');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.PIXELAPI_KEY || process.env.FASHN_API_KEY;

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
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );

      if (!statusRes.ok) {
        return NextResponse.json(statusData, { status: statusRes.status });
      }

      const mappedResponse = {
        status: statusData.status, // queued | processing | completed | failed
        output:
          statusData.status === 'completed' && statusData.result_image_b64
            ? `data:image/png;base64,${statusData.result_image_b64}`
            : undefined,
        error:
          statusData.status === 'failed' ? statusData.error_message : undefined,
      };

      return NextResponse.json(mappedResponse);
    }

    // ── INITIAL request branch ───────────────────────────────────────────────
    const { userImageBase64, productImageUrl } = body;

    // Strip data-URI prefix — PixelAPI needs raw base64
    const person_image = userImageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Fetch garment image and convert to base64
    let garment_image = '';
    try {
      const productRes = await fetch(productImageUrl);
      if (!productRes.ok) throw new Error('Failed to fetch product image');
      const productBuffer = await productRes.arrayBuffer();
      garment_image = Buffer.from(productBuffer).toString('base64');
    } catch (e) {
      console.error('Failed to convert garment image to base64', e);
      return NextResponse.json(
        { error: 'Failed to process garment image' },
        { status: 400 },
      );
    }

    const payload = {
      person_image,
      garment_image,
      category: 'dress', // Best fit for couture / lehengas / gowns
    };

    const { res: runRes, data: runData } = await fetchWithRetry(
      'https://api.pixelapi.dev/v1/virtual-tryon',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!runRes.ok) {
      console.error('PixelAPI Error (after retries):', runData);
      const errorMessage =
        runData.detail?.message ||
        runData.error ||
        'The try-on service is temporarily busy. Please try again in a moment.';
      return NextResponse.json({ error: errorMessage }, { status: runRes.status });
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

