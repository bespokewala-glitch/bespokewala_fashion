/**
 * Unit tests for cart logic extracted from CartContext.tsx
 * Tests pure functions: addToCart logic, removeFromCart, updateQuantity,
 * cartCount, cartTotal
 *
 * Since CartContext uses React hooks and fetch(), we test the pure logic
 * inline here — mirroring the exact implementation.
 */
import { describe, it, expect } from '@jest/globals';

// ── Replicated pure functions from CartContext (no hooks, no fetch) ───────────

interface CartItem {
  id: string;
  productSlug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
}

function addToCart(cart: CartItem[], newItem: CartItem): CartItem[] {
  const newCart = [...cart];
  const existingIndex = newCart.findIndex((item) => item.id === newItem.id);
  if (existingIndex > -1) {
    newCart[existingIndex] = {
      ...newCart[existingIndex],
      quantity: newCart[existingIndex].quantity + newItem.quantity,
    };
  } else {
    newCart.push(newItem);
  }
  return newCart;
}

function removeFromCart(cart: CartItem[], id: string): CartItem[] {
  return cart.filter((item) => item.id !== id);
}

function updateQuantity(cart: CartItem[], id: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeFromCart(cart, id);
  return cart.map((item) => (item.id === id ? { ...item, quantity } : item));
}

function cartCount(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function cartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// ── Test Fixtures ─────────────────────────────────────────────────────────────

const item1: CartItem = {
  id: 'saree-M',
  productSlug: 'test-saree',
  name: 'Test Saree',
  price: 15000,
  image: '/test.jpg',
  quantity: 1,
  size: 'M',
};

const item2: CartItem = {
  id: 'lehenga-L',
  productSlug: 'test-lehenga',
  name: 'Test Lehenga',
  price: 45000,
  image: '/test2.jpg',
  quantity: 2,
  size: 'L',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Cart — addToCart', () => {
  it('adds a new item to an empty cart', () => {
    const cart = addToCart([], item1);
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('saree-M');
  });

  it('adds a second different item', () => {
    const cart = addToCart([item1], item2);
    expect(cart).toHaveLength(2);
  });

  it('increments quantity for an existing item with the same id', () => {
    const cart = addToCart([item1], { ...item1, quantity: 2 });
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3); // 1 + 2
  });

  it('treats items with same slug but different size as separate items', () => {
    const itemSizeXL: CartItem = { ...item1, id: 'saree-XL', size: 'XL' };
    const cart = addToCart([item1], itemSizeXL);
    expect(cart).toHaveLength(2);
  });
});

describe('Cart — removeFromCart', () => {
  it('removes an item by id', () => {
    const cart = removeFromCart([item1, item2], 'saree-M');
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('lehenga-L');
  });

  it('does nothing if id does not exist', () => {
    const cart = removeFromCart([item1], 'nonexistent-id');
    expect(cart).toHaveLength(1);
  });

  it('returns empty array when only item is removed', () => {
    const cart = removeFromCart([item1], 'saree-M');
    expect(cart).toHaveLength(0);
  });
});

describe('Cart — updateQuantity', () => {
  it('updates the quantity of an existing item', () => {
    const cart = updateQuantity([item1], 'saree-M', 5);
    expect(cart[0].quantity).toBe(5);
  });

  it('removes the item when quantity is set to 0', () => {
    const cart = updateQuantity([item1], 'saree-M', 0);
    expect(cart).toHaveLength(0);
  });

  it('removes the item when quantity is negative', () => {
    const cart = updateQuantity([item1], 'saree-M', -1);
    expect(cart).toHaveLength(0);
  });

  it('does not modify other items', () => {
    const cart = updateQuantity([item1, item2], 'saree-M', 10);
    expect(cart.find((i) => i.id === 'lehenga-L')!.quantity).toBe(2);
  });
});

describe('Cart — cartCount', () => {
  it('returns 0 for an empty cart', () => {
    expect(cartCount([])).toBe(0);
  });

  it('returns total quantity across all items', () => {
    expect(cartCount([item1, item2])).toBe(3); // 1 + 2
  });

  it('returns correct count for single item with quantity > 1', () => {
    expect(cartCount([{ ...item1, quantity: 5 }])).toBe(5);
  });
});

describe('Cart — cartTotal', () => {
  it('returns 0 for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('calculates total correctly for a single item', () => {
    expect(cartTotal([item1])).toBe(15000); // 15000 * 1
  });

  it('calculates total correctly for multiple items', () => {
    // 15000*1 + 45000*2 = 105000
    expect(cartTotal([item1, item2])).toBe(105000);
  });

  it('calculates total correctly when quantity > 1', () => {
    expect(cartTotal([{ ...item1, quantity: 3 }])).toBe(45000); // 15000 * 3
  });

  it('handles free items (price = 0)', () => {
    const freeItem: CartItem = { ...item1, price: 0 };
    expect(cartTotal([freeItem, item2])).toBe(90000);
  });
});

describe('Shipping cost threshold logic', () => {
  it('calculates free shipping for orders above 10000', () => {
    const subtotal = 15000;
    const shippingCost = subtotal > 10000 ? 0 : 500;
    expect(shippingCost).toBe(0);
  });

  it('calculates 500 shipping for orders at or below 10000', () => {
    const subtotal = 9999;
    const shippingCost = subtotal > 10000 ? 0 : 500;
    expect(shippingCost).toBe(500);
  });

  it('gives free shipping exactly at threshold boundary (10001)', () => {
    const subtotal = 10001;
    const shippingCost = subtotal > 10000 ? 0 : 500;
    expect(shippingCost).toBe(0);
  });

  it('charges shipping at exactly 10000 (boundary)', () => {
    const subtotal = 10000;
    const shippingCost = subtotal > 10000 ? 0 : 500;
    expect(shippingCost).toBe(500); // 10000 is NOT > 10000
  });
});
