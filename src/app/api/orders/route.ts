import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { items, shippingDetails, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Cart is empty' }, { status: 400 });
    }

    if (!shippingDetails) {
      return NextResponse.json({ message: 'Shipping details are required' }, { status: 400 });
    }

    // Optional: Get user from token if logged in
    const tokenCookie = (await cookies()).get('token');
    let userId = null;
    if (tokenCookie) {
      try {
        const decoded = await verifyToken(tokenCookie.value);
        userId = decoded?.userId;
      } catch (err) {
        // Ignore invalid token, just treat as guest
      }
    }

    // Calculate totals securely on the server
    let calculatedSubtotal = 0;
    const finalItems = [];
    
    for (const item of items) {
      if (!item.productSlug) {
        return NextResponse.json({ message: 'Product slug is required for all items' }, { status: 400 });
      }
      
      const product = await Product.findOne({ slug: item.productSlug });
      if (!product) {
        return NextResponse.json({ message: `Product not found: ${item.name || item.productSlug}` }, { status: 404 });
      }
      
      calculatedSubtotal += product.price * item.quantity;
      
      finalItems.push({
        productId: product._id,
        name: product.name,
        price: product.price, // using true price from DB
        quantity: item.quantity,
        image: item.image || (product.images && product.images[0]) || '',
        size: item.size
      });
    }

    const calculatedShipping = 0;
    const calculatedTotal = calculatedSubtotal + calculatedShipping;

    const newOrder = await Order.create({
      user: userId,
      items: finalItems,
      shippingDetails,
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'completed', // Simulated successful payment
      orderStatus: 'confirmed',
      subtotal: calculatedSubtotal,
      shippingCost: calculatedShipping,
      total: calculatedTotal
    });

    return NextResponse.json({ 
      success: true, 
      orderId: newOrder._id.toString(),
      message: 'Order placed successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Order placement error:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
