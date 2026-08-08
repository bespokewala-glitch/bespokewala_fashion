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
    <>
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
        }} className="mobile-p-4 mobile-pt-24">
          <div style={{
            display: 'flex',
            gap: '5rem',
            flexDirection: 'row',
          }} className="mobile-flex-col">
          <AccountSidebar />
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
          </div>
        </div>
      </div>
          </>
  );
}
