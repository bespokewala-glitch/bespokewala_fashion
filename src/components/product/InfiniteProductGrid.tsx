"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '@/components/product/ProductCard';

interface InfiniteProductGridProps {
  initialProducts: any[];
  totalProducts: number;
  queryParams: Record<string, string | undefined>;
}

export default function InfiniteProductGrid({ initialProducts, totalProducts, queryParams }: InfiniteProductGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts);
  const observerTarget = useRef<HTMLDivElement>(null);

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
      <div className="product-grid" style={{ marginTop: 0 }}>
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
