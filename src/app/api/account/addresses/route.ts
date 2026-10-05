import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const { user: authUser, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const userId = authUser.id || authUser.userId;

    await dbConnect();
    const user = await User.findById(userId).select('addresses');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ addresses: user.addresses || [] });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user: authUser, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const userId = authUser.id || authUser.userId;

    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'country', 'phone'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    await dbConnect();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is the first address or isDefault is true, manage defaults
    const isFirstAddress = user.addresses.length === 0;
    const shouldBeDefault = isFirstAddress || data.isDefault;

    if (shouldBeDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      ...data,
      isDefault: shouldBeDefault
    });

    await user.save();

    return NextResponse.json({ 
      message: 'Address added successfully', 
      addresses: user.addresses 
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error adding address:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

