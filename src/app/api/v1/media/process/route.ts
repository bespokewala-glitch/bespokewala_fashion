/**
 * POST /api/v1/media/process  (INTERNAL — called by Cloud Tasks or /confirm)
 *
 * This is the HTTP entry point for background job execution.
 * All actual processing logic lives in src/lib/media/processMediaJob.ts
 * so it can also be called directly via setImmediate (without HTTP overhead).
 *
 * Protected by x-internal-secret header — not callable from the internet.
 *
 * Request body:
 * { media_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMediaProcessingJob } from '@/lib/media/processMediaJob';

function isInternalRequest(req: NextRequest): boolean {
  const secret = req.headers.get('x-internal-secret');
  const expected = process.env.INTERNAL_API_SECRET || 'internal-dev-secret';
  return secret === expected;
}

export async function POST(req: NextRequest) {
  if (!isInternalRequest(req)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized.' } },
      { status: 403 }
    );
  }

  let media_id: string | undefined;

  try {
    const body = await req.json();
    media_id = body.media_id;

    if (!media_id) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'media_id is required.' } },
        { status: 400 }
      );
    }

    // Delegate to the shared job runner — all logic lives there
    await runMediaProcessingJob(media_id);

    return NextResponse.json({ success: true, media_id, message: 'Processing completed.' });
  } catch (err: any) {
    console.error('[Process Route] Error for', media_id, ':', err.message);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

