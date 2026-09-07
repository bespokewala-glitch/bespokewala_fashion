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
};

/**
 * Mapping of Country ISO codes to Currency codes.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR', 
};

/**
 * Fallback currency code when country is unsupported or IP detection fails.
 */
export const DEFAULT_FALLBACK_CURRENCY = 'INR';
