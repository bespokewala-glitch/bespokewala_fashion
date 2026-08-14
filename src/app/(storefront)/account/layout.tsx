import React from 'react';
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
    <div style={{
      backgroundColor: '#FAF9F6',
      minHeight: '100vh'
    }}>
      <div 
        style={{
          paddingTop: '11rem',
          paddingBottom: '8rem',
          paddingLeft: '4rem',
          paddingRight: '4rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }} 
        className="account-container-padding"
      >
        <div 
          style={{
            display: 'flex',
            gap: '3.5rem',
            flexDirection: 'row',
          }} 
          className="account-layout-flex"
        >
          <AccountSidebar />
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
