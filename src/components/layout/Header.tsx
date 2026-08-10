"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Menu, X, Search, ShoppingBag, User } from 'lucide-react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const [expandedMobileSubMenu, setExpandedMobileSubMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [megaMenuImages, setMegaMenuImages] = useState<string[]>(['', '', '']);
  const [user, setUser] = useState<{ name: string, role: string } | null>(null);
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    const controller = new AbortController();
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
        const res = await fetch('/api/taxonomies?enabled=true', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setTaxonomies(data);
          sessionStorage.setItem('header_taxonomies', JSON.stringify({ ts: Date.now(), data }));
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('Failed to fetch taxonomies in header');
        }
      }
    };
    fetchTaxonomies();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // Retry once on transient failure (e.g. dev server still starting up)
    const fetchMe = async (attempt = 0) => {
      try {
        const res = await fetch('/api/auth/me', { signal: controller.signal });
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        if (attempt === 0) {
          setTimeout(() => fetchMe(1), 1000);
        }
      }
    };
    fetchMe();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (hoveredNav && hoveredCategory) {
      const controller = new AbortController();
      // Debounce menu-image fetch to 200ms — avoids firing on accidental mouse-overs
      const timer = setTimeout(() => {
        fetch(`/api/menu-images?productType=${hoveredNav}&category=${hoveredCategory}`, { signal: controller.signal })
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0 && data[0].images) {
              const fetched = data[0].images;
              setMegaMenuImages([fetched[0] || '', fetched[1] || '', fetched[2] || '']);
            } else {
              setMegaMenuImages(['', '', '']);
            }
          })
          .catch((e: any) => { if (e?.name !== 'AbortError') console.error(e); });
      }, 200);
      return () => { clearTimeout(timer); controller.abort(); };
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
        @media (max-width: 1023px) {
          .mobile-logo-img { filter: none !important; }
        }
      `}</style>
      <header style={headerStyle} className="mobile-header-sticky">
        {/* Mobile Top Category Nav (Level 1) */}
        <div className="desktop-hide mobile-top-nav">
          <Link href="/" className={`mobile-nav-link ${pathname === '/' || pathname.includes('/couture') ? 'active' : ''}`}>COUTURE</Link>
          <Link href="/products/jewellery" className={`mobile-nav-link ${pathname.includes('/jewellery') ? 'active' : ''}`}>JEWELLERY</Link>
          <Link href="/products/accessories" className={`mobile-nav-link ${pathname.includes('/accessories') ? 'active' : ''}`}>ACCESSORIES</Link>
        </div>

        <div style={navContainer} className="mobile-main-header">

          {/* Mobile Hamburger Menu */}
          <div className="desktop-hide" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setIsMobileMenuOpen(true)} className="touch-target" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
              <Menu size={24} />
            </button>
          </div>

          {/* Desktop Left Nav */}
          <nav className="mobile-hide" style={{ flex: 1 }}>
            <ul style={menuStyle} onMouseLeave={handleMouseLeaveMenu}>
              <li onMouseEnter={() => handleMouseEnterMenu('couture')}>
                <Link prefetch={false} href="/" style={{ padding: '1rem 0', display: 'inline-block' }} className="menu-link-hover">Couture</Link>
              </li>
              <li onMouseEnter={() => handleMouseEnterMenu('accessories')}><Link prefetch={false} href="/products/accessories" style={{ padding: '1rem 0' }}>Accessories</Link></li>
              <li onMouseEnter={() => handleMouseEnterMenu('jewellery')}><Link prefetch={false} href="/products/jewellery" style={{ padding: '1rem 0' }}>Jewellery</Link></li>
            </ul>
          </nav>

          {/* Logo */}
          <div style={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src="/bespoken-transparent.png"
                alt="Bespokewala"
                className="mobile-logo-img"
                style={{
                  height: '64px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  background: 'transparent',
                  filter: isLightHeader ? 'none' : 'brightness(0) invert(1)'
                }}
              />
            </Link>
          </div>

          {/* Mobile Right Icons */}
          <div className="desktop-hide mobile-icon-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Link href="/search" className="touch-target"><Search size={20} /></Link>
            <Link href="/account" className="touch-target"><User size={20} /></Link>
            <Link href="/cart" className="touch-target" style={{ position: 'relative' }}>
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#000', color: '#fff', fontSize: '10px', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Right Nav */}
          <nav className="mobile-hide" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
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

        {/* Mobile Menu Drawer */}
        <div className={`mobile-menu-overlay desktop-hide ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`mobile-menu-drawer desktop-hide ${isMobileMenuOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
            <span style={{ fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000' }}>Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="touch-target" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#000' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#333' }}>

            {/* Couture Accordion */}
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', minHeight: '44px' }}
                onClick={() => { setExpandedMobileMenu(expandedMobileMenu === 'couture' ? null : 'couture'); setExpandedMobileSubMenu(null); }}
              >
                <span>Couture</span>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{expandedMobileMenu === 'couture' ? '-' : '+'}</span>
              </div>
              {expandedMobileMenu === 'couture' && (
                <div style={{ padding: '0.5rem 0 0 1rem', display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                  {menuData.couture.map(item => {
                    const colls = taxonomies.filter((t: any) => t.type === 'collection' && (!t.productTypes?.length || t.productTypes.includes('couture')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const occs = taxonomies.filter((t: any) => t.type === 'occasion' && (!t.productTypes?.length || t.productTypes.includes('couture')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const cats = taxonomies.filter((t: any) => t.type === 'category' && (!t.productTypes?.length || t.productTypes.includes('couture')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const hasTax = colls.length > 0 || occs.length > 0 || cats.length > 0;
                    const subKey = `couture-${item.id}`;
                    const isSubOpen = expandedMobileSubMenu === subKey;
                    return (
                      <div key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '44px', paddingRight: '0.25rem' }}>
                          <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ flex: 1, padding: '0.5rem 0' }}>{item.label}</Link>
                          {hasTax && (
                            <button onClick={() => setExpandedMobileSubMenu(isSubOpen ? null : subKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', fontSize: '1.1rem', padding: '0.5rem', lineHeight: 1, minWidth: '32px' }}>
                              {isSubOpen ? '−' : '›'}
                            </button>
                          )}
                        </div>
                        {isSubOpen && (
                          <div style={{ paddingLeft: '0.75rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[{ label: 'COLLECTIONS', items: colls }, { label: 'OCCASION', items: occs }, { label: 'CATEGORIES', items: cats }]
                              .filter(g => g.items.length > 0)
                              .map(group => (
                                <div key={group.label}>
                                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>{group.label}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {group.items.map((tx: any) => (
                                      <Link key={tx._id} href={`/products/couture/${item.id}/${tx.slug}`} onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.04em' }}>{tx.name}</Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', minHeight: '44px' }}>View All Couture</Link>
                </div>
              )}
            </div>

            {/* Accessories Accordion */}
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', minHeight: '44px' }}
                onClick={() => { setExpandedMobileMenu(expandedMobileMenu === 'accessories' ? null : 'accessories'); setExpandedMobileSubMenu(null); }}
              >
                <span>Accessories</span>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{expandedMobileMenu === 'accessories' ? '-' : '+'}</span>
              </div>
              {expandedMobileMenu === 'accessories' && (
                <div style={{ padding: '0.5rem 0 0 1rem', display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                  {menuData.accessories.map(item => {
                    const colls = taxonomies.filter((t: any) => t.type === 'collection' && (!t.productTypes?.length || t.productTypes.includes('accessories')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const occs = taxonomies.filter((t: any) => t.type === 'occasion' && (!t.productTypes?.length || t.productTypes.includes('accessories')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const cats = taxonomies.filter((t: any) => t.type === 'category' && (!t.productTypes?.length || t.productTypes.includes('accessories')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const hasTax = colls.length > 0 || occs.length > 0 || cats.length > 0;
                    const subKey = `accessories-${item.id}`;
                    const isSubOpen = expandedMobileSubMenu === subKey;
                    return (
                      <div key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '44px', paddingRight: '0.25rem' }}>
                          <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ flex: 1, padding: '0.5rem 0' }}>{item.label}</Link>
                          {hasTax && (
                            <button onClick={() => setExpandedMobileSubMenu(isSubOpen ? null : subKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', fontSize: '1.1rem', padding: '0.5rem', lineHeight: 1, minWidth: '32px' }}>
                              {isSubOpen ? '−' : '›'}
                            </button>
                          )}
                        </div>
                        {isSubOpen && (
                          <div style={{ paddingLeft: '0.75rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[{ label: 'COLLECTIONS', items: colls }, { label: 'OCCASION', items: occs }, { label: 'CATEGORIES', items: cats }]
                              .filter(g => g.items.length > 0)
                              .map(group => (
                                <div key={group.label}>
                                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>{group.label}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {group.items.map((tx: any) => (
                                      <Link key={tx._id} href={`/products/accessories/${item.id}/${tx.slug}`} onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.04em' }}>{tx.name}</Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Link href="/products/accessories" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', minHeight: '44px' }}>View All Accessories</Link>
                </div>
              )}
            </div>

            {/* Jewellery Accordion */}
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', minHeight: '44px' }}
                onClick={() => { setExpandedMobileMenu(expandedMobileMenu === 'jewellery' ? null : 'jewellery'); setExpandedMobileSubMenu(null); }}
              >
                <span>Jewellery</span>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{expandedMobileMenu === 'jewellery' ? '-' : '+'}</span>
              </div>
              {expandedMobileMenu === 'jewellery' && (
                <div style={{ padding: '0.5rem 0 0 1rem', display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                  {menuData.jewellery.map(item => {
                    const colls = taxonomies.filter((t: any) => t.type === 'collection' && (!t.productTypes?.length || t.productTypes.includes('jewellery')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const occs = taxonomies.filter((t: any) => t.type === 'occasion' && (!t.productTypes?.length || t.productTypes.includes('jewellery')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const cats = taxonomies.filter((t: any) => t.type === 'category' && (!t.productTypes?.length || t.productTypes.includes('jewellery')) && (!t.genders?.length || t.genders.includes(item.id)));
                    const hasTax = colls.length > 0 || occs.length > 0 || cats.length > 0;
                    const subKey = `jewellery-${item.id}`;
                    const isSubOpen = expandedMobileSubMenu === subKey;
                    return (
                      <div key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '44px', paddingRight: '0.25rem' }}>
                          <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ flex: 1, padding: '0.5rem 0' }}>{item.label}</Link>
                          {hasTax && (
                            <button onClick={() => setExpandedMobileSubMenu(isSubOpen ? null : subKey)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', fontSize: '1.1rem', padding: '0.5rem', lineHeight: 1, minWidth: '32px' }}>
                              {isSubOpen ? '−' : '›'}
                            </button>
                          )}
                        </div>
                        {isSubOpen && (
                          <div style={{ paddingLeft: '0.75rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[{ label: 'COLLECTIONS', items: colls }, { label: 'OCCASION', items: occs }, { label: 'CATEGORIES', items: cats }]
                              .filter(g => g.items.length > 0)
                              .map(group => (
                                <div key={group.label}>
                                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>{group.label}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {group.items.map((tx: any) => (
                                      <Link key={tx._id} href={`/products/jewellery/${item.id}/${tx.slug}`} onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.04em' }}>{tx.name}</Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Link href="/products/jewellery" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', minHeight: '44px' }}>View All Jewellery</Link>
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
            {user ? (
              <>
                <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>My Account</Link>
                {user.role === 'admin' && <Link href="/dashboard/campaigns" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>}
                <a href="#" onClick={(e) => { setIsMobileMenuOpen(false); handleLogout(e); }}>Logout</a>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login / Register</Link>
            )}
            <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>Wishlist ({wishlistCount})</Link>
          </div>
        </div>
      </header>
    </>
  );
}
