'use client';

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';

export default function ProductPriceDisplay({ price }: { price: number }) {
  const { formatPrice } = useCurrency();

  return (
    <div>
      <div style={{ fontSize: '1.15rem', fontWeight: 500, color: '#000', marginTop: '0.25rem' }}>
        MRP: {formatPrice(price)}
      </div>
      <div style={{ fontSize: '0.825rem', color: '#888', marginTop: '0.15rem' }}>
        Price inclusive of all taxes
      </div>
    </div>
  );
}
