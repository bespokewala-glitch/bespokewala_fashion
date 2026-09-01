"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WishlistItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  productType?: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (slug: string) => void;
  clearWishlist: () => void;
  isInWishlist: (slug: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse wishlist from local storage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded]);

  const addToWishlist = (newItem: WishlistItem) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.slug === newItem.slug);
      if (exists) return prev;
      return [...prev, newItem];
    });
  };

  const removeFromWishlist = (slug: string) => {
    setWishlist(prev => prev.filter(item => item.slug !== slug));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const isInWishlist = (slug: string) => {
    return wishlist.some(item => item.slug === slug);
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
