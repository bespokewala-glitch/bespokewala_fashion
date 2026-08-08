import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHamburger from '@/components/admin/AdminHamburger';
import { Suspense } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Suspense fallback={<div style={{ width: '250px', backgroundColor: '#111' }} />}>
        <AdminSidebar />
      </Suspense>
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', left: '16px', zIndex: 999 }} className="mobile-hamburger-wrapper">
          <AdminHamburger />
        </div>
        {children}
      </main>
    </div>
  );
}
