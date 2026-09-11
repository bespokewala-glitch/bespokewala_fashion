/**
 * Unit tests for src/lib/shippingPolicy.ts
 * Tests: getShippingEstimate for all product types and edge cases
 */
import { describe, it, expect } from '@jest/globals';
import { getShippingEstimate } from '../../../src/lib/shippingPolicy';

describe('getShippingEstimate', () => {
  // ── Footwear ────────────────────────────────────────────────────────────────
  describe('Footwear', () => {
    it('returns 15-20 days when productType is footwear', () => {
      expect(getShippingEstimate('footwear')).toBe('15-20 days');
    });

    it('returns 15-20 days when category is footwear', () => {
      expect(getShippingEstimate('readytowear', 'footwear')).toBe('15-20 days');
    });

    it('returns 15-20 days when subcategory is footwear', () => {
      expect(getShippingEstimate('', '', 'footwear')).toBe('15-20 days');
    });

    it('is case-insensitive for footwear', () => {
      expect(getShippingEstimate('Footwear')).toBe('15-20 days');
      expect(getShippingEstimate('FOOTWEAR')).toBe('15-20 days');
    });
  });

  // ── Couture / Lehenga / Gown ────────────────────────────────────────────────
  describe('Couture & bespoke', () => {
    it('returns 40-50 days for couture productType', () => {
      expect(getShippingEstimate('couture')).toBe('40-50 days');
    });

    it('returns 40-50 days when subcategory contains lehenga', () => {
      expect(getShippingEstimate('readytowear', 'indian-wear', 'lehenga')).toBe('40-50 days');
    });

    it('returns 40-50 days when subcategory contains gown', () => {
      expect(getShippingEstimate('readytowear', 'western-wear', 'gown')).toBe('40-50 days');
    });

    it('is case-insensitive for couture', () => {
      expect(getShippingEstimate('Couture')).toBe('40-50 days');
      expect(getShippingEstimate('COUTURE')).toBe('40-50 days');
    });
  });

  // ── Default ─────────────────────────────────────────────────────────────────
  describe('Default (standard ready-to-wear)', () => {
    it('returns 3-7 days for sarees (standard)', () => {
      expect(getShippingEstimate('readytowear', 'sarees', 'silk-sarees')).toBe('3-7 days');
    });

    it('returns 3-7 days when all arguments are empty', () => {
      expect(getShippingEstimate()).toBe('3-7 days');
    });

    it('returns 3-7 days for undefined inputs', () => {
      expect(getShippingEstimate(undefined, undefined, undefined)).toBe('3-7 days');
    });

    it('returns 3-7 days for jewellery', () => {
      expect(getShippingEstimate('jewellery', 'necklaces')).toBe('3-7 days');
    });
  });

  // ── Priority order ──────────────────────────────────────────────────────────
  describe('Priority ordering', () => {
    it('footwear takes priority over couture string if both present (edge case)', () => {
      // footwear check comes first in the function — should return 15-20 days
      expect(getShippingEstimate('footwear couture')).toBe('15-20 days');
    });
  });
});
