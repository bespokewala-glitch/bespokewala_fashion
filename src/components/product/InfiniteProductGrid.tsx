"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '@/components/product/ProductCard';

// Increment this whenever a data migration runs (e.g. bucket migration).
// This busts ALL browser sessionStorage caches so users don't see stale/duplicate products.
const CACHE_VERSION = 3;

interface InfiniteProductGridProps {
  initialProducts: any[];
  totalProducts: number;
  queryParams: Record<string, string | undefined>;
}

/** Remove duplicate products by _id, keeping the first occurrence */
function dedupeById(arr: any[]): any[] {
  const seen = new Set<string>();
  return arr.filter(p => {
    const id = p._id?.toString();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Build a stable string key from queryParams — used both as cache key suffix and cache validation */
function buildQueryHash(queryParams: Record<string, string | undefined>): string {
  // Sort keys for stability, exclude page (we track page separately in cache)
  return Object.keys(queryParams)
    .filter(k => k !== 'page' && queryParams[k] !== undefined && queryParams[k] !== '')
    .sort()
    .map(k => `${k}=${queryParams[k]}`)
    .join('&');
}

export default function InfiniteProductGrid({ initialProducts, totalProducts, queryParams }: InfiniteProductGridProps) {
  // queryHash uniquely identifies the current filter/sort/search combination.
  // Changing any filter resets this hash and invalidates any cached scroll state.
  const queryHash = buildQueryHash(queryParams);

  // Cache key encodes both the current URL path AND the full query fingerprint.
  // This guarantees a filter change always produces a new cache key,
  // so a stale scroll position from a different filter can never be restored.
  const cacheKey = typeof window !== 'undefined'
    ? `infinite_scroll_v${CACHE_VERSION}_${window.location.pathname}__${queryHash}`
    : '';

  // Deduplicate initial products from server to guard against DB-level duplicates
  const dedupedInitial = dedupeById(initialProducts);

  const [products, setProducts] = useState(dedupedInitial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(dedupedInitial.length < totalProducts);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Track the current queryHash so in-flight requests can detect stale results
  const currentQueryHashRef = useRef(queryHash);
  // AbortController ref so we can cancel in-flight fetches when the query changes
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use isomorphic layout effect to restore state synchronously before paint if possible
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : useEffect;

  // When queryParams change (filter/sort), reset everything and cancel any in-flight request.
  // This is the primary guard against race conditions.
  useEffect(() => {
    currentQueryHashRef.current = queryHash;
    // Cancel any in-flight request from the previous query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Reset state to the fresh server-rendered first page
    const fresh = dedupeById(initialProducts);
    setProducts(fresh);
    setPage(1);
    setHasMore(fresh.length < totalProducts);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryHash, totalProducts]);
  // NOTE: initialProducts intentionally omitted — when queryHash changes we already
  // reset to the fresh dedupedInitial above. Including it would cause a double-reset.

  useIsomorphicLayoutEffect(() => {
    try {
      if (!cacheKey) return;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache validation rules (all must pass):
        // 1. Cache version matches (prevents stale data after code deployments)
        // 2. Stored queryHash matches current queryHash (prevents cross-filter contamination)
        // 3. First product ID matches server data (same dataset)
        // 4. Cache has MORE products than the server's page 1 (user had actually scrolled)
        const versionMatch = parsed.version === CACHE_VERSION;
        const queryHashMatch = parsed.queryHash === queryHash;
        const firstIdMatch = parsed.products?.[0]?._id === dedupedInitial[0]?._id;
        const cacheHasMore = parsed.products?.length > dedupedInitial.length;

        if (parsed.products && versionMatch && queryHashMatch && cacheHasMore && firstIdMatch) {
          // Deduplicate cached products too, in case of any corruption
          const dedupedCache = dedupeById(parsed.products);
          setProducts(dedupedCache);
          setPage(parsed.page);
          setHasMore(dedupedCache.length < totalProducts);
          if (parsed.scrollY) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]); // Only run once per cache key; queryHash is encoded in cacheKey

  const handleGridClickCapture = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        products,
        page,
        scrollY: window.scrollY,
        version: CACHE_VERSION,
        queryHash, // store so we can validate on restore
      }));
    }
  };

  const fetchMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return;

    // Snapshot the query hash at the time this fetch starts.
    // If the query changes mid-flight, we'll detect it and discard the result.
    const fetchQueryHash = currentQueryHashRef.current;

    setLoading(true);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

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

      const response = await fetch(`/api/products?${searchParams.toString()}`, {
        signal: controller.signal,
      });

      // If the query changed while this request was in-flight, discard the result
      if (fetchQueryHash !== currentQueryHashRef.current) {
        return;
      }
      
      if (response.ok) {
        const newProducts = await response.json();

        // Double-check query hash hasn't changed during JSON parsing
        if (fetchQueryHash !== currentQueryHashRef.current) {
          return;
        }
        
        if (newProducts.length === 0) {
          setHasMore(false);
        } else {
          setProducts(prev => {
            // Use functional update to prevent stale-closure bug:
            // build the seen-ID set from the CURRENT state, not the closure value
            const existingIds = new Set(prev.map((p: any) => p._id?.toString()));
            const newUniqueProducts = newProducts.filter(
              (newProd: any) => newProd._id && !existingIds.has(newProd._id.toString())
            );
            const merged = [...prev, ...newUniqueProducts];
            // Update hasMore based on final merged length
            if (merged.length >= totalProducts) {
              setHasMore(false);
            }
            return merged;
          });
          setPage(nextPage);
        }
      } else {
        console.error("Failed to load more products");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Expected — query changed before this request completed
        return;
      }
      console.error("Error loading products:", error);
    } finally {
      // Only clear loading if this fetch is still the current one
      if (fetchQueryHash === currentQueryHashRef.current) {
        setLoading(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [page, loading, hasMore, queryParams, totalProducts]);

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
        {products.map((product, idx) => (
          <ProductCard 
            // Use ONLY _id as the React key — no index tiebreaker.
            // Adding an index suffix means React can't detect when the same
            // product appears at two different positions in the list.
            key={product._id}
            product={product} 
            priority={idx < 4} 
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
