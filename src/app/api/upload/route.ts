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

    // Make filename unique
    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // Upload to Google Cloud Storage
    const fileOptions = {
      contentType: file.type || 'application/octet-stream',
    };

    const gcsFile = bucket.file(`uploads/${uniqueFilename}`);
    
    await gcsFile.save(buffer, fileOptions);

    // Return the proxy URL instead of the direct GCS URL to avoid public access requirements
    const videoUrl = `/api/media/uploads/${uniqueFilename}`;

    return NextResponse.json({ success: true, videoUrl }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
