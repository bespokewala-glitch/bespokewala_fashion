import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/layout/Header';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock contexts
jest.mock('@/context/CartContext', () => ({
  useCart: () => ({
    cartCount: 2,
    openMiniCart: jest.fn(),
    resetCartState: jest.fn(),
    cartItems: [],
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    isMiniCartOpen: false,
    closeMiniCart: jest.fn(),
  }),
}));

jest.mock('@/context/WishlistContext', () => ({
  useWishlist: () => ({
    wishlistCount: 3,
    wishlistItems: [],
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
    isInWishlist: jest.fn(),
  }),
}));

// Mock API calls inside Header
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('Header Component', () => {

  it('renders Header with cart and wishlist count', () => {
    render(<Header />);

    // Ensure the counts are rendered in the DOM
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });
});
