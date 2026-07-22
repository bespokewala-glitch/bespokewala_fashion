import AdminSidebar from '@/components/admin/AdminSidebar';
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
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
