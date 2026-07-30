"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Heart, MapPin, Settings, LogOut } from 'lucide-react';

export default function AccountSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/account', icon: LayoutDashboard },
    { name: 'Order History', path: '/account/orders', icon: ShoppingBag },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
    { name: 'Addresses', path: '/account/addresses', icon: MapPin },
    { name: 'Profile Settings', path: '/account/settings', icon: Settings },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div style={{
      width: '280px',
      flexShrink: 0,
      paddingRight: '3rem',
      borderRight: '1px solid #eaeaea',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ 
          fontSize: '0.8rem', 
          fontWeight: 600, 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase', 
          color: '#000',
          marginBottom: '1.5rem'
        }}>
          My Account
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            // For dashboard, we want an exact match. For others, startsWith is fine
            const isActive = item.path === '/account' 
              ? pathname === '/account' 
              : pathname.startsWith(item.path);
            
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#000' : '#888',
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s ease',
                  borderLeft: '2px solid',
                  borderColor: isActive ? '#D4AF37' : 'transparent',
                  position: 'relative',
                  left: '-1px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#888';
                  }
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} color={isActive ? '#D4AF37' : 'currentColor'} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #eaeaea' }}>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            color: '#666',
            textAlign: 'left',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
        >
          <LogOut size={18} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
