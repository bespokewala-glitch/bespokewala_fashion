import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHamburger from '@/components/admin/AdminHamburger';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value || cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login?redirect=/dashboard');
  }

  const user = await verifyToken(token);

  if (!user || user.role !== 'admin') {
    redirect('/login?redirect=/dashboard&error=unauthorized');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      {/* Overriding the global storefront body padding for the admin dashboard */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          body { padding-top: 0 !important; }
        }
      `}} />
      <Suspense fallback={<div className="admin-desktop-sidebar" style={{ backgroundColor: '#0d0d0d' }} />}>
        <AdminSidebar />
      </Suspense>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* LUXURY MOBILE HEADER */}
        <div 
          className="desktop-hide"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0 16px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #eaeaea',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            height: '64px',
            flexShrink: 0
          }}
        >
          <div style={{ width: '44px' }}>
            <AdminHamburger />
          </div>
          <div style={{ fontWeight: 600, letterSpacing: '0.15em', fontSize: '0.95rem', color: '#111' }}>
            BESPOKEWALA
          </div>
          <div style={{ width: '44px', display: 'flex', justifyContent: 'flex-end' }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#333' }}>
               A
             </div>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
