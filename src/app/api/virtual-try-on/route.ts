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

function sanitizeVtoError(rawError: any): string {
  if (!rawError) return 'The try-on service is temporarily busy. Please try again in a moment.';
  const str = typeof rawError === 'string' ? rawError : (rawError.message || JSON.stringify(rawError));

  // Intercept technical, billing, quota, or upstream authorization errors
  if (/credit|trial|capped|subscribe|pricing|plan|denied|unauthorized|forbidden|internal|preflight|busy/i.test(str)) {
    return 'The Virtual Try-On studio is currently experiencing high demand. Please try again shortly or connect directly with our stylist on WhatsApp.';
  }

  return str;
}

// ─────────────────────────────────────────────────────────────────────────────
// PixelAPI fidelity helpers (all server-side — never exposed to the customer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PixelAPI's VTON model works natively at a 3:4 portrait ratio (768x1024).
 * Photos with any other ratio get stretched/squashed internally, which is the
 * main reason faces come back looking "different". We letterbox the photo onto
 * an exact 3:4 canvas (no distortion) and remember the padding so it can be
 * cropped off the result again.
 */
const VTON_W = 1152;
const VTON_H = 1536;

type CropFrac = { l: number; t: number; r: number; b: number };

async function padTo3x4(
  input: Buffer,
  mode: 'person' | 'garment',
): Promise<{ b64: string; crop: CropFrac }> {
  const sharp = (await import('sharp')).default;
  // rotate() = honour EXIF orientation from phone cameras (otherwise sideways faces)
  let img = sharp(input).rotate();
  if (mode === 'garment') img = img.flatten({ background: '#ffffff' }); // transparent PNG -> white, not black

  const resized = await img
    .resize(VTON_W, VTON_H, { fit: 'inside', kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = resized.info;
  const left = Math.floor((VTON_W - width) / 2);
  const top = Math.floor((VTON_H - height) / 2);
  const right = VTON_W - width - left;
  const bottom = VTON_H - height - top;

  const out = await sharp(resized.data)
    .extend({
      top, bottom, left, right,
      // Person: replicate edge pixels so the padding reads as background, not a frame.
      // Garment: clean white studio background.
      ...(mode === 'person' ? { extendWith: 'copy' as const } : { background: '#ffffff' }),
    })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' }) // keep fine embroidery / face detail
    .toBuffer();

  return {
    b64: out.toString('base64'),
    crop: { l: left / VTON_W, t: top / VTON_H, r: right / VTON_W, b: bottom / VTON_H },
  };
}

/** Encode/decode the padding info inside the job id the client echoes back while polling. */
function encodeJobId(id: string, crop?: CropFrac, provider: 'vton' | 'saree' = 'vton'): string {
  const prefix = provider === 'saree' ? 'saree:' : '';
  if (!crop || (crop.l + crop.t + crop.r + crop.b) < 0.002) return `${prefix}${id}`;
  const f = (n: number) => n.toFixed(4);
  return `${prefix}${id}~${f(crop.l)}_${f(crop.t)}_${f(crop.r)}_${f(crop.b)}`;
}

function decodeJobId(raw: string): { id: string; provider: 'vton' | 'saree'; crop?: CropFrac } {
  let s = String(raw);
  let provider: 'vton' | 'saree' = 'vton';
  if (s.startsWith('saree:')) { provider = 'saree'; s = s.slice(6); }
  const [id, cropStr] = s.split('~');
  if (!cropStr) return { id, provider };
  const [l, t, r, b] = cropStr.split('_').map(Number);
  if ([l, t, r, b].some(n => !Number.isFinite(n) || n < 0 || n > 0.5)) return { id, provider };
  return { id, provider, crop: { l, t, r, b } };
}

/** Remove the letterbox padding from the generated image so it matches the customer's original framing. */
async function cropResult(imageRef: string, crop: CropFrac): Promise<string> {
  try {
    let buf: Buffer;
    if (imageRef.startsWith('data:image/')) {
      buf = Buffer.from(imageRef.split(',')[1] || '', 'base64');
    } else {
      const url = imageRef.startsWith('//') ? `https:${imageRef}` : imageRef;
      const r = await fetch(url);
      if (!r.ok) return imageRef;
      buf = Buffer.from(await r.arrayBuffer());
    }
    const sharp = (await import('sharp')).default;
    const meta = await sharp(buf).metadata();
    const W = meta.width || 0;
    const H = meta.height || 0;
    if (!W || !H) return imageRef;
    const left = Math.round(crop.l * W);
    const top = Math.round(crop.t * H);
    const width = W - left - Math.round(crop.r * W);
    const height = H - top - Math.round(crop.b * H);
    if (width < 64 || height < 64) return imageRef;
    const out = await sharp(buf).extract({ left, top, width, height }).jpeg({ quality: 92 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString('base64')}`;
  } catch (e: any) {
    console.warn('[VTO] Could not crop padding from result, returning as-is:', e?.message);
    return imageRef;
  }
}

/**
 * Map our product taxonomy to PixelAPI categories. The category decides which
 * body region gets repainted — a precise category keeps the face, hands and
 * untouched clothing outside the edit mask.
 */
function mapPixelCategory(...hints: Array<string | undefined>): string {
  const rules: Array<[RegExp, string]> = [
    [/saree|sari\b/, 'saree'],
    [/lehenga|lehnga|ghagra|chaniya/, 'lehenga'],
    [/sherwani|achkan|bandhgala|bandgala|jodhpuri|indo[\s-]?western|tuxedo|\bsuit/, 'sherwani'],
    [/kurta|kurti|tunic|pathani/, 'kurti'],
    [/gown|anarkali|dress|jumpsuit|frock|maxi/, 'dress'],
    [/blazer|jacket|coat|waistcoat|nehru|bandi|vest|shirt|top|tee|polo|hoodie|sweater|blouse/, 'upperbody'],
    [/trouser|pant|jean|chino|skirt|short|pyjama|pajama|dhoti|salwar|churidar|bottom/, 'lowerbody'],
  ];
  for (const hint of hints) {
    const h = (hint || '').toLowerCase();
    if (!h) continue;
    for (const [re, cat] of rules) if (re.test(h)) return cat;
  }
  return 'dress';
}

/** Hidden instructions for PixelAPI's saree endpoint (its only text-steerable try-on). */
const SAREE_FIDELITY_NOTES =
  'Keep the person exactly as in the photo: same face, facial features, expression, skin tone, hair, body shape, pose and background - do not alter, beautify or regenerate the face. ' +
  'Reproduce the garment exactly as in the garment image: same colour, fabric, border, pallu, motifs, embroidery and zari work - do not redesign, recolour or simplify it. ' +
  'Natural, realistic drape with neat pleats.';

/**
 * Gemini "Nano Banana" try-on. Gemini image generation is synchronous, so the
 * finished image is returned directly (no job polling needed).
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 */
async function generateWithGemini(opts: {
  geminiKey: string;
  personBase64: string;
  garmentBase64: string;
  category: string;
}): Promise<{ ok: true; dataUrl: string } | { ok: false; status: number; error: string }> {
  const model = (process.env.GEMINI_TRYON_MODEL || 'gemini-2.5-flash-image').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt = [
    'TASK: Photorealistic virtual try-on (image editing, NOT new image generation).',
    'You will receive two labelled images: [CUSTOMER PHOTO] and [GARMENT PHOTO] (category: ' + opts.category + ').',
    'Edit the CUSTOMER PHOTO so the customer is wearing the garment from the GARMENT PHOTO. Change ONLY the clothing region. Every other pixel should stay as close to the original customer photo as possible.',
    '',
    'RULE 1 - CUSTOMER IDENTITY IS LOCKED (highest priority):',
    '- Keep the customer\'s face exactly as it is: same facial structure, eyes, eyebrows, nose, lips, jawline, expression, facial hair, moles/marks, makeup and glasses.',
    '- Do NOT beautify, retouch, slim, age, de-age, change ethnicity or alter skin tone. Do not replace or regenerate the face.',
    '- Keep the same hairstyle, hair colour, head angle, body proportions, body size, pose, hands, accessories (watch, jewellery) and the same camera framing, crop and aspect ratio.',
    '- Keep the original background, lighting direction and colour grading of the customer photo.',
    '',
    'RULE 2 - GARMENT IS LOCKED (second priority):',
    '- Reproduce the garment exactly as shown: identical colour/shade, fabric type and texture, print/pattern scale and placement, embroidery, zari/thread work, buttons, pockets, collar/neckline, sleeve length, hem length, cut and silhouette.',
    '- Do NOT redesign, recolour, simplify, add or remove any details, motifs, borders or embellishments.',
    '- If the GARMENT PHOTO shows a model or mannequin wearing it, take ONLY the garment. Completely ignore that model\'s face, body, skin, hair, pose and background.',
    '- Fit the garment naturally to the customer\'s body and pose, with realistic drape, folds, wrinkles and shadows that match the customer photo\'s lighting.',
    '- Replace only the clothing it covers; keep clothing it does not cover (e.g. bottoms when trying a top) unchanged unless the garment naturally covers it.',
    '',
    'OUTPUT: A single photorealistic photo that looks like the original customer photo, with the same person, now wearing this exact garment. No text, logos, watermarks, borders, collages or extra people.',
  ].join('\n');

  const { res, data } = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Header (not ?key=) so the key never appears in URLs or logs
        'x-goog-api-key': opts.geminiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              // Label each image explicitly so the model never confuses the two
              { text: '[CUSTOMER PHOTO] - preserve this person\'s face, identity, body, pose and background exactly:' },
              { inlineData: { mimeType: 'image/jpeg', data: opts.personBase64 } },
              { text: '[GARMENT PHOTO] - reproduce this garment exactly; ignore any model/person shown in it:' },
              { inlineData: { mimeType: 'image/jpeg', data: opts.garmentBase64 } },
              { text: 'Now output the edited CUSTOMER PHOTO with the customer wearing the exact garment.' },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
          // Lower temperature = more faithful to the inputs, less creative drift
          temperature: 0.4,
        },
      }),
    },
    2,
  );

  if (!res.ok) {
    console.error(`[VTO] Gemini Error (status ${res.status}):`, JSON.stringify(data));
    const raw = data?.error?.message || data?.message || 'The try-on service is temporarily busy.';
    return { ok: false, status: res.status === 429 ? 429 : 502, error: sanitizeVtoError(raw) };
  }

  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p?.inlineData?.data || p?.inline_data?.data);
  const b64: string | undefined = imgPart?.inlineData?.data || imgPart?.inline_data?.data;

  if (!b64) {
    console.error('[VTO] Gemini returned no image:', JSON.stringify(data?.promptFeedback || data?.candidates?.[0]?.finishReason || data));
    return {
      ok: false,
      status: 422,
      error: 'We could not generate a try-on from this photo. Please try a clear, front-facing, full-body photo with good lighting.',
    };
  }

  // Normalise to JPEG to keep the JSON response small
  let outB64 = b64;
  let mime = imgPart?.inlineData?.mimeType || imgPart?.inline_data?.mime_type || 'image/png';
  try {
    const sharp = (await import('sharp')).default;
    const out = await sharp(Buffer.from(b64, 'base64')).jpeg({ quality: 88 }).toBuffer();
    outB64 = out.toString('base64');
    mime = 'image/jpeg';
  } catch {
    // keep original encoding
  }

  return { ok: true, dataUrl: `data:${mime};base64,${outB64}` };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    const apiKey = (process.env.PIXELAPI_KEY || process.env.FASHN_API_KEY || '').trim();

    if (!geminiKey && !apiKey) {
      return NextResponse.json(
        { error: 'Virtual Try-On is currently unavailable (API key missing)' },
        { status: 500 },
      );
    }

    // ── POLLING branch ──────────────────────────────────────────────────────
    if (body.jobId) {
      const { id: realJobId, provider, crop } = decodeJobId(body.jobId);
      const authHeaders = {
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'Bespokewala/1.0',
      };

      let { res: statusRes, data: statusData } = await fetchWithRetry(
        `https://api.pixelapi.dev/v1/virtual-tryon/jobs/${encodeURIComponent(realJobId)}`,
        { headers: authHeaders },
      );

      // Saree jobs may live under the generic generations endpoint
      if (provider === 'saree' && statusRes.status === 404) {
        ({ res: statusRes, data: statusData } = await fetchWithRetry(
          `https://api.pixelapi.dev/v1/image/${encodeURIComponent(realJobId)}`,
          { headers: authHeaders },
        ));
      }

      if (!statusRes.ok) {
        console.error(`[VTO] Poll Error (status ${statusRes.status}):`, JSON.stringify(statusData));
        const rawPollError = statusData?.error || statusData?.detail || statusData?.message || 'Failed to check status.';
        return NextResponse.json(
          { error: sanitizeVtoError(rawPollError), details: statusData },
          { status: statusRes.status },
        );
      }

      // Robustly extract the generated image from any property in the API response
      const isDone = ['completed', 'succeeded', 'success'].includes(String(statusData.status || '').toLowerCase());
      let finalOutput = isDone ? extractImageUrl(statusData) : undefined;

      // Remove the 3:4 letterbox padding so the result matches the customer's photo framing
      if (finalOutput && crop) {
        finalOutput = await cropResult(finalOutput, crop);
      }

      const mappedResponse = {
        ...statusData,
        status: statusData.status, // queued | processing | completed | failed
        output: finalOutput,
        outputs: finalOutput ? [finalOutput] : undefined,
        output_image_url: finalOutput,
        result_urls: finalOutput ? [finalOutput] : statusData.result_urls,
        error:
          statusData.status === 'failed'
            ? sanitizeVtoError(statusData.error || statusData.error_message || statusData.detail || 'Virtual Try-On processing failed.')
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
        .rotate() // honour EXIF orientation from phone cameras
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
            .rotate()
            .flatten({ background: '#ffffff' }) // transparent PNG garments -> white (not black)
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

    // ── Gemini (Nano Banana) provider ────────────────────────────────────────
    if (geminiKey) {
      const gemResult = await generateWithGemini({
        geminiKey,
        personBase64: person_image,
        garmentBase64: garment_image,
        category: (body.category || 'garment').toString().slice(0, 40),
      });

      if (!gemResult.ok) {
        return NextResponse.json({ error: gemResult.error }, { status: gemResult.status });
      }

      // Same shape the modal already understands, already completed
      return NextResponse.json({
        id: `gemini_${Date.now()}`,
        status: 'completed',
        output: gemResult.dataUrl,
        outputs: [gemResult.dataUrl],
        output_image_url: gemResult.dataUrl,
      });
    }

    // Map to valid PixelAPI categories: upperbody | lowerbody | dress | saree | lehenga | kurti | sherwani
    // Category first, product name as fallback (e.g. category "Men" but name "Silk Kurta")
    const category = mapPixelCategory(body.category, body.productName);

    // ── Saree / lehenga → dedicated drape endpoint with hidden fidelity notes ──
    const sareeEnabled = (process.env.PIXELAPI_SAREE_TRYON || 'true').toLowerCase() !== 'false';
    if (sareeEnabled && (category === 'saree' || category === 'lehenga')) {
      try {
        const { res: sRes, data: sData } = await fetchWithRetry(
          'https://api.pixelapi.dev/v1/saree-tryon',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Bespokewala/1.0',
            },
            body: JSON.stringify({
              person: `data:image/jpeg;base64,${person_image}`,
              garment: `data:image/jpeg;base64,${garment_image}`,
              type: category,
              notes: SAREE_FIDELITY_NOTES,
            }),
          },
          2,
        );

        if (sRes.ok) {
          const immediate = ['completed', 'succeeded', 'success'].includes(String(sData?.status || '').toLowerCase())
            ? extractImageUrl(sData)
            : undefined;
          if (immediate) {
            return NextResponse.json({ id: `saree_${Date.now()}`, status: 'completed', output: immediate, outputs: [immediate], output_image_url: immediate });
          }
          const sJobId = sData?.job_id || sData?.generation_id || sData?.id;
          if (sJobId) {
            return NextResponse.json({ ...sData, id: encodeJobId(String(sJobId), undefined, 'saree') });
          }
          console.warn('[VTO] Saree endpoint returned no job id, falling back to standard VTON:', JSON.stringify(sData).slice(0, 300));
        } else {
          console.warn(`[VTO] Saree endpoint failed (status ${sRes.status}), falling back to standard VTON:`, JSON.stringify(sData).slice(0, 300));
        }
      } catch (e: any) {
        console.warn('[VTO] Saree endpoint error, falling back to standard VTON:', e?.message);
      }
    }

    // ── Standard VTON: letterbox both images to the model's native 3:4 ratio ──
    let vtonPerson = person_image;
    let vtonGarment = garment_image;
    let personCrop: CropFrac | undefined;
    try {
      const p = await padTo3x4(Buffer.from(person_image, 'base64'), 'person');
      vtonPerson = p.b64;
      personCrop = p.crop;
      vtonGarment = (await padTo3x4(Buffer.from(garment_image, 'base64'), 'garment')).b64;
    } catch (e: any) {
      console.warn('[VTO] 3:4 padding failed, sending images unpadded:', e?.message);
      personCrop = undefined;
    }

    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    const payload = {
      person_image: vtonPerson,
      garment_image: vtonGarment,
      category,
      // Max denoising steps → sharper garment detail (embroidery, prints, buttons)
      n_steps: clamp(Number(process.env.PIXELAPI_VTON_STEPS) || 50, 1, 50),
      // Garment guidance: higher = closer to the product photo. ~2.5 is faithful without artefacts.
      image_scale: clamp(Number(process.env.PIXELAPI_VTON_IMAGE_SCALE) || 2.5, 0.1, 10),
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

      return NextResponse.json({ error: sanitizeVtoError(errorMessage), details: runData }, { status: runRes.status });
    }

    // Map job_id → id for the frontend (padding info rides along inside the id)
    return NextResponse.json({ ...runData, id: encodeJobId(String(runData.job_id || runData.id), personCrop) });
  } catch (error: any) {
    console.error('Virtual Try On Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while communicating with the try-on service.' },
      { status: 500 },
    );
  }
}
