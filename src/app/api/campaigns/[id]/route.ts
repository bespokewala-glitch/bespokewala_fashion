import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import HeroCampaign from '@/models/HeroCampaign';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'No ID provided' }, { status: 400 });
    }

    const deletedCampaign = await HeroCampaign.findByIdAndDelete(id);
    
    if (!deletedCampaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Campaign deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'No ID provided' }, { status: 400 });
    }

    const body = await request.json();
    
    const updatedCampaign = await HeroCampaign.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!updatedCampaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign: updatedCampaign }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
