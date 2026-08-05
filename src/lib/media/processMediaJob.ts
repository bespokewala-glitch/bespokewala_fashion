/**
 * Shared media processing job.
 *
 * Contains two exports:
 *   runMediaProcessingJob(mediaId)  — the actual processing logic
 *   enqueueProcessingJob(mediaId)  — dispatches to queue backend:
 *     • Cloud Tasks  if GOOGLE_CLOUD_TASKS_QUEUE is set  (production)
 *     • setImmediate in-process fallback                 (self-hosted / dev)
 *
 * The HTTP /api/v1/media/process endpoint also delegates here,
 * so all processing logic lives in one place.
 */

import dbConnect from '@/lib/mongoose';
import Media from '@/models/Media';
import { getEntityRule } from '@/lib/media/entityConfig';
import { processMedia, scanForMalware } from '@/lib/media/mediaProcessor';
import { bucket } from '@/lib/gcs';
import type { EntityType } from '@/models/Media';

// ─── Core job function ────────────────────────────────────────────────────────

/**
 * Runs the full processing pipeline for a media record.
 * Safe to call from: HTTP handler, Cloud Tasks webhook, setImmediate.
 *
 * Idempotent — checks status before doing anything.
 */
export async function runMediaProcessingJob(mediaId: string): Promise<void> {
  await dbConnect();
  const media = await Media.findById(mediaId);

  if (!media) {
    console.warn(`[Job] Media ${mediaId} not found — skipping.`);
    return;
  }

  if (media.status !== 'processing') {
    console.warn(`[Job] Media ${mediaId} has status "${media.status}" — expected "processing". Skipping.`);
    return;
  }

  try {
    // ── Step 1: Malware scan ──────────────────────────────────────────────────
    const scanResult = await scanForMalware(media.gcs_key);

    if (scanResult.result === 'infected') {
      await bucket.file(media.gcs_key).delete().catch(() => {});
      await Media.findByIdAndUpdate(mediaId, {
        status: 'failed',
        is_malware_scanned: true,
        malware_scan_result: 'infected',
        error_message: `Malware detected: ${scanResult.detail ?? 'unknown threat'}`,
      });
      console.error(`[Job] Malware detected in ${mediaId}. File deleted.`);
      return;
    }

    // ── Step 2: Image / Video processing ─────────────────────────────────────
    const rule = getEntityRule(media.entity_type as EntityType);

    const result = await processMedia(
      media.gcs_key,
      media.file_type,
      media._id.toString(),
      { generateSizes: rule.generateSizes, transcodeVideo: rule.transcodeVideo, isPrivate: rule.isPrivate }
    );

    if (!result.success) {
      await Media.findByIdAndUpdate(mediaId, {
        status: 'failed',
        error_message: result.error ?? 'Processing failed.',
        is_malware_scanned: true,
        malware_scan_result: scanResult.result,
        $inc: { retry_count: 1 },
      });
      return;
    }

    // ── Step 3: Mark completed ────────────────────────────────────────────────
    const update: Record<string, unknown> = {
      status: 'completed',
      is_malware_scanned: true,
      malware_scan_result: scanResult.result,
      completed_at: new Date(),
      file_url: result.file_url,
    };
    if (result.thumbnail_url) update.thumbnail_url = result.thumbnail_url;
    if (result.medium_url)    update.medium_url    = result.medium_url;
    if (result.webp_url)      update.webp_url      = result.webp_url;
    if (result.hls_url)       update.hls_url       = result.hls_url;
    if (result.width)         update.width         = result.width;
    if (result.height)        update.height        = result.height;
    if (result.duration)      update.duration      = result.duration;

    await Media.findByIdAndUpdate(mediaId, update);
    console.log(`[Job] Media ${mediaId} completed successfully.`);

  } catch (err: any) {
    console.error(`[Job] Unhandled error for ${mediaId}:`, err.message);
    await Media.findByIdAndUpdate(mediaId, {
      status: 'failed',
      error_message: err.message,
      $inc: { retry_count: 1 },
    }).catch(() => {});
  }
}

// ─── Queue dispatcher ─────────────────────────────────────────────────────────

/**
 * Dispatches a processing job to the best available backend:
 *
 *  1. Google Cloud Tasks  — if GOOGLE_CLOUD_TASKS_QUEUE env var is set.
 *     Fully reliable, survives server restarts, has built-in retries.
 *     Set GOOGLE_CLOUD_TASKS_QUEUE to your full queue resource name:
 *     "projects/{project}/locations/{region}/queues/{queue-name}"
 *
 *  2. setImmediate (in-process) — fallback for self-hosted Node.js.
 *     Runs after the response is sent, within the same process.
 *     Works perfectly for self-hosted Next.js but will not survive
 *     serverless function termination (Vercel, Cloud Run).
 */
export async function enqueueProcessingJob(mediaId: string): Promise<void> {
  const tasksQueue = process.env.GOOGLE_CLOUD_TASKS_QUEUE;

  // ── Option 1: Cloud Tasks ─────────────────────────────────────────────────
  if (tasksQueue) {
    try {
      const { CloudTasksClient } = await import('@google-cloud/tasks');
      const client = new CloudTasksClient();

      const taskUrl = `${process.env.NEXTAUTH_URL}/api/v1/media/process`;

      await client.createTask({
        parent: tasksQueue,
        task: {
          httpRequest: {
            httpMethod: 'POST' as const,
            url: taskUrl,
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
            },
            body: Buffer.from(JSON.stringify({ media_id: mediaId })).toString('base64'),
          },
          // Auto-retry up to 5 times with exponential backoff
        },
      });

      console.log(`[Queue] Cloud Tasks job enqueued for media ${mediaId}`);
      return;
    } catch (err: any) {
      // Fall through to in-process fallback
      console.warn(`[Queue] Cloud Tasks failed (${err.message}), falling back to in-process.`);
    }
  }

  // ── Option 2: In-process via setImmediate ─────────────────────────────────
  // Runs after the current response is fully sent.
  // Reliable for self-hosted Node.js; NOT reliable for serverless.
  console.log(`[Queue] Scheduling in-process job for media ${mediaId}`);
  setImmediate(() => {
    runMediaProcessingJob(mediaId).catch((err) => {
      console.error(`[Queue] In-process job failed for ${mediaId}:`, err.message);
    });
  });
}
