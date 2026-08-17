"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Heart, MapPin, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function AccountSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const activeItem = navItems.find((item) =>
    item.path === '/account' ? pathname === '/account' : pathname.startsWith(item.path)
  ) || navItems[0];

  return (
    <>
      {/* ── MOBILE ACCOUNT NAVIGATION BAR (<1024px) ── */}
      <div className="desktop-hide" style={{ width: '100%', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            backgroundColor: '#fff',
            border: '1px solid #eaeaea',
            fontSize: '0.85rem',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#000',
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <activeItem.icon size={18} color="#D4AF37" />
            <span>My Account: <strong style={{ color: '#000' }}>{activeItem.name}</strong></span>
          </div>
          <ChevronDown size={18} style={{ transform: isMobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {isMobileOpen && (
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #eaeaea',
            borderTop: 'none',
            padding: '0.5rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          }}>
            {navItems.map((item) => {
              const isActive = item.path === '/account' ? pathname === '/account' : pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1.25rem',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    color: isActive ? '#000' : '#666',
                    backgroundColor: isActive ? '#faf9f6' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? '3px solid #D4AF37' : '3px solid transparent',
                    minHeight: '44px',
                  }}
                >
                  <Icon size={18} color={isActive ? '#D4AF37' : '#888'} />
                  {item.name}
                </Link>
              );
            })}
            <div style={{ borderTop: '1px solid #eee', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '0.85rem',
                  color: '#c0392b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: '44px',
                }}
              >
                <LogOut size={18} color="#c0392b" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP SIDEBAR (≥1024px) ── */}
      <div 
        className="mobile-hide"
        style={{
          width: '280px',
          flexShrink: 0,
          paddingRight: '3rem',
          borderRight: '1px solid #eaeaea',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
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
          >
            <LogOut size={18} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
