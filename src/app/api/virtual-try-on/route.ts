import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.FASHN_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Virtual Try-On is currently unavailable (API key missing)' }, { status: 500 });
    }

    if (body.jobId) {
      // Polling request
      const statusRes = await fetch(`https://api.fashn.ai/v1/status/${body.jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      const statusData = await statusRes.json();
      return NextResponse.json(statusData);
    } else {
      // Initial request
      const { userImageBase64, productImageUrl } = body;
      
      const payload = {
        model_image: userImageBase64,
        garment_image: productImageUrl,
        category: "one-pieces", // Best fit for couture/lehengas/gowns
        nsfw_filter: false
      };

      const runRes = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const runData = await runRes.json();
      return NextResponse.json(runData);
    }
  } catch (error: any) {
    console.error("Virtual Try On Error:", error);
    return NextResponse.json({ error: 'An error occurred while communicating with the try-on service.' }, { status: 500 });
  }
}
