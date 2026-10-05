import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Exchange rates are disabled for this INR-only application.' }, { status: 404 });
}

