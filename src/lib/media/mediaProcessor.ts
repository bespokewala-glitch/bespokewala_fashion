/**
 * Media processor — runs after upload completes.
 *
 * For images: generates thumbnail (150×150), medium (600px), and WebP
 * For videos: delegates to FFmpeg transcoding
 *
 * Dependencies:
 *   npm install sharp    ← for image processing
 *   npm install fluent-ffmpeg  ← for video transcoding (optional)
 *
 * This module gracefully handles missing deps and marks
 * status=completed even if resizing fails, to avoid blocking uploads.
 */

import { bucket } from '@/lib/gcs';
import { buildCdnUrl, deleteGcsObject } from './signedUrl';
import { buildDerivativeKeys } from './entityConfig';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProcessingResult {
  success: boolean;
  file_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  webp_url?: string;
  hls_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  error?: string;
}

// ─── Image processor ─────────────────────────────────────────────────────────
export async function processImage(gcsKey: string, isPrivate = false): Promise<ProcessingResult> {
  const file_url = buildCdnUrl(gcsKey, isPrivate);
  const derivatives = buildDerivativeKeys(gcsKey);

  try {
    // Dynamically import sharp — won't crash server if not installed
    let sharp: any;
    try {
      sharp = (await import('sharp')).default || (await import('sharp'));
    } catch {
      console.warn('[MediaProcessor] sharp not installed — skipping image resizing.');
      return { success: true, file_url };
    }

    // Download original from GCS into buffer
    const [fileBuffer] = await bucket.file(gcsKey).download();

    // Run all three transformations in parallel
    const sharpInstance = sharp(fileBuffer);
    const meta = await sharpInstance.metadata();

    const [thumbBuffer, mediumBuffer, webpBuffer] = await Promise.all([
      // Thumbnail: 150×150 cover crop
      sharp(fileBuffer)
        .resize(150, 150, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toBuffer(),

      // Medium: max 600px wide, proportional
      sharp(fileBuffer)
        .resize(600, undefined, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),

      // Full WebP conversion
      sharp(fileBuffer)
        .webp({ quality: 85 })
        .toBuffer(),
    ]);

    // Upload derivatives back to GCS in parallel
    await Promise.all([
      bucket.file(derivatives.thumbnail).save(thumbBuffer, {
        contentType: 'image/webp',
        metadata: { cacheControl: 'public, max-age=604800' },
      }),
      bucket.file(derivatives.medium).save(mediumBuffer, {
        contentType: 'image/webp',
        metadata: { cacheControl: 'public, max-age=604800' },
      }),
      bucket.file(derivatives.webp).save(webpBuffer, {
        contentType: 'image/webp',
        metadata: { cacheControl: 'public, max-age=604800' },
      }),
    ]);

    return {
      success: true,
      file_url,
      thumbnail_url: isPrivate ? '' : buildCdnUrl(derivatives.thumbnail),
      medium_url:    isPrivate ? '' : buildCdnUrl(derivatives.medium),
      webp_url:      isPrivate ? '' : buildCdnUrl(derivatives.webp),
      width: meta.width,
      height: meta.height,
    };
  } catch (err: any) {
    console.error('[MediaProcessor] Image processing error:', err);
    // Don't fail the upload — return success with just the original URL
    return { success: true, file_url, error: err.message };
  }
}

// ─── Video processor ──────────────────────────────────────────────────────────
/**
 * Video processing is CPU-intensive and should ideally run in a
 * separate worker process or cloud service (e.g. Cloud Run job,
 * Google Transcoder API, AWS MediaConvert).
 *
 * This implementation shows the pattern using the Google Cloud
 * Transcoder API (recommended) with a fallback stub.
 */
export async function processVideo(gcsKey: string, mediaId: string, isPrivate = false): Promise<ProcessingResult> {
  const file_url = buildCdnUrl(gcsKey, isPrivate);

  // ── Option 1: Google Cloud Transcoder API ────────────────────────────────
  // This is the production-grade approach — submits a transcode job
  // and returns immediately. A webhook/polling mechanism updates status.
  //
  // const { TranscoderServiceClient } = await import('@google-cloud/video-transcoder');
  // const client = new TranscoderServiceClient();
  // const [job] = await client.createJob({
  //   parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1`,
  //   job: {
  //     inputUri: `gs://${bucketName}/${gcsKey}`,
  //     outputUri: `gs://${bucketName}/${gcsKey.replace(/\.[\w]+$/, '')}/`,
  //     config: {
  //       elementaryStreams: [
  //         { key: '360p', videoStream: { h264: { widthPixels: 640, heightPixels: 360, bitrateBps: 550000, frameRate: 30 } } },
  //         { key: '720p', videoStream: { h264: { widthPixels: 1280, heightPixels: 720, bitrateBps: 2500000, frameRate: 30 } } },
  //         { key: 'audio', audioStream: { codec: 'aac', bitrateBps: 64000 } },
  //       ],
  //       muxStreams: [
  //         { key: '360p-hls', container: 'ts', elementaryStreams: ['360p', 'audio'] },
  //         { key: '720p-hls', container: 'ts', elementaryStreams: ['720p', 'audio'] },
  //       ],
  //       manifests: [{ fileName: 'index.m3u8', type: 'HLS', muxStreams: ['360p-hls', '720p-hls'] }],
  //     },
  //   },
  // });
  // return { success: true, file_url, hls_url: buildCdnUrl(`.../${mediaId}/index.m3u8`) };

  // ── Option 2: Stub (returns original URL, marks video as complete) ────────
  console.log(`[MediaProcessor] Video transcoding queued for: ${gcsKey}`);

  // In production: submit to queue and return pending status
  // For now: return the original URL as-is
  return {
    success: true,
    file_url,
    // thumbnail_url can be extracted via ffprobe or Cloud Transcoder
  };
}

// ─── Malware scanner ─────────────────────────────────────────────────────────
/**
 * Malware scanning via a webhook pattern.
 *
 * Production options:
 * 1. Google Cloud Security Command Center (SCC) with Event Threat Detection
 * 2. ClamAV container sidecar: POST file bytes to http://clamav-service/scan
 * 3. VirusTotal API: POST file hash, poll results
 * 4. Cloudmersive Virus Scan API: simple REST endpoint
 *
 * This function implements a clean interface for any backend.
 */
export async function scanForMalware(
  gcsKey: string
): Promise<{ clean: boolean; result: 'clean' | 'infected' | 'error'; detail?: string }> {
  // ── Stub implementation (replace with real scanner in production) ─────────
  const scannerUrl = process.env.MALWARE_SCANNER_URL;

  if (!scannerUrl) {
    console.warn('[MalwareScanner] MALWARE_SCANNER_URL not configured — skipping scan.');
    return { clean: true, result: 'clean', detail: 'Scanner not configured' };
  }

  try {
    // Download file and send to scanner service
    const [fileBuffer] = await bucket.file(gcsKey).download();

    const response = await fetch(`${scannerUrl}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(fileBuffer),
      signal: AbortSignal.timeout(30_000), // 30-second timeout
    });

    const data = await response.json();

    if (!response.ok) {
      return { clean: false, result: 'error', detail: 'Scanner returned error' };
    }

    const clean = data.status === 'clean' || data.result === 'No Threat Found';
    return {
      clean,
      result: clean ? 'clean' : 'infected',
      detail: data.detail ?? data.threat_name,
    };
  } catch (err: any) {
    console.error('[MalwareScanner] Scan failed:', err.message);
    return { clean: false, result: 'error', detail: err.message };
  }
}

// ─── Dispatch by file type ────────────────────────────────────────────────────
export async function processMedia(
  gcsKey: string,
  fileType: 'image' | 'video',
  mediaId: string,
  options: { generateSizes: boolean; transcodeVideo: boolean; isPrivate: boolean }
): Promise<ProcessingResult> {
  if (fileType === 'image' && options.generateSizes) {
    return processImage(gcsKey, options.isPrivate);
  }
  if (fileType === 'video' && options.transcodeVideo) {
    return processVideo(gcsKey, mediaId, options.isPrivate);
  }
  // No processing needed — just return CDN URL (empty string for private)
  return { success: true, file_url: buildCdnUrl(gcsKey, options.isPrivate) };
}
