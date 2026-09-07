import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  let userId = payload?.userId || payload?.id;
  
  if (userId && typeof userId === 'object' && userId.buffer) {
    userId = Buffer.from(Object.values(userId.buffer)).toString('hex');
  } else if (userId) {
    userId = userId.toString();
  }
  
  return userId || null;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
