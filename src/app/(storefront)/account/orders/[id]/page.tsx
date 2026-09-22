import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import OrderDetailClient from '@/components/account/OrderDetailClient';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await params;

  await dbConnect();
  
  const orderDoc: any = await Order.findById(resolvedParams.id).lean();

  if (!orderDoc) {
    redirect('/account/orders');
  }

  const serializedOrder = {
    _id: orderDoc._id.toString(),
    createdAt: orderDoc.createdAt ? new Date(orderDoc.createdAt).toISOString() : new Date().toISOString(),
    total: orderDoc.total || 0,
    displayCurrency: orderDoc.displayCurrency,
    displayTotal: orderDoc.displayTotal,
    orderStatus: orderDoc.orderStatus || 'pending',
    shippingDetails: orderDoc.shippingDetails ? {
      firstName: orderDoc.shippingDetails.firstName || '',
      lastName: orderDoc.shippingDetails.lastName || '',
      address: orderDoc.shippingDetails.address || '',
      city: orderDoc.shippingDetails.city || '',
      state: orderDoc.shippingDetails.state || '',
      zipCode: orderDoc.shippingDetails.zipCode || '',
      country: orderDoc.shippingDetails.country || '',
      phone: orderDoc.shippingDetails.phone || '',
    } : undefined,
    items: Array.isArray(orderDoc.items) ? orderDoc.items.map((item: any) => ({
      name: item.name || '',
      image: item.image || '',
      size: item.size || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
    })) : [],
  };

  return <OrderDetailClient order={serializedOrder} />;
}
