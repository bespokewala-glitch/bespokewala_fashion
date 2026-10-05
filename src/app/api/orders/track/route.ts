import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const { orderId, email } = await request.json();
    
    if (!orderId || !email) {
      return NextResponse.json({ message: 'Order ID and email are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if orderId is a valid ObjectId, otherwise it might be a custom ID (but the schema uses ObjectId)
    let query: any = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      // If the schema supported custom string IDs we would query by that, but here it's likely an ObjectId
      // For now, if it's not a valid ObjectId, we return not found
      return NextResponse.json({ message: 'Order not found or access denied' }, { status: 404 });
    }

    const order = await Order.findById(query._id).populate('user').lean();

    if (!order) {
      return NextResponse.json({ message: 'Order not found or access denied' }, { status: 404 });
    }

    // Verify email (case-insensitive)
    const orderEmail = order.shippingDetails?.email?.toLowerCase();
    const userEmail = order.user && (order.user as any).email ? (order.user as any).email.toLowerCase() : null;
    const providedEmail = email.toLowerCase().trim();

    if (orderEmail !== providedEmail && userEmail !== providedEmail) {
      return NextResponse.json({ message: 'Order not found or access denied' }, { status: 404 }); // Returning 404 to not leak existence
    }

    // Map orderStatus to track UI steps:
    // placed, confirmed, processing, shipped, delivered
    let statusKey = "placed";
    if (order.orderStatus === 'confirmed') statusKey = 'confirmed';
    if (order.orderStatus === 'production' || order.orderStatus === 'qc') statusKey = 'processing';
    if (order.orderStatus === 'dispatched' || order.orderStatus === 'in_transit') statusKey = 'shipped';
    if (order.orderStatus === 'delivered') statusKey = 'delivered';
    if (order.orderStatus === 'cancelled') statusKey = 'cancelled';

    // Mock timeline if we don't store it in DB
    const timeline = [];
    if (order.createdAt) {
      timeline.push({ status: "placed", date: new Date(order.createdAt).toLocaleString('en-IN'), note: "Order received." });
    }
    
    if (statusKey === 'cancelled') {
        timeline.push({ status: "cancelled", date: new Date(order.updatedAt).toLocaleString('en-IN'), note: "Order cancelled." });
    }

    // Return tracking data
    return NextResponse.json({
      id: order._id.toString(),
      status: statusKey,
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A',
      eta: 'TBD', // Depending on shipping policy
      courier: 'TBD', 
      trackingNumber: 'TBD',
      trackingUrl: '#',
      items: order.items.map((item: any) => ({
        name: item.name,
        qty: item.quantity,
        size: item.size || 'N/A',
        color: 'N/A' // Not in schema directly, fallback to N/A
      })),
      timeline: timeline,
    });
  } catch (error: any) {
    console.error('Track order error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

