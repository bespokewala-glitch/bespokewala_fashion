"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [user, setUser] = useState<{name: string, role: string} | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Fetch user state
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 100,
    transition: 'all 0.3s ease',
    backgroundColor: isScrolled || !isHomePage ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
    borderBottom: isScrolled || !isHomePage ? '1px solid #eee' : 'none',
    color: isScrolled || !isHomePage ? '#1c1c1c' : '#ffffff',
  };

  const isLightHeader = isScrolled || !isHomePage;

  const navContainer: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 4rem',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 300,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  };

  const menuStyle: React.CSSProperties = {
    display: 'flex',
    gap: '2rem',
    listStyle: 'none',
    fontSize: '0.875rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    alignItems: 'center',
  };

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="remove-white-make-white">
            <feColorMatrix type="matrix" values="
              0 0 0 0 1
              0 0 0 0 1
              0 0 0 0 1
              -0.333 -0.333 -0.333 0 1
            " />
          </filter>
          <filter id="remove-white-make-black">
            <feColorMatrix type="matrix" values="
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              -0.333 -0.333 -0.333 0 1
            " />
          </filter>
        </defs>
      </svg>
      <header style={headerStyle}>
        <div style={navContainer}>
          <nav>
            <ul style={menuStyle}>
              <li><Link href="/products?category=couture">Couture</Link></li>
              <li><Link href="/products?category=diffusion">Diffusion</Link></li>
              <li><Link href="/products?category=jewellery">Jewellery</Link></li>
              <li><Link href="/products?category=beauty">Beauty</Link></li>
            </ul>
          </nav>
          
          <div style={logoStyle}>
            <Link href="/" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '45px',
              overflow: 'hidden'
            }}>
              <img 
                src="/bespoken.png" 
                alt="Bespoken Fashion" 
                style={{ 
                  height: '140px',
                  width: 'auto', 
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: isLightHeader ? 'url(#remove-white-make-black)' : 'url(#remove-white-make-white)'
                }} 
              />
            </Link>
          </div>
          
          <nav>
            <ul style={menuStyle}>
              <li><Link href="/search">Search</Link></li>
              {user ? (
                <>
                  <li><Link href="/account">Account</Link></li>
                  {user.role === 'admin' && (
                    <li><Link href="/dashboard/campaigns" style={{ fontWeight: 'bold' }}>Admin</Link></li>
                  )}
                  <li><a href="#" onClick={handleLogout} className="text-gray-500 hover:text-current transition-colors">Logout</a></li>
                </>
              ) : (
                <li><Link href="/login">Login</Link></li>
              )}
              <li><Link href="/cart">Cart (0)</Link></li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
