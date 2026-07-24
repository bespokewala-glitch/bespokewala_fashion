import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import HomepageSection from '@/models/HomepageSection';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const page = request.nextUrl.searchParams.get('page') || 'home';
    const sections = await HomepageSection.find({ page }).lean();
    return NextResponse.json({ success: true, sections }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { sectionType, content, page = 'home' } = body;

    if (!sectionType || !content) {
      return NextResponse.json({ success: false, error: 'Missing sectionType or content' }, { status: 400 });
    }

    // Upsert the section
    const section = await HomepageSection.findOneAndUpdate(
      { sectionType, page },
      { sectionType, content, page },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving homepage section:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
