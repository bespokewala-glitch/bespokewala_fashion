export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { userImageBase64, garmentImageUrl, category } = await req.json();

    if (!userImageBase64 || !garmentImageUrl) {
      return NextResponse.json({ error: 'Missing images' }, { status: 400 });
    }

    let garmentImageBase64 = garmentImageUrl;

    let garmentBuffer: Buffer;
    let garmentMime = 'image/jpeg';

    // Get garment image buffer
    if (garmentImageUrl.startsWith('/')) {
      const filepath = path.join(process.cwd(), 'public', garmentImageUrl);
      try {
        garmentBuffer = await readFile(filepath);
        const ext = path.extname(filepath).toLowerCase();
        if (ext === '.png') garmentMime = 'image/png';
        else if (ext === '.webp') garmentMime = 'image/webp';
      } catch (err) {
        console.error('Error reading local garment image:', err);
        return NextResponse.json({ error: 'Failed to read garment image locally' }, { status: 500 });
      }
    } else if (garmentImageUrl.startsWith('data:image')) {
      const parts = garmentImageUrl.split(',');
      garmentMime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      garmentBuffer = Buffer.from(parts[1], 'base64');
    } else {
      // Fallback if it's an external URL
      try {
        const response = await fetch(garmentImageUrl);
        const arrayBuffer = await response.arrayBuffer();
        garmentBuffer = Buffer.from(arrayBuffer);
        garmentMime = response.headers.get('content-type') || 'image/jpeg';
      } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch external garment image' }, { status: 500 });
      }
    }

    // Get user image buffer
    const userParts = userImageBase64.split(',');
    const userMime = userParts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const userBuffer = Buffer.from(userParts[1], 'base64');

    // Create form data
    const formData = new FormData();
    formData.append('clothing_image', new Blob([new Uint8Array(garmentBuffer)], { type: garmentMime }), 'clothing.jpg');
    formData.append('avatar_image', new Blob([new Uint8Array(userBuffer)], { type: userMime }), 'avatar.jpg');
    formData.append('clothing_prompt', ''); 
    formData.append('avatar_prompt', ''); 
    
    // Call RapidAPI
    const rapidRes = await fetch('https://try-on-diffusion.p.rapidapi.com/try-on-file', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'try-on-diffusion.p.rapidapi.com'
        // Do NOT set Content-Type header; fetch automatically sets multipart/form-data with the correct boundary
      },
      body: formData
    });

    if (!rapidRes.ok) {
      const errText = await rapidRes.text();
      let errorMessage = 'Failed to process image with RapidAPI';
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) errorMessage = errJson.message;
      } catch (e) {
        errorMessage = errText;
      }
      console.error('RapidAPI Error:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const contentType = rapidRes.headers.get('content-type') || '';

    if (contentType.includes('image')) {
      const arrayBuffer = await rapidRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const resultImageUrl = `data:${contentType};base64,${base64}`;
      return NextResponse.json({ resultImageUrl });
    }

    // Fallback if the API returns a JSON response containing the URL instead
    const data = await rapidRes.json();
    
    // The result image url is returned typically as data.url or data.image_url or data.data.url
    const resultImageUrl = data?.data?.url || data?.url || data?.image_url;

    if (!resultImageUrl) {
       console.error('Unexpected RapidAPI response structure:', data);
       return NextResponse.json({ error: 'Failed to extract generated image from response' }, { status: 500 });
    }

    return NextResponse.json({ resultImageUrl });

  } catch (error: any) {
    console.error('Virtual Try-On Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
