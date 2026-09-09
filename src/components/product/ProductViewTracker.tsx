"use client";

import React, { useEffect } from 'react';
import { event as fbEvent } from '@/components/MetaPixel';

interface ProductViewTrackerProps {
  product: {
    _id?: string;
    slug: string;
    name: string;
    price: number;
    category?: string;
    productType?: string;
  };
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
  useEffect(() => {
    // We only want this to fire once per product mount
    if (product) {
      fbEvent('ViewContent', {
        content_ids: [product.slug],
        content_name: product.name,
        content_type: 'product',
        content_category: product.category || product.productType || '',
        value: product.price,
        currency: 'INR'
      });
    }
  }, [product]);

  return null;
}
