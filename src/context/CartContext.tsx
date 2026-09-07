"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string; // generate a unique id like productSlug + size
  productSlug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  resetCartState: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);

  // Sync cart to backend
  const syncCartToBackend = async (currentCart: CartItem[]) => {
    if (!isAuthenticated) return;
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: currentCart })
      });
    } catch (e) {
      console.error('Failed to sync cart to backend', e);
    }
  };

  // Load cart on mount
  useEffect(() => {
    const initCart = async () => {
      // Safely clear the old global cart
      localStorage.removeItem('cart');

      try {
        const res = await fetch('/api/cart', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setCart(data.items || []);
          setIsAuthenticated(true);
        } else {
          // Guest user, 401 Unauthorized
          setIsAuthenticated(false);
          const savedCart = localStorage.getItem('bw_guest_cart');
          if (savedCart) {
            setCart(JSON.parse(savedCart));
          }
        }
      } catch (e) {
        console.error('Failed to fetch cart', e);
      } finally {
        setIsLoaded(true);
      }
    };
    initCart();
  }, []);

  // Save guest cart to local storage on change
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      localStorage.setItem('bw_guest_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded, isAuthenticated]);

  const addToCart = (newItem: CartItem) => {
    const newCart = [...cart];
    const existingItemIndex = newCart.findIndex(item => item.id === newItem.id);
    if (existingItemIndex > -1) {
      newCart[existingItemIndex].quantity += newItem.quantity;
    } else {
      newCart.push(newItem);
    }
    setCart(newCart);
    if (isAuthenticated) syncCartToBackend(newCart);
  };

  const removeFromCart = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    if (isAuthenticated) syncCartToBackend(newCart);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const newCart = cart.map(item => item.id === id ? { ...item, quantity } : item);
    setCart(newCart);
    if (isAuthenticated) syncCartToBackend(newCart);
  };

  const clearCart = () => {
    setCart([]);
    if (isAuthenticated) {
      fetch('/api/cart', { method: 'DELETE' }).catch(console.error);
    } else {
      localStorage.removeItem('bw_guest_cart');
    }
  };

  const resetCartState = () => {
    setCart([]);
    setIsAuthenticated(false);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal,
      isMiniCartOpen, openMiniCart, closeMiniCart, resetCartState
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context as CartContextType & { resetCartState: () => void };
};
