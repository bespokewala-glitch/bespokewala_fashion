"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

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

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch search results', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="search-overlay">
      <div className="search-overlay-header">
        <div className="search-input-container">
          <Search size={24} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search couture, jewellery, footwear..."
            value={query}
            onChange={handleInputChange}
            className="search-input"
          />
          {query && (
            <button className="clear-search-btn" onClick={() => setQuery('')}>
              <X size={20} />
            </button>
          )}
        </div>
        <button className="close-overlay-btn" onClick={onClose}>
          <X size={28} strokeWidth={1.5} />
        </button>
      </div>

      <div className="search-overlay-content">
        {!query.trim() ? (
          <div className="pre-search-state">
            <div className="search-section">
              <h3>Trending Searches</h3>
              <ul className="search-list">
                <li><Link href="/products/couture?q=Bridal+Lehenga" onClick={onClose}>Bridal Lehenga</Link></li>
                <li><Link href="/products/couture?q=Designer+Saree" onClick={onClose}>Designer Saree</Link></li>
                <li><Link href="/products/couture?q=Wedding+Sherwani" onClick={onClose}>Wedding Sherwani</Link></li>
                <li><Link href="/products/jewellery?q=Statement+Jewellery" onClick={onClose}>Statement Jewellery</Link></li>
                <li><Link href="/products/footwear?q=Luxury+Footwear" onClick={onClose}>Luxury Footwear</Link></li>
              </ul>
            </div>
            
            <div className="search-section">
              <h3>Categories</h3>
              <div className="category-cards">
                <Link href="/products/couture" className="category-card" onClick={onClose}>Couture</Link>
                <Link href="/products/jewellery" className="category-card" onClick={onClose}>Jewellery</Link>
                <Link href="/products/footwear" className="category-card" onClick={onClose}>Footwear</Link>
                <Link href="/products/couture?collectionName=Bridal+Collection" className="category-card" onClick={onClose}>Bridal Collection</Link>
                <Link href="/products/couture?collectionName=Groom+Collection" className="category-card" onClick={onClose}>Groom Collection</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="search-results-state">
            {loading ? (
              <div className="loading-state">Searching...</div>
            ) : results.length > 0 ? (
              <div className="search-results-grid">
                {results.map((product) => (
                  <Link href={`/product/${product.slug}`} key={product._id} className="search-result-card" onClick={onClose}>
                    <div className="result-image-container">
                      {product.images && product.images[0] ? (
                         <OptimizedImage
                           src={product.images[0]}
                           alt={product.name}
                           fill
                           sizes="(max-width: 768px) 50vw, 25vw"
                           style={{ objectFit: 'cover' }}
                         />
                      ) : (
                        <div className="placeholder-image" />
                      )}
                      {product.isFeatured && <span className="result-badge">Exclusive</span>}
                    </div>
                    <div className="result-info">
                      <h4 className="result-name">{product.name}</h4>
                      <p className="result-category">{product.category}</p>
                      <p className="result-price">₹{product.price.toLocaleString('en-IN')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-results-state">
                <p>No results found for "{query}"</p>
                <button onClick={() => setQuery('')} className="clear-search-link">Clear search</button>
              </div>
            )}
            
            {results.length > 0 && (
              <div className="view-all-results">
                <Link href={`/products?q=${encodeURIComponent(query)}`} className="view-all-btn" onClick={onClose}>
                  View All Results
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
