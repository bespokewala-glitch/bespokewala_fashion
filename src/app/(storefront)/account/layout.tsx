import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AccountSidebar from '@/components/account/AccountSidebar';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Header />
      <div style={{
        backgroundColor: '#FAF9F6',
        minHeight: '100vh'
      }}>
        <div style={{
          paddingTop: '13rem',
          paddingBottom: '8rem',
          paddingLeft: '4rem',
          paddingRight: '4rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'flex',
            gap: '5rem',
            flexDirection: 'row',
          }}>
          <AccountSidebar />
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
