import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import HomepageSection from '@/models/HomepageSection';

export async function GET() {
  try {
    await dbConnect();
    const sections = await HomepageSection.find({}).lean();
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
    const { sectionType, content } = body;

    if (!sectionType || !content) {
      return NextResponse.json({ success: false, error: 'Missing sectionType or content' }, { status: 400 });
    }

    // Upsert the section
    const section = await HomepageSection.findOneAndUpdate(
      { sectionType },
      { sectionType, content },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving homepage section:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
