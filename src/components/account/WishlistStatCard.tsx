"use client";

import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistStatCard() {
  const { wishlistCount } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid #eaeaea',
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'relative',
    overflow: 'hidden'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 300,
    color: '#000',
    lineHeight: 1
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#888',
    fontWeight: 500
  };

  return (
    <div style={statCardStyle} className="luxury-card account-stat-card">
      <Heart size={22} color="#D4AF37" strokeWidth={1.5} />
      <div style={statValueStyle}>{mounted ? wishlistCount : '-'}</div>
      <div style={statLabelStyle}>Wishlist Items</div>
    </div>
  );
}
