import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename: replace spaces and special chars
    const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const uniqueFilename = `${Date.now()}-${safeName}`;
    const gcsKey = `uploads/${uniqueFilename}`;

    // Upload to private GCS bucket using server-side credentials
    const gcsFile = bucket.file(gcsKey);
    await gcsFile.save(buffer, {
      contentType: file.type || 'application/octet-stream',
      // Content is immutable once uploaded — safe to cache for a long time
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });

    // IMPORTANT: Return the internal proxy URL, NOT a direct GCS CDN URL.
    // The GCS bucket is PRIVATE. Direct GCS URLs return 403 in the browser.
    // The /api/media/[...path] route authenticates with GCS server-side and
    // streams the file bytes back to the browser securely.
    //
    // next/image must use unoptimized={shouldBypassOptimizer(url)} for these
    // proxy URLs — see src/lib/imageUrl.ts. Vercel's image optimizer cannot
    // make a recursive call back into the same serverless deployment.
    const videoUrl = `/api/media/${gcsKey}`;

    return NextResponse.json({ success: true, videoUrl }, { status: 201 });
  } catch (error: any) {
    console.error('[upload] Error uploading file to GCS:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
