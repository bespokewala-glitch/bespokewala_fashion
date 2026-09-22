import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import OrderHistoryClient from '@/components/account/OrderHistoryClient';

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  await dbConnect();
  
  const rawOrders = await Order.find({ user: user.userId })
    .sort({ createdAt: -1 })
    .lean();

  const serializedOrders = rawOrders.map((o: any) => ({
    _id: o._id.toString(),
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    total: o.total || 0,
    displayCurrency: o.displayCurrency,
    displayTotal: o.displayTotal,
    orderStatus: o.orderStatus || 'pending',
    shippingDetails: o.shippingDetails ? {
      firstName: o.shippingDetails.firstName || '',
      lastName: o.shippingDetails.lastName || '',
    } : undefined,
    items: Array.isArray(o.items) ? o.items.map((item: any) => ({
      name: item.name || '',
      image: item.image || '',
      size: item.size || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
    })) : [],
  }));

  return <OrderHistoryClient orders={serializedOrders} />;
}
