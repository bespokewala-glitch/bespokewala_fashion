export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const userId = authUser.id || authUser.userId;

    const { id: addressId } = await context.params;
    const data = await request.json();

    await dbConnect();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset others
    if (data.isDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    // Update fields
    Object.keys(data).forEach(key => {
      address[key] = data[key];
    });

    await user.save();

    return NextResponse.json({ 
      message: 'Address updated successfully', 
      addresses: user.addresses 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user: authUser, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const userId = authUser.id || authUser.userId;

    const { id: addressId } = await context.params;

    await dbConnect();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    // If we deleted the default, set the first remaining one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return NextResponse.json({ 
      message: 'Address deleted successfully', 
      addresses: user.addresses 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
