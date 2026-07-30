import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';
import { Readable } from 'stream';

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
    console.log('[media] Serving GCS file:', fileParam);

    const gcsFile = bucket.file(fileParam);
    const [exists] = await gcsFile.exists();

    if (!exists) {
      console.error('[media] File not found in GCS:', fileParam);
      return new NextResponse('File not found', { status: 404 });
    }

    // Get file metadata to set the correct content type
    const [metadata] = await gcsFile.getMetadata();
    const contentType = (metadata.contentType as string) || 'application/octet-stream';

    // Download the entire file as a Buffer and return it
    const [fileBuffer] = await gcsFile.download();

    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error: any) {
    console.error('[media] Error serving media from GCS:', error.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
