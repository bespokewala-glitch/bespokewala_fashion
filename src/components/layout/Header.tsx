"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [megaMenuImages, setMegaMenuImages] = useState<string[]>(['', '', '']);
  const [user, setUser] = useState<{name: string, role: string} | null>(null);
  const { cartCount } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (hoveredNav && hoveredCategory) {
      fetch(`/api/menu-images?productType=${hoveredNav}&category=${hoveredCategory}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0 && data[0].images) {
            const fetched = data[0].images;
            setMegaMenuImages([fetched[0] || '', fetched[1] || '', fetched[2] || '']);
          } else {
            setMegaMenuImages(['', '', '']);
          }
        })
        .catch(console.error);
    }
  }, [hoveredNav, hoveredCategory]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  const handleMouseEnterMenu = (navId: string) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    
    // If a menu is already open, add a delay before switching to prevent 
    // the "diagonal hover problem" when moving mouse towards the sub-menu.
    if (hoveredNav && hoveredNav !== navId) {
      enterTimeoutRef.current = setTimeout(() => {
        setHoveredNav(navId);
        setHoveredCategory(null);
      }, 300); // 300ms delay gives enough time to cross sibling items
    } else {
      setHoveredNav(navId);
    }
  };

  const handleMouseLeaveMenu = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredNav(null);
      setHoveredCategory(null);
    }, 150);
  };

  const handleMouseEnterSubMenu = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
  };

  const handleMouseLeaveSubMenu = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredNav(null);
      setHoveredCategory(null);
    }, 150);
  };

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 100,
    transition: 'all 0.3s ease',
    backgroundColor: (isScrolled || !isHomePage || hoveredNav) ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
    borderBottom: (isScrolled || !isHomePage || hoveredNav) ? '1px solid #eee' : 'none',
    color: (isScrolled || !isHomePage || hoveredNav) ? '#1c1c1c' : '#ffffff',
  };

  const isLightHeader = isScrolled || !isHomePage || hoveredNav;

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
    margin: 0,
    padding: 0,
  };

  const subNavContainer: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTop: '1px solid #eee',
    display: hoveredNav ? 'flex' : 'none',
    justifyContent: 'center',
    padding: '0', // Adjust padding since children will have padding for hover targets
    transition: 'all 0.3s ease',
  };

  type Subcategory = { label: string, href: string };
  type NavItem = { id: string, label: string, href: string, subcategories?: Subcategory[] };
  
  const menuData: Record<string, NavItem[]> = {
    couture: [
      { id: 'new', label: 'New Arrivals', href: '/products?productType=couture' },
      { 
        id: 'womens', label: 'Women', href: '/products?productType=couture&category=womens',
        subcategories: [
          { label: 'Lehengas', href: '/products?productType=couture&category=womens&subcategory=lehenga' },
          { label: 'Indo Western', href: '/products?productType=couture&category=womens&subcategory=indo-western' },
          { label: 'Light Lehenga', href: '/products?productType=couture&category=womens&subcategory=light-lehenga' },
          { label: 'Sarees', href: '/products?productType=couture&category=womens&subcategory=sarees' },
          { label: 'Suits', href: '/products?productType=couture&category=womens&subcategory=suits' },
          { label: 'Gowns', href: '/products?productType=couture&category=womens&subcategory=gowns' },
        ]
      },
      { 
        id: 'mens', label: 'Men', href: '/products?productType=couture&category=mens',
        subcategories: [
          { label: 'Shervani', href: '/products?productType=couture&category=mens&subcategory=shervani' },
          { label: 'Tuxedo', href: '/products?productType=couture&category=mens&subcategory=tuxedo' },
          { label: 'Suits', href: '/products?productType=couture&category=mens&subcategory=suits' },
          { label: 'Kurta', href: '/products?productType=couture&category=mens&subcategory=kurta' },
          { label: 'Bundi', href: '/products?productType=couture&category=mens&subcategory=bundi' },
          { label: 'Kurta Bundi Sets', href: '/products?productType=couture&category=mens&subcategory=kurta-bundi-sets' },
          { label: 'Bandgala', href: '/products?productType=couture&category=mens&subcategory=bandgala' },
          { label: 'Shirts', href: '/products?productType=couture&category=mens&subcategory=shirts' },
          { label: 'Indo Western', href: '/products?productType=couture&category=mens&subcategory=indo-western' },
          { label: 'Casual Jackets', href: '/products?productType=couture&category=mens&subcategory=casual-jackets' },
        ]
      },
    ],
    diffusion: [
      { id: 'new', label: 'New Arrivals', href: '/products?productType=diffusion' },
      { id: 'womens', label: 'Women', href: '/products?productType=diffusion&category=womens' },
      { id: 'mens', label: 'Men', href: '/products?productType=diffusion&category=mens' },
    ],
    jewellery: [
      { id: 'new', label: 'New Arrivals', href: '/products?productType=jewellery' },
      { id: 'womens', label: 'Women', href: '/products?productType=jewellery&category=womens' },
      { id: 'mens', label: 'Men', href: '/products?productType=jewellery&category=mens' },
    ],
    pret: [
      { id: 'new', label: 'New Arrivals', href: '/products?productType=pret' },
      { id: 'womens', label: 'Women', href: '/products?productType=pret&category=womens' },
      { id: 'mens', label: 'Men', href: '/products?productType=pret&category=mens' },
    ]
  };

  const activeSecondaryNav = hoveredNav ? menuData[hoveredNav] : null;
  const activeTertiaryNav = activeSecondaryNav?.find(item => item.id === hoveredCategory);

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
      <style>{`
        .menu-link-hover { transition: color 0.2s ease; }
        .menu-link-hover:hover { color: #888 !important; }
        .sub-link-hover { transition: color 0.2s ease; }
        .sub-link-hover:hover { color: #000 !important; }
      `}</style>
      <header style={headerStyle}>
        <div style={navContainer}>
          <nav>
            <ul style={menuStyle} onMouseLeave={handleMouseLeaveMenu}>
              <li onMouseEnter={() => handleMouseEnterMenu('couture')}><Link href="/products?productType=couture" style={{ padding: '1rem 0' }}>Couture</Link></li>
              <li onMouseEnter={() => handleMouseEnterMenu('diffusion')}><Link href="/products?productType=diffusion" style={{ padding: '1rem 0' }}>Diffusion</Link></li>
              <li onMouseEnter={() => handleMouseEnterMenu('jewellery')}><Link href="/products?productType=jewellery" style={{ padding: '1rem 0' }}>Jewellery</Link></li>
              <li onMouseEnter={() => handleMouseEnterMenu('pret')}><Link href="/products?productType=pret" style={{ padding: '1rem 0' }}>Pret</Link></li>
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
              <li><Link href="/cart">Cart ({cartCount})</Link></li>
            </ul>
          </nav>
        </div>
        
        {/* Sub-navigation Menu */}
        <div style={subNavContainer} onMouseEnter={handleMouseEnterSubMenu} onMouseLeave={handleMouseLeaveSubMenu}>
          <ul style={{ ...menuStyle, gap: '3rem', fontSize: '0.75rem', fontWeight: 500, color: '#333' }}>
            {activeSecondaryNav?.map((item) => (
              <li 
                key={item.id} 
                onMouseEnter={() => setHoveredCategory(item.id)}
                style={{ padding: '1.5rem 0', cursor: 'pointer', borderBottom: hoveredCategory === item.id ? '2px solid #000' : '2px solid transparent' }}
              >
                <Link href={item.href} onClick={() => { setHoveredNav(null); setHoveredCategory(null); }} className="menu-link-hover">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Tertiary Mega Menu Panel */}
          {activeTertiaryNav?.subcategories && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              backgroundColor: '#fff',
              borderTop: '1px solid #eee',
              boxShadow: '0 15px 30px rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'center',
              padding: '3rem 4rem',
              zIndex: 90,
              minHeight: '400px'
            }}>
              <div style={{ display: 'flex', width: '100%', maxWidth: '1400px' }}>
                <div style={{ flex: 1, display: 'flex', gap: '3rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em' }}>COLLECTIONS</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">THE INDIA STORY</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">INAYA SUMMER</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">AZTEC & FLORAL</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">LUX PRET</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">FESTIVE EDIT</Link></li>
                    </ul>
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em' }}>OCCASION</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">BRIDAL</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">RECEPTION</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">SANGEET</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">COCKTAIL</Link></li>
                      <li><Link href="#" style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">HALDI & MEHENDI</Link></li>
                    </ul>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em' }}>CATEGORIES</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activeTertiaryNav.subcategories.map(sub => (
                        <li key={sub.label}>
                          <Link 
                            href={sub.href} 
                            onClick={() => { setHoveredNav(null); setHoveredCategory(null); }}
                            style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            className="sub-link-hover"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Image Grid matching the Manish Malhotra layout */}
                <div style={{ flex: 1.2, display: 'flex', gap: '1rem', paddingLeft: '3rem' }}>
                   <div style={{ flex: 1, backgroundColor: '#f0f0f0', backgroundImage: `url(${megaMenuImages[0] || 'https://images.unsplash.com/photo-1599643478514-4a4e09b52342?auto=format&fit=crop&q=80'})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '400px' }}></div>
                   <div style={{ flex: 1, backgroundColor: '#e5e5e5', backgroundImage: `url(${megaMenuImages[1] || 'https://images.unsplash.com/photo-1579298245158-33e8f568f7d3?auto=format&fit=crop&q=80'})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '400px' }}></div>
                   <div style={{ flex: 1, backgroundColor: '#d5d5d5', backgroundImage: `url(${megaMenuImages[2] || 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?auto=format&fit=crop&q=80'})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '400px' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
