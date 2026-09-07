"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

const ALL_SUGGESTIONS = [
  'lehenga', 'bridal lehenga', 'red bridal lehenga', 'designer lehenga', 'wedding lehenga', 'lehenga set', 'lehengas',
  'saree', 'designer saree', 'silk saree', 'wedding saree', 'red saree',
  'kurta set', 'mens kurta', 'sherwani', 'wedding sherwani',
  'jewellery', 'bridal jewellery', 'necklace',
  'footwear', 'bridal shoes', 'mens footwear'
];

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close overlay on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname, searchParams]);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQ = query.toLowerCase();
    return ALL_SUGGESTIONS.filter(s => s.toLowerCase().includes(lowerQ)).slice(0, 6);
  }, [query]);

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? <b key={i} style={{ fontWeight: 500, color: '#000' }}>{part}</b> : <span key={i} style={{ color: '#666' }}>{part}</span>
        )}
      </span>
    );
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="search-backdrop" onClick={onClose} />
      <div className="search-overlay">
        <div className="search-overlay-header">
          <div className="search-input-container">
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search for couture, lehenga, jewellery, footwear..."
              value={query}
              onChange={handleInput}
            />
            {query.trim() ? (
              <button className="clear-search-btn" onClick={() => setQuery('')}>
                <X size={20} />
              </button>
            ) : (
              <Search size={24} className="search-icon" style={{ marginLeft: '1rem' }} />
            )}
          </div>
          <button className="close-overlay-btn" onClick={onClose}>
            <X size={32} strokeWidth={1} />
          </button>
        </div>

        <div className="search-overlay-content">
          {!query.trim() ? (
            <div className="popular-search-wrapper">
              <h3>Popular Search</h3>
              <div className="popular-search-links">
                <Link href="/products/couture?q=Lehenga" onClick={onClose}>Lehengas</Link>
                <Link href="/products/couture?q=Saree" onClick={onClose}>Sarees</Link>
                <Link href="/products/couture?q=Kurta" onClick={onClose}>Kurta Sets</Link>
                <Link href="/products/couture?q=Sherwani" onClick={onClose}>Sherwani Sets</Link>
                <Link href="/products/jewellery" onClick={onClose}>Jewellery</Link>
                <Link href="/products/footwear" onClick={onClose}>Footwear</Link>
                <Link href="/products/couture?collectionName=Bridal+Collection" onClick={onClose}>Bridal Collection</Link>
              </div>
            </div>
          ) : (
            <div className="predictive-search-layout">

              {/* Left Column: Suggestions */}
              <div className="predictive-suggestions">
                <h3 style={{ fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Search Suggestions</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {suggestions.map((s, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => { setQuery(s); fetchResults(s); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '1.1rem', textAlign: 'left', fontFamily: 'inherit' }}
                      >
                        {highlightMatch(s, query)}
                      </button>
                    </li>
                  ))}
                  {suggestions.length === 0 && !loading && (
                    <li style={{ color: '#999', fontSize: '1rem' }}>No suggestions found</li>
                  )}
                </ul>
              </div>

              {/* Right Column: Products */}
              <div className="predictive-results">
                <h3 style={{ fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  Products
                  {results.length > 0 && (
                    <Link href={`/products?q=${encodeURIComponent(query)}`} onClick={onClose} style={{ color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View All <ArrowRight size={14} />
                    </Link>
                  )}
                </h3>

                {loading ? (
                  <div style={{ padding: '2rem 0', color: '#999' }}>Loading results...</div>
                ) : results.length > 0 ? (
                  <div className="search-results-grid">
                    {results.map((product) => (
                      <Link href={`/products/${product.slug}`} key={product._id} className="search-result-card" onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="result-image-container" style={{ aspectRatio: '3/4', position: 'relative', background: '#f5f5f5', marginBottom: '1rem', overflow: 'hidden' }}>
                          {product.images && product.images[0] ? (
                            <OptimizedImage
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%' }} />
                          )}
                        </div>
                        <div className="result-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 400, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>₹{product.price.toLocaleString('en-IN')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 300, marginBottom: '0.5rem' }}>No pieces found for "{query}"</p>
                    <p style={{ color: '#666', fontSize: '1rem', marginBottom: '2rem' }}>Explore our curated collections instead.</p>
                    <div className="popular-search-links">
                      <Link href="/products/couture" onClick={onClose}>Couture</Link>
                      <Link href="/products/jewellery" onClick={onClose}>Jewellery</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
