"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  const getLinkStyle = (path: string) => ({
    padding: '8px 16px',
    backgroundColor: pathname === path ? '#000' : '#eee',
    color: pathname === path ? '#fff' : '#000',
    textDecoration: 'none',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <Link href="/dashboard" style={getLinkStyle('/dashboard')}>
        Dashboard
      </Link>
      <Link href="/dashboard/orders" style={getLinkStyle('/dashboard/orders')}>
        Orders
      </Link>
      <Link href="/dashboard/products" style={getLinkStyle('/dashboard/products')}>
        Products
      </Link>
      <Link href="/dashboard/users" style={getLinkStyle('/dashboard/users')}>
        Users
      </Link>
      <Link href="/dashboard/campaigns" style={getLinkStyle('/dashboard/campaigns')}>
        Campaigns
      </Link>
      <Link href="/dashboard/homepage" style={getLinkStyle('/dashboard/homepage')}>
        Homepage Sections
      </Link>
      <Link href="/" style={{
        ...getLinkStyle('/'),
        marginLeft: 'auto',
        backgroundColor: '#ff4d4f',
        color: '#fff'
      }}>
        Return to Store
      </Link>
    </div>
  );
}
