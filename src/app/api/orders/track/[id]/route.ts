export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Fetch order without populated PII
    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Return only non-PII data for tracking purposes
    return NextResponse.json({
      id: order._id.toString(),
      total: order.total,
      currency: "INR",
      items: order.items.map((item: any) => ({
        productId: item.productId?.toString(),
        slug: item.productSlug || item.productId?.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  } catch (error: any) {
    console.error('Track order error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
