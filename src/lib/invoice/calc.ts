/**
 * Pure GST maths + formatting helpers (no I/O — unit-testable).
 *
 * Storefront prices are GST-INCLUSIVE (what the customer actually pays), so the
 * taxable value is back-calculated:  taxable = gross / (1 + rate).
 * The invoice grand total therefore always equals the amount charged via Razorpay.
 */

import { SHIPPING_GST_RATE, SHIPPING_SAC } from './config';

export interface RawLine {
  description: string;
  sku?: string;
  size?: string;
  hsn: string;
  quantity: number;
  unitPriceInclusive: number;
  gstRate: number;
}

export interface TaxedLine extends RawLine {
  grossTotal: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export interface InvoiceTotals {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeLines(
  raw: RawLine[],
  interState: boolean,
  shippingInclusive = 0
): TaxedLine[] {
  const all: RawLine[] = [...raw];
  if (shippingInclusive > 0) {
    all.push({
      description: 'Shipping & handling',
      hsn: SHIPPING_SAC,
      quantity: 1,
      unitPriceInclusive: shippingInclusive,
      gstRate: SHIPPING_GST_RATE,
    });
  }

  return all.map((l) => {
    const gross = r2(l.unitPriceInclusive * l.quantity);
    const taxable = r2(gross / (1 + l.gstRate / 100));
    const tax = r2(gross - taxable); // guarantees taxable + tax === gross
    let cgst = 0, sgst = 0, igst = 0;
    if (interState) {
      igst = tax;
    } else {
      cgst = r2(tax / 2);
      sgst = r2(tax - cgst); // absorbs the paisa when tax is odd
    }
    return {
      ...l,
      grossTotal: gross,
      taxableValue: taxable,
      cgst, sgst, igst,
      cgstRate: interState ? 0 : l.gstRate / 2,
      sgstRate: interState ? 0 : l.gstRate / 2,
      igstRate: interState ? l.gstRate : 0,
    };
  });
}

export function computeTotals(lines: TaxedLine[]): InvoiceTotals {
  const sum = (k: 'taxableValue' | 'cgst' | 'sgst' | 'igst' | 'grossTotal') =>
    r2(lines.reduce((a, l) => a + l[k], 0));
  const cgst = sum('cgst'), sgst = sum('sgst'), igst = sum('igst');
  return {
    taxableValue: sum('taxableValue'),
    cgst, sgst, igst,
    totalTax: r2(cgst + sgst + igst),
    grandTotal: sum('grossTotal'),
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** "1,23,456.00" — Indian digit grouping, always 2 decimals. */
export function inr(n: number): string {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
  'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '')); }
  else if (n > 0) parts.push(ONES[n]);
  return parts.join(' ');
}

/** 12345.5 → "Rupees Twelve Thousand Three Hundred Forty Five and Fifty Paise Only" */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  const words: string[] = [];
  if (crore) words.push(`${below1000(crore)} Crore`);
  if (lakh) words.push(`${below1000(lakh)} Lakh`);
  if (thousand) words.push(`${below1000(thousand)} Thousand`);
  if (rest) words.push(below1000(rest));

  let out = `Rupees ${words.join(' ') || 'Zero'}`;
  if (paise) out += ` and ${below1000(paise)} Paise`;
  return `${out} Only`;
}

/** Financial year label for an Indian FY (Apr–Mar): 2026-10-07 → "2026-27". */
export function fiscalYearLabel(d: Date): string {
  // Use IST so an order placed just after midnight on 1 Apr lands in the right FY.
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const startYear = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}
