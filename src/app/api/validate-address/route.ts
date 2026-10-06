export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { validateAddress } from '@/lib/addressValidation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Perform robust server-side validation
    const validationResult = await validateAddress(body);
    
    return NextResponse.json(validationResult, { status: 200 });
  } catch (error: any) {
    console.error("Validation API error:", error);
    // Don't leak internals to frontend, just return a safe fallback response
    return NextResponse.json({ 
      isValid: true, 
      message: "Address verification is temporarily unavailable." 
    }, { status: 200 });
  }
}
