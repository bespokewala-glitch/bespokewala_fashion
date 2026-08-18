import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CheckoutClient from '@/components/checkout/CheckoutClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Bespokewala',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login?redirect=/checkout');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login?redirect=/checkout');
  }

  return (
    <>
            <main style={{ minHeight: '80vh', paddingTop: '6rem', paddingBottom: '6rem' }}>
        <CheckoutClient />
      </main>
          </>
  );
}
