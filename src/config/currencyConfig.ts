export interface CurrencyDetail {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const BASE_CURRENCY = 'INR';

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDetail> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimals: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    locale: 'en-CA',
    decimals: 2,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU',
    decimals: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    locale: 'ar-AE',
    decimals: 2,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    locale: 'en-SG',
    decimals: 2,
  },
};

/**
 * Mapping of Country ISO codes to Currency codes
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR',
  GB: 'GBP',
  UK: 'GBP',
  US: 'USD',
  // Eurozone countries
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  PT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  // Others
  CA: 'CAD',
  AU: 'AUD',
  AE: 'AED',
  SG: 'SGD',
};

/**
 * Fallback currency code when country is unsupported or IP detection fails
 */
export const DEFAULT_FALLBACK_CURRENCY = 'USD';
