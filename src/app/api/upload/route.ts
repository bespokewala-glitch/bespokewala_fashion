import { NextRequest, NextResponse } from 'next/server';
import { bucket, bucketName } from '@/lib/gcs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Make filename unique
    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const gcsKey = `uploads/${uniqueFilename}`;

    // Upload to Google Cloud Storage (public read)
    const gcsFile = bucket.file(gcsKey);
    await gcsFile.save(buffer, {
      contentType: file.type || 'application/octet-stream',
      // Ensure the object is publicly readable so next/image can fetch it directly
      metadata: { cacheControl: 'public, max-age=86400' },
    });

    // Return the direct public GCS CDN URL.
    // This avoids the /api/media proxy, which causes Vercel's image optimizer to
    // make a recursive call back into the deployment (→ INVALID_IMAGE_OPTIMIZE_REQUEST).
    const cdnBase = process.env.CDN_BASE_URL?.replace(/\/$/, '')
      || `https://storage.googleapis.com/${bucketName}`;
    const videoUrl = `${cdnBase}/${gcsKey}`;

    return NextResponse.json({ success: true, videoUrl }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
