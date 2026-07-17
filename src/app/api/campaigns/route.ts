import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import HeroCampaign from '@/models/HeroCampaign';

export async function GET() {
  try {
    await dbConnect();
    const campaigns = await HeroCampaign.find({}).sort({ order: 1 });
    return NextResponse.json({ success: true, campaigns }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Simple logic to set order if not provided
    if (body.order === undefined) {
      const count = await HeroCampaign.countDocuments();
      body.order = count;
    }
    
    const campaign = await HeroCampaign.create(body);
    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
