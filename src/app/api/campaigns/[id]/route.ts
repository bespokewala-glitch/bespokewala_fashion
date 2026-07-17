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
