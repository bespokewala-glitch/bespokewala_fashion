"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

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
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        // Use sessionStorage cache to avoid re-fetching on every page navigation
        const cached = sessionStorage.getItem('header_taxonomies');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.ts && Date.now() - parsed.ts < 60_000) {
              setTaxonomies(parsed.data);
              return;
            }
          } catch { /* ignore parse errors */ }
        }
        const res = await fetch('/api/taxonomies?enabled=true');
        if (res.ok) {
          const data = await res.json();
          setTaxonomies(data);
          sessionStorage.setItem('header_taxonomies', JSON.stringify({ ts: Date.now(), data }));
        }
      } catch (e) {
        console.error('Failed to fetch taxonomies in header');
      }
    };
    fetchTaxonomies();
  }, []);

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
      // Debounce menu-image fetch to 200ms — avoids firing on accidental mouse-overs
      const timer = setTimeout(() => {
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
      }, 200);
      return () => clearTimeout(timer);
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

  const menuData: Record<string, { id: string; label: string; href: string }[]> = {
    couture: [
      { id: 'new-arrivals', label: 'New Arrivals', href: '/products/couture/new-arrivals' },
      { id: 'womens', label: 'Women', href: '/products/couture/womens' },
      { id: 'mens', label: 'Men', href: '/products/couture/mens' },
    ],
    jewellery: [
      { id: 'new-arrivals', label: 'New Arrivals', href: '/products/jewellery/new-arrivals' },
      { id: 'signature-collection', label: 'Signature Collection', href: '/products/jewellery/signature-collection' },
      { id: 'diamond-collection', label: 'Diamond Collection', href: '/products/jewellery/diamond-collection' },
      { id: 'menswear-collection', label: 'Menswear Collection', href: '/products/jewellery/menswear-collection' },
    ],
    accessories: [
      { id: 'womens', label: 'Women', href: '/products/accessories/womens' },
      { id: 'mens', label: 'Men', href: '/products/accessories/mens' },
    ],
  };

  const activeSecondaryNav = hoveredNav ? menuData[hoveredNav as string] || [] : [];

  const collections = taxonomies.filter(t => t.type === 'collection' && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(hoveredNav as string)) && (!t.genders || t.genders.length === 0 || t.genders.includes(hoveredCategory as string)));
  const occasions = taxonomies.filter(t => t.type === 'occasion' && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(hoveredNav as string)) && (!t.genders || t.genders.length === 0 || t.genders.includes(hoveredCategory as string)));
  const categories = taxonomies.filter(t => t.type === 'category' && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(hoveredNav as string)) && (!t.genders || t.genders.length === 0 || t.genders.includes(hoveredCategory as string)));

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
              <li onMouseEnter={() => handleMouseEnterMenu('couture')}>
                <Link prefetch={false} href="/" style={{ padding: '1rem 0', display: 'inline-block' }} className="menu-link-hover">Couture</Link>
              </li>
              <li onMouseEnter={() => handleMouseEnterMenu('accessories')}><Link prefetch={false} href="/products/accessories" style={{ padding: '1rem 0' }}>Accessories</Link></li>
              <li onMouseEnter={() => handleMouseEnterMenu('jewellery')}><Link prefetch={false} href="/products/jewellery" style={{ padding: '1rem 0' }}>Jewellery</Link></li>
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
              <li><Link href="/wishlist">Wishlist ({wishlistCount})</Link></li>
              <li><Link href="/cart">Cart ({cartCount})</Link></li>
            </ul>
          </nav>
        </div>
        
        {/* Sub-navigation Menu (Departments) */}
        <div style={subNavContainer} onMouseEnter={handleMouseEnterSubMenu} onMouseLeave={handleMouseLeaveSubMenu}>
          <ul style={{ ...menuStyle, gap: '3rem', fontSize: '0.75rem', fontWeight: 500, color: '#333' }}>
            {activeSecondaryNav?.map((item) => (
              <li 
                key={item.id} 
                onMouseEnter={() => setHoveredCategory(item.id)}
                style={{ 
                  padding: '1.5rem 0', 
                  cursor: 'pointer', 
                  borderBottom: hoveredCategory === item.id ? '2px solid #000' : '2px solid transparent',
                  position: 'relative'
                }}
              >
                <Link prefetch={false} href={item.href} onClick={() => { setHoveredNav(null); setHoveredCategory(null); }} className="menu-link-hover">
                  {item.label}
                </Link>

                {/* Simple Dropdown for Jewellery */}
                {hoveredNav === 'jewellery' && hoveredCategory === item.id && (categories.length > 0 || collections.length > 0) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    backgroundColor: '#fff',
                    padding: '1.5rem',
                    minWidth: '200px',
                    boxShadow: '4px 15px 30px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    zIndex: 100,
                    textAlign: 'left'
                  }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {categories.map(cat => (
                        <li key={cat._id}>
                          <Link 
                            prefetch={true}
                            href={`/products/${hoveredNav}/${hoveredCategory}/${cat.slug}`} 
                            onClick={() => { setHoveredNav(null); setHoveredCategory(null); }}
                            style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            className="sub-link-hover"
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                      {collections.map(col => (
                        <li key={col._id}>
                          <Link 
                            prefetch={false}
                            href={`/products/${hoveredNav}/${hoveredCategory}/${col.slug}`} 
                            onClick={() => { setHoveredNav(null); setHoveredCategory(null); }}
                            style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            className="sub-link-hover"
                          >
                            {col.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Tertiary Mega Menu Panel for Non-Jewellery Items */}
          {hoveredCategory && hoveredNav !== 'jewellery' && (
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
                  {collections.length > 0 && (
                    <div style={{ width: '220px' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em' }}>COLLECTIONS</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {collections.map(col => (
                          <li key={col._id}>
                            <Link prefetch={false} href={`/products/${hoveredNav}/${hoveredCategory}/${col.slug}`} style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">
                              {col.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {occasions.length > 0 && (
                    <div style={{ width: '220px' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em' }}>OCCASION</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {occasions.map(occ => (
                          <li key={occ._id}>
                            <Link prefetch={false} href={`/products/${hoveredNav}/${hoveredCategory}/${occ.slug}`} style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="sub-link-hover">
                              {occ.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {categories.length > 0 && (
                    <div style={{ width: '220px' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em' }}>CATEGORIES</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categories.map(cat => (
                          <li key={cat._id}>
                            <Link 
                              prefetch={true}
                              href={`/products/${hoveredNav}/${hoveredCategory}/${cat.slug}`} 
                              onClick={() => { setHoveredNav(null); setHoveredCategory(null); }}
                              style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                              className="sub-link-hover"
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Image Grid matching the Manish Malhotra layout */}
                {(megaMenuImages[0] || megaMenuImages[1] || megaMenuImages[2]) && (
                  <div style={{ flex: 1.2, display: 'flex', gap: '1rem', paddingLeft: '3rem' }}>
                     {megaMenuImages[0] ? <div style={{ flex: 1, backgroundColor: '#f0f0f0', backgroundImage: `url(${megaMenuImages[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '400px' }}></div> : <div style={{ flex: 1 }}></div>}
                     {megaMenuImages[1] ? <div style={{ flex: 1, backgroundColor: '#e5e5e5', backgroundImage: `url(${megaMenuImages[1]})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '400px' }}></div> : <div style={{ flex: 1 }}></div>}
                     {megaMenuImages[2] ? <div style={{ flex: 1, backgroundColor: '#d5d5d5', backgroundImage: `url(${megaMenuImages[2]})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '400px' }}></div> : <div style={{ flex: 1 }}></div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
