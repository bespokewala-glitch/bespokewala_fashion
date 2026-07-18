"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Image as ImageIcon, 
  LayoutTemplate, 
  LogOut 
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Products', path: '/dashboard/products', icon: Package },
    { name: 'Users', path: '/dashboard/users', icon: Users },
    { name: 'Campaigns', path: '/dashboard/campaigns', icon: ImageIcon },
    { name: 'Homepage Sections', path: '/dashboard/homepage', icon: LayoutTemplate },
  ];

  return (
    <div style={{ 
      width: '260px', 
      backgroundColor: '#111', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '30px 20px', borderBottom: '1px solid #333' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.05em' }}>BESPOKEN</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>Admin Portal</p>
      </div>

      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 15px',
                backgroundColor: isActive ? '#333' : 'transparent',
                color: isActive ? '#fff' : '#aaa',
                textDecoration: 'none',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 600 : 400
              }}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
        <Link 
          href="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: '#ff4d4f',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            fontWeight: 600,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <LogOut size={18} />
          Return to Store
        </Link>
      </div>
    </div>
  );
}
