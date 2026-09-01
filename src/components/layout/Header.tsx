"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { normalizeImageUrl, shouldBypassOptimizer } from '@/lib/imageUrl';
import { Menu, X, ShoppingBag, User, Heart, Search } from 'lucide-react';
import CurrencySelector from '@/components/layout/CurrencySelector';
import SearchOverlay from '@/components/layout/SearchOverlay';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const [expandedMobileSubMenu, setExpandedMobileSubMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Lock body scroll when mobile drawer is open (prevents iOS bounce bleed)
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('body-drawer-open');
    } else {
      document.body.classList.remove('body-drawer-open');
    }
    return () => {
      document.body.classList.remove('body-drawer-open');
    };
  }, [isMobileMenuOpen]);
  const isHomePage = pathname === '/';
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [displayNav, setDisplayNav] = useState<string | null>(null);

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [displayCategory, setDisplayCategory] = useState<string | null>(null);

  useEffect(() => {
    if (hoveredNav) setDisplayNav(hoveredNav);
    if (hoveredCategory) setDisplayCategory(hoveredCategory);
  }, [hoveredNav, hoveredCategory]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [megaMenuImages, setMegaMenuImages] = useState<string[]>(['', '', '']);
  const [user, setUser] = useState<{ name: string, role: string } | null>(null);
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const { cartCount, openMiniCart } = useCart();
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
            // Cache taxonomies for 10 minutes — they rarely change and
            // re-fetching on every navigation adds ~500ms of latency
            if (parsed.ts && Date.now() - parsed.ts < 600_000) {
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

    // Cache auth state in sessionStorage to avoid re-fetching on every navigation.
    // - Authenticated user: cached for 5 minutes (300s)
    // - Unauthenticated (401): cached for 60s so anonymous browsing doesn't hammer the API
    const AUTH_CACHE_KEY = 'bw_auth_me';
    const AUTH_TTL_AUTH = 300_000;   // 5 min for logged-in users
    const AUTH_TTL_ANON = 60_000;    // 60 s for anonymous (avoids repeated 401s)

    const fetchMe = async (attempt = 0) => {
      try {
        // Check sessionStorage cache first
        const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const ttl = parsed.user ? AUTH_TTL_AUTH : AUTH_TTL_ANON;
          if (Date.now() - parsed.ts < ttl) {
            if (parsed.user) setUser(parsed.user);
            return; // Serve from cache — no network request
          }
        }
      } catch { /* ignore parse errors */ }

      try {
        const res = await fetch('/api/auth/me', { signal: controller.signal });
        const data = await res.json();
        // Cache both authenticated and unauthenticated results
        try {
          sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user: data.user || null, ts: Date.now() }));
        } catch { /* ignore storage errors */ }
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
      const cacheKey = `menu-images-${hoveredNav}-${hoveredCategory}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Date.now() - parsed.ts < 600_000) {
             setMegaMenuImages(parsed.images);
             return;
          }
        } catch { /* ignore parse errors */ }
      }

      const controller = new AbortController();
      // Debounce menu-image fetch to 200ms — avoids firing on accidental mouse-overs
      const timer = setTimeout(() => {
        fetch(`/api/menu-images?productType=${hoveredNav}&category=${hoveredCategory}`, { signal: controller.signal })
          .then(res => res.json())
          .then(data => {
            let newImages = ['', '', ''];
            if (data && data.length > 0 && data[0].images) {
              const fetched = data[0].images;
              newImages = [
                normalizeImageUrl(fetched[0] || ''),
                normalizeImageUrl(fetched[1] || ''),
                normalizeImageUrl(fetched[2] || ''),
              ];
            }
            setMegaMenuImages(newImages);
            sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), images: newImages }));
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

    if (hoveredNav && hoveredNav !== navId) {
      enterTimeoutRef.current = setTimeout(() => {
        setHoveredNav(navId);
        setHoveredCategory(null);
      }, 150); // Faster switch delay to prevent diagonal hover issue but feel responsive
    } else {
      setHoveredNav(navId);
    }
  };

  const handleMouseLeaveMenu = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredNav(null);
      setHoveredCategory(null);
    }, 300); // 300ms closing delay to prevent flickering
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
    }, 300);
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

  const isLightHeader = Boolean(isScrolled || !isHomePage || hoveredNav);

  const navContainer: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4rem',
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
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'center',
    padding: '0',
    opacity: hoveredNav ? 1 : 0,
    visibility: hoveredNav ? 'visible' : 'hidden',
    transform: hoveredNav ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'opacity 0.25s ease, visibility 0.25s ease, transform 0.25s ease',
    pointerEvents: hoveredNav ? 'auto' : 'none',
  };

  const menuData: Record<string, { id: string; label: string; href: string; children?: { label: string; href: string }[] }[]> = {
    couture: [
      { id: 'new-arrivals', label: 'New Arrivals', href: '/products/couture/new-arrivals' },
      { id: 'womens', label: 'Women', href: '/products/couture/womens' },
      { id: 'mens', label: 'Men', href: '/products/couture/mens' },
    ],
    footwear: [
      { id: 'womens', label: 'Women', href: '/products/footwear/womens' },
      { id: 'mens', label: 'Men', href: '/products/footwear/mens' },
    ],
    jewellery: [
      { id: 'new-arrivals', label: 'New Arrivals', href: '/products/jewellery/new-arrivals' },
      { id: 'signature-collection', label: 'Signature Collection', href: '/products/jewellery/signature-collection' },
      { id: 'diamond-collection', label: 'Diamond Collection', href: '/products/jewellery/diamond-collection' },
      { id: 'menswear-collection', label: 'Menswear Collection', href: '/products/jewellery/menswear-collection' },
    ],
  };

  const activeSecondaryNav = displayNav ? menuData[displayNav as string] || [] : [];

  const collections = taxonomies.filter(t => t.type === 'collection' && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(displayNav as string)) && (!t.genders || t.genders.length === 0 || t.genders.includes(displayCategory as string)));
  const occasions = taxonomies.filter(t => t.type === 'occasion' && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(displayNav as string)) && (!t.genders || t.genders.length === 0 || t.genders.includes(displayCategory as string)));
  const categories = taxonomies.filter(t => t.type === 'category' && (!t.productTypes || t.productTypes.length === 0 || t.productTypes.includes(displayNav as string)) && (!t.genders || t.genders.length === 0 || t.genders.includes(displayCategory as string)));

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
          .header-logo-img { filter: none !important; }
        }
      `}</style>
      <header style={headerStyle} className="mobile-header-sticky">
        {/* Mobile Top Category Bar (matches Manish Malhotra reference) */}
        <div className="mobile-top-bar desktop-hide" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #eeeeee',
          width: '100%',
          zIndex: 101
        }}>
          <Link href="/products/couture" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: '#000000', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 500 }}>Couture</Link>
          <Link href="/products/footwear" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: '#000000', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 500 }}>Footwear</Link>
          <Link href="/products/jewellery" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: '#000000', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 500 }}>Jewellery</Link>
        </div>

        <div style={navContainer} className="mobile-main-header">

          {/* Mobile Hamburger — left */}
          <div className="desktop-hide" style={{ flex: '0 0 44px', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="touch-target"
              aria-label="Open navigation menu"
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
            >
              <Menu size={22} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
            </button>
          </div>

          {/* Desktop Left Nav */}
          <nav className="mobile-hide" style={{ flex: 1 }}>
            <ul style={{ ...menuStyle, paddingBottom: '2rem', marginBottom: '-2rem' }} onMouseLeave={handleMouseLeaveMenu}>
              <li onMouseEnter={() => handleMouseEnterMenu('couture')}>
                <Link prefetch={true} href="/" style={{ padding: '1rem 0', display: 'inline-block' }} className="menu-link-hover">Couture</Link>
              </li>
              <li onMouseEnter={() => handleMouseEnterMenu('footwear')}>
                <Link prefetch={true} href="/products/footwear" style={{ padding: '1rem 0', display: 'inline-block' }}>Footwear</Link>
              </li>
              <li onMouseEnter={() => handleMouseEnterMenu('jewellery')}>
                <Link prefetch={true} href="/products/jewellery" style={{ padding: '1rem 0', display: 'inline-block' }}>Jewellery</Link>
              </li>
            </ul>
          </nav>

          {/* Logo — center, always explicitly sized */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/bespoken-transparent.png"
                alt="Bespokewala"
                className={`header-logo-img${isLightHeader ? '' : ' header-logo-inverted'}`}
                style={{
                  width: '60px',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0,
                  background: 'transparent',
                }}
              />
            </Link>
          </div>

          {/* Mobile Right Icons — right: Wishlist + Cart */}
          <div className="desktop-hide mobile-icon-right" style={{ flex: '0 0 96px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="touch-target"
              aria-label="Search"
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', marginRight: '4px' }}
            >
              <Search size={20} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
            </button>
            <Link
              href="/wishlist"
              className="touch-target"
              aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0', color: 'inherit' }}
            >
              <Heart size={20} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
              {wishlistCount > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '-4px', background: '#000', color: '#fff', fontSize: '9px', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                  {wishlistCount}
                </span>
              )}
            </Link>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); openMiniCart(); }}
              className="touch-target"
              aria-label={`Shopping bag${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0', color: 'inherit', textDecoration: 'none' }}
            >
              <ShoppingBag size={20} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '-4px', background: '#000', color: '#fff', fontSize: '9px', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                  {cartCount}
                </span>
              )}
            </a>
          </div>


          {/* Desktop Right Nav */}
          <nav className="mobile-hide" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <ul style={{ ...menuStyle, alignItems: 'center', gap: '1.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center' }}>
                <CurrencySelector isDarkHeader={isLightHeader} />
              </li>
              
              {/* Text Links */}
              {user && user.role === 'admin' && (
                <li><Link href="/dashboard/campaigns" style={{ fontWeight: 'bold' }}>Admin</Link></li>
              )}
              {user && (
                <li><a href="#" onClick={handleLogout} className="text-gray-500 hover:text-current transition-colors">Logout</a></li>
              )}

              {/* Icons */}
              <li>
                <button onClick={() => setIsSearchOpen(true)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} aria-label="Search">
                  <Search size={20} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
                </button>
              </li>
              <li>
                <Link href={user ? "/account" : "/login"} aria-label={user ? "Account" : "Login"} style={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                  <User size={20} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
                </Link>
              </li>
              <li>
                <Link href="/wishlist" aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0', color: 'inherit' }}>
                  <Heart size={20} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
                  {wishlistCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: isLightHeader ? '#000' : '#fff', color: isLightHeader ? '#fff' : '#000', fontSize: '9px', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); openMiniCart(); }} aria-label={`Shopping bag${cartCount > 0 ? ` (${cartCount} items)` : ''}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0', color: 'inherit', textDecoration: 'none' }}>
                  <ShoppingBag size={20} color={isLightHeader ? '#1c1c1c' : '#ffffff'} />
                  {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: isLightHeader ? '#000' : '#fff', color: isLightHeader ? '#fff' : '#000', fontSize: '9px', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {cartCount}
                    </span>
                  )}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Sub-navigation Menu (Departments) */}
        <div style={{ ...subNavContainer, minHeight: hoveredNav ? '50px' : '0' }} onMouseEnter={handleMouseEnterSubMenu} onMouseLeave={handleMouseLeaveSubMenu}>
          {/* Hover-safe bridge to connect gaps safely */}
          <div style={{ position: 'absolute', top: '-2rem', left: 0, width: '100%', height: '2rem', background: 'transparent' }}></div>

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
                <Link prefetch={true} href={item.href} onClick={() => { setHoveredNav(null); setHoveredCategory(null); }} className="menu-link-hover">
                  {item.label}
                </Link>

                {/* Jewellery now just uses the same Tertiary panel logic, remove dropdown */}
              </li>
            ))}
          </ul>

          {/* Tertiary Mega Menu Panel */}
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
            minHeight: '400px',
            opacity: hoveredCategory ? 1 : 0,
            visibility: hoveredCategory ? 'visible' : 'hidden',
            transform: hoveredCategory ? 'translateY(0)' : 'translateY(-5px)',
            transition: 'opacity 0.25s ease, visibility 0.25s ease, transform 0.25s ease',
            pointerEvents: hoveredCategory ? 'auto' : 'none',
          }}>
            <div style={{ display: 'flex', width: '100%', maxWidth: '1400px' }}>
              <div style={{ flex: 1, display: 'flex', gap: '3rem' }}>
                {/* 1. Collections */}
                {collections.length > 0 && (
                  <div style={{ width: '220px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Collections</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {collections.map(tax => (
                        <li key={tax._id}>
                          <Link
                            prefetch={true}
                            href={`/products/${displayNav}/${displayCategory}/${tax.slug}`}
                            onClick={() => { setHoveredNav(null); setHoveredCategory(null); }}
                            style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            className="sub-link-hover"
                          >
                            {tax.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Occasion */}
                {occasions.length > 0 && (
                  <div style={{ width: '220px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Occasion</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {occasions.map(tax => (
                        <li key={tax._id}>
                          <Link
                            prefetch={true}
                            href={`/products/${displayNav}/${displayCategory}/${tax.slug}`}
                            onClick={() => { setHoveredNav(null); setHoveredCategory(null); }}
                            style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            className="sub-link-hover"
                          >
                            {tax.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Categories */}
                {categories.length > 0 && (
                  <div style={{ width: '220px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Categories</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {categories.map(tax => (
                        <li key={tax._id}>
                          <Link
                            prefetch={true}
                            href={`/products/${displayNav}/${displayCategory}/${tax.slug}`}
                            onClick={() => { setHoveredNav(null); setHoveredCategory(null); }}
                            style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            className="sub-link-hover"
                          >
                            {tax.name}
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
                  {megaMenuImages[0] ? <div style={{ flex: 1, backgroundColor: '#f0f0f0', position: 'relative', minHeight: '400px' }}><OptimizedImage src={megaMenuImages[0]} fill style={{ objectFit: 'cover' }} alt="Category" sizes="33vw" variant="thumbnail" /></div> : <div style={{ flex: 1 }}></div>}
                  {megaMenuImages[1] ? <div style={{ flex: 1, backgroundColor: '#e5e5e5', position: 'relative', minHeight: '400px' }}><OptimizedImage src={megaMenuImages[1]} fill style={{ objectFit: 'cover' }} alt="Category" sizes="33vw" variant="thumbnail" /></div> : <div style={{ flex: 1 }}></div>}
                  {megaMenuImages[2] ? <div style={{ flex: 1, backgroundColor: '#d5d5d5', position: 'relative', minHeight: '400px' }}><OptimizedImage src={megaMenuImages[2]} fill style={{ objectFit: 'cover' }} alt="Category" sizes="33vw" variant="thumbnail" /></div> : <div style={{ flex: 1 }}></div>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div className={`mobile-menu-overlay desktop-hide ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`mobile-menu-drawer desktop-hide ${isMobileMenuOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
            <span style={{ fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000' }}>Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="touch-target"
              aria-label="Close navigation menu"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#000' }}
            >
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
                          {hasTax ? (
                            <div
                              onClick={() => setExpandedMobileSubMenu(isSubOpen ? null : subKey)}
                              style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', cursor: 'pointer', alignItems: 'center' }}
                            >
                              <span>{item.label}</span>
                              <span style={{ color: '#666', fontSize: '1.1rem', lineHeight: 1, minWidth: '32px', textAlign: 'right' }}>
                                {isSubOpen ? '−' : '›'}
                              </span>
                            </div>
                          ) : (
                            <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ flex: 1, padding: '0.5rem 0' }}>{item.label}</Link>
                          )}
                        </div>
                        {isSubOpen && (
                          <div style={{ paddingLeft: '0.75rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#000', paddingTop: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>VIEW ALL {item.label}</Link>
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

            {/* Footwear Accordion */}
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', minHeight: '44px' }}
                onClick={() => { setExpandedMobileMenu(expandedMobileMenu === 'footwear' ? null : 'footwear'); setExpandedMobileSubMenu(null); }}
              >
                <span>Footwear</span>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{expandedMobileMenu === 'footwear' ? '-' : '+'}</span>
              </div>
              {expandedMobileMenu === 'footwear' && (
                <div style={{ padding: '0.5rem 0 0 1rem', display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                  {menuData.footwear.map(item => (
                    <div key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '44px', paddingRight: '0.25rem' }}>
                        <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ flex: 1, padding: '0.5rem 0' }}>{item.label}</Link>
                      </div>
                    </div>
                  ))}
                  <Link href="/products/footwear" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', minHeight: '44px' }}>View All Footwear</Link>
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
                          {hasTax ? (
                            <div
                              onClick={() => setExpandedMobileSubMenu(isSubOpen ? null : subKey)}
                              style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', cursor: 'pointer', alignItems: 'center' }}
                            >
                              <span>{item.label}</span>
                              <span style={{ color: '#666', fontSize: '1.1rem', lineHeight: 1, minWidth: '32px', textAlign: 'right' }}>
                                {isSubOpen ? '−' : '›'}
                              </span>
                            </div>
                          ) : (
                            <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ flex: 1, padding: '0.5rem 0' }}>{item.label}</Link>
                          )}
                        </div>
                        {isSubOpen && (
                          <div style={{ paddingLeft: '0.75rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#000', paddingTop: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>VIEW ALL {item.label}</Link>
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
            <div style={{ paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency:</span>
              <CurrencySelector isDarkHeader={true} />
            </div>
          </div>
        </div>
      </header>
      <React.Suspense fallback={null}>
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </React.Suspense>
    </>
  );
}
