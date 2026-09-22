export interface CurrencyDetail {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const BASE_CURRENCY = 'INR';

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDetail> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimals: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-DE', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA', decimals: 2 },
  QAR: { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', locale: 'ar-QA', decimals: 2 },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', locale: 'ar-KW', decimals: 3 },
};

/**
 * Mapping of Country ISO codes to Currency codes.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AE: 'AED',
  AU: 'AUD',
  CA: 'CAD',
  SG: 'SGD',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  // Europe
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR',
  FR: 'EUR', DE: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR',
  LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR',
  PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR'
};

/**
 * Fallback currency code when country is unsupported or IP detection fails.
 */
export const DEFAULT_FALLBACK_CURRENCY = 'INR';
