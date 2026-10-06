export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Geolocation is disabled for this INR-only application.' }, { status: 404 });
}
