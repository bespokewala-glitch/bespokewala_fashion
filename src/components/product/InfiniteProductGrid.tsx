"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '@/components/product/ProductCard';

// Increment this whenever a data migration runs (e.g. bucket migration).
// This busts ALL browser sessionStorage caches so users don't see stale/duplicate products.
const CACHE_VERSION = 2;

interface InfiniteProductGridProps {
  initialProducts: any[];
  totalProducts: number;
  queryParams: Record<string, string | undefined>;
}

/** Remove duplicate products by _id, keeping the first occurrence */
function dedupeById(arr: any[]): any[] {
  const seen = new Set<string>();
  return arr.filter(p => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });
}

export default function InfiniteProductGrid({ initialProducts, totalProducts, queryParams }: InfiniteProductGridProps) {
  const cacheKey = typeof window !== 'undefined' ? `infinite_scroll_v${CACHE_VERSION}_${window.location.pathname}${window.location.search}` : '';

  // Deduplicate initial products from server to guard against DB-level duplicates
  const dedupedInitial = dedupeById(initialProducts);

  const [products, setProducts] = useState(dedupedInitial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(dedupedInitial.length < totalProducts);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Use isomorphic layout effect to restore state synchronously before paint if possible
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    try {
      if (!cacheKey) return;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only restore cache if:
        //  1. It has more products than the server-rendered first page (i.e. user had scrolled)
        //  2. The first product ID still matches the server data (same query/page)
        //  3. Cache version matches (prevents stale data after migrations)
        const firstIdMatch = parsed.products?.[0]?._id === dedupedInitial[0]?._id;
        const cacheHasMore = parsed.products?.length > dedupedInitial.length;
        const versionMatch = parsed.version === CACHE_VERSION;
        if (parsed.products && cacheHasMore && firstIdMatch && versionMatch) {
          // Deduplicate cached products too, in case of any corruption
          const dedupedCache = dedupeById(parsed.products);
          setProducts(dedupedCache);
          setPage(parsed.page);
          setHasMore(dedupedCache.length < totalProducts);
          if (parsed.scrollY) {
            // Wait for next tick to ensure DOM has updated
            requestAnimationFrame(() => {
              window.scrollTo(0, parsed.scrollY);
            });
            setTimeout(() => {
               window.scrollTo(0, parsed.scrollY);
            }, 100);
          }
        }
      }
    } catch (e) {}
  }, [cacheKey, dedupedInitial, totalProducts]);

  const handleGridClickCapture = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        products,
        page,
        scrollY: window.scrollY,
        version: CACHE_VERSION,
      }));
    }
  };

  const fetchMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const searchParams = new URLSearchParams();
      
      // Add existing query params
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      
      // Override pagination params
      searchParams.set('page', nextPage.toString());
      searchParams.set('limit', '24'); // Match the server's productsPerPage

      const response = await fetch(`/api/products?${searchParams.toString()}`);
      
      if (response.ok) {
        const newProducts = await response.json();
        
        if (newProducts.length === 0) {
          setHasMore(false);
        } else {
          // Prevent duplicates just in case
          const newUniqueProducts = newProducts.filter(
            (newProd: any) => !products.some(p => p._id === newProd._id)
          );
          
          setProducts(prev => [...prev, ...newUniqueProducts]);
          setPage(nextPage);
          
          if (products.length + newUniqueProducts.length >= totalProducts) {
            setHasMore(false);
          }
        }
      } else {
        console.error("Failed to load more products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, queryParams, products, totalProducts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [fetchMoreProducts, hasMore, loading]);

  return (
    <div style={{ width: '100%' }}>
      <div className="product-grid" style={{ marginTop: 0 }} onClickCapture={handleGridClickCapture}>
        {products.map((product, index) => (
          <ProductCard 
            key={`${product._id}-${index}`} 
            product={product} 
            priority={index < 4} 
          />
        ))}
      </div>
      
      {hasMore && (
        <div 
          ref={observerTarget} 
          style={{ 
            padding: '4rem 0', 
            textAlign: 'center',
            color: '#777',
            fontSize: '0.8rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {loading ? 'Loading more products...' : ''}
        </div>
      )}
    </div>
  );
}
