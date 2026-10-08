/**
 * Invoice configuration — seller identity, GST rates and HSN codes.
 *
 * Seller details come from environment variables so that NO tax identity is ever
 * hard-coded or invented. Defaults only cover facts already published on the site
 * (studio address / email / phone from the Contact page).
 *
 *   INVOICE_SELLER_LEGAL_NAME   Registered legal name (defaults to "Bespokewala")
 *   INVOICE_SELLER_GSTIN        15-char GSTIN. If unset, the document is titled
 *                               "INVOICE" (not "TAX INVOICE") and no GSTIN is printed.
 *   INVOICE_SELLER_PAN          Optional PAN
 *   INVOICE_SELLER_STATE        Supply-origin state (default: Maharashtra)
 *   INVOICE_SELLER_ADDRESS      Optional single-line override of the address
 */

export interface SellerProfile {
  legalName: string;
  tradeName: string;
  addressLines: string[];
  state: string;
  stateCode: string;
  gstin?: string;
  pan?: string;
  email: string;
  phone: string;
  website: string;
}

/** GST state / UT codes used for "Place of Supply". */
export const STATE_CODES: Record<string, string> = {
  'jammu and kashmir': '01', 'himachal pradesh': '02', 'punjab': '03', 'chandigarh': '04',
  'uttarakhand': '05', 'haryana': '06', 'delhi': '07', 'rajasthan': '08', 'uttar pradesh': '09',
  'bihar': '10', 'sikkim': '11', 'arunachal pradesh': '12', 'nagaland': '13', 'manipur': '14',
  'mizoram': '15', 'tripura': '16', 'meghalaya': '17', 'assam': '18', 'west bengal': '19',
  'jharkhand': '20', 'odisha': '21', 'chhattisgarh': '22', 'madhya pradesh': '23', 'gujarat': '24',
  'dadra and nagar haveli and daman and diu': '26', 'maharashtra': '27', 'karnataka': '29',
  'goa': '30', 'lakshadweep': '31', 'kerala': '32', 'tamil nadu': '33', 'puducherry': '34',
  'andaman and nicobar islands': '35', 'telangana': '36', 'andhra pradesh': '37', 'ladakh': '38',
};

export function normalizeState(state?: string): string {
  return (state || '').trim().toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ');
}

export function stateCodeFor(state?: string): string {
  return STATE_CODES[normalizeState(state)] || '';
}

export function getSellerProfile(): SellerProfile {
  const state = process.env.INVOICE_SELLER_STATE?.trim() || 'Maharashtra';
  const addressOverride = process.env.INVOICE_SELLER_ADDRESS?.trim();
  const addressLine1 = process.env.INVOICE_SELLER_ADDRESS_LINE1?.trim();
  const addressLine2 = process.env.INVOICE_SELLER_ADDRESS_LINE2?.trim();
  const gstin = process.env.INVOICE_SELLER_GSTIN?.trim().toUpperCase() || '27AAICB0776H1ZK';
  const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com')
    .replace(/\/+$/, '');

  let addressLines: string[];
  if (addressLine1) {
    addressLines = [addressLine1, ...(addressLine2 ? [addressLine2] : [])];
  } else if (addressOverride) {
    addressLines = [addressOverride];
  } else {
    addressLines = [
      'House No T86, Juhu Koliwada, Hira Buwa Gawde Road',
      'Santacruz West, Mumbai City, Maharashtra - 400054',
    ];
  }

  // PAN is characters 3 to 12 of a standard 15-character Indian GSTIN
  const pan =
    process.env.INVOICE_SELLER_PAN?.trim().toUpperCase() ||
    (gstin && gstin.length === 15 ? gstin.slice(2, 12) : undefined);

  return {
    legalName: process.env.INVOICE_SELLER_LEGAL_NAME?.trim() || 'BESPOKEWALA ENTERPRISES (OPC) PRIVATE LIMITED',
    tradeName: process.env.INVOICE_SELLER_TRADE_NAME?.trim() || 'Bespokewala',
    addressLines,
    state,
    stateCode: process.env.INVOICE_SELLER_STATE_CODE?.trim() || (gstin ? gstin.slice(0, 2) : stateCodeFor(state)),
    gstin,
    pan,
    email: process.env.INVOICE_SELLER_EMAIL?.trim() || 'info@bespokewala.com',
    phone: process.env.INVOICE_SELLER_PHONE?.trim() || '+91 75067 67452',
    website: site.replace(/^https?:\/\//, ''),
  };
}

// ─── GST rates & HSN ──────────────────────────────────────────────────────────
//
// Defaults reflect the post-22-Sep-2025 GST slabs for apparel / footwear
// (5% up to Rs.2,500 per piece, 18% above) and 3% for jewellery.
// !! These are sensible defaults, NOT tax advice — have your CA confirm the rate
// !! and HSN for every product class before going live. Edit here if they differ.

export interface TaxClass {
  hsn: string;
  rateFor: (unitPriceInclusive: number) => number;
}

const apparel: TaxClass = { hsn: '6204', rateFor: (p) => (p <= 2500 ? 5 : 18) };
const menApparel: TaxClass = { hsn: '6203', rateFor: (p) => (p <= 2500 ? 5 : 18) };
const footwear: TaxClass = { hsn: '6403', rateFor: (p) => (p <= 2500 ? 5 : 18) };
const jewellery: TaxClass = { hsn: '7113', rateFor: () => 3 };
const accessories: TaxClass = { hsn: '6217', rateFor: () => 18 };

export function resolveTaxClass(productType?: string, category?: string): TaxClass {
  const t = (productType || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (t === 'jewellery' || t === 'jewelry') return jewellery;
  if (t === 'footwear') return footwear;
  if (t === 'accessories') return accessories;
  // couture & anything else is treated as garments
  return c === 'mens' ? menApparel : apparel;
}

/** Shipping, when charged, is a courier service (SAC 9965) at 18%. */
export const SHIPPING_SAC = '9965';
export const SHIPPING_GST_RATE = 18;
