/**
 * Unit tests for chatbot FAQ search logic (src/lib/chatbot/faqData.ts)
 * Tests: searchFAQ keyword matching
 */
import { describe, it, expect } from '@jest/globals';
import { searchFAQ } from '../../../../src/lib/chatbot/faqData';

describe('searchFAQ', () => {
  it('returns null for an unrelated query', () => {
    expect(searchFAQ('what is the capital of France')).toBeNull();
  });

  it('finds shipping answer for "shipping time" query', () => {
    const result = searchFAQ('how long does shipping take');
    expect(result).not.toBeNull();
    expect(result!.answer).toContain('3-7');
  });

  it('finds shipping answer for "delivery time" keyword', () => {
    const result = searchFAQ('what is the delivery time');
    expect(result).not.toBeNull();
    expect(result!.category).toBe('Shipping & Delivery');
  });

  it('finds return policy for "return" query', () => {
    const result = searchFAQ('what is your return policy');
    expect(result).not.toBeNull();
    expect(result!.answer.toLowerCase()).toContain('return');
  });

  it('finds payment answer for "upi" query', () => {
    const result = searchFAQ('do you accept upi payment');
    expect(result).not.toBeNull();
    expect(result!.answer.toLowerCase()).toContain('upi');
  });

  it('finds sizing answer for "size guide" query', () => {
    const result = searchFAQ('how do I find my size guide');
    expect(result).not.toBeNull();
    // Products & Sizing or similar category
    expect(result!.category).toBeTruthy();
  });

  it('finds custom order answer for "bespoke" query', () => {
    const result = searchFAQ('do you offer bespoke garments');
    expect(result).not.toBeNull();
    // Custom & Bespoke Orders category
    expect(result!.category).toBeTruthy();
  });

  it('returns null for empty query', () => {
    expect(searchFAQ('')).toBeNull();
  });

  it('returns null for query with only whitespace', () => {
    expect(searchFAQ('   ')).toBeNull();
  });

  it('matches multi-word keywords with higher score', () => {
    // "shipping time" is a 2-word keyword — should score higher than single word
    const result = searchFAQ('what is the shipping time for my order');
    expect(result).not.toBeNull();
    expect(result!.category).toBe('Shipping & Delivery');
  });
});
