import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const data = await request.json();
    
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const taxonomy = await Taxonomy.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    if (!taxonomy) {
      return NextResponse.json({ error: 'Taxonomy not found' }, { status: 404 });
    }
    
    return NextResponse.json(taxonomy);
  } catch (error: any) {
    console.error('Error updating taxonomy:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A taxonomy with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const taxonomy = await Taxonomy.findByIdAndDelete(id);
    
    if (!taxonomy) {
      return NextResponse.json({ error: 'Taxonomy not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting taxonomy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
