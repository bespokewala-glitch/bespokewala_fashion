/**
 * GST invoice PDF renderer (pdf-lib, pure JS — no native deps, safe on Vercel).
 *
 * Uses the built-in Helvetica family (WinAnsi). The Rupee glyph is not in WinAnsi,
 * so amounts are printed as "Rs." and any other unsupported character is stripped
 * rather than crashing the renderer.
 */

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { inr } from './calc';

const INK = rgb(0.1, 0.1, 0.1);
const GOLD = rgb(0.78, 0.66, 0.43);
const GOLD_SOFT = rgb(0.96, 0.93, 0.85);
const GREY = rgb(0.42, 0.42, 0.45);
const LINE = rgb(0.86, 0.84, 0.8);
const PAPER = rgb(0.98, 0.97, 0.95);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40; // page margin
const CONTENT_W = PAGE_W - M * 2;

/** Strip / map characters Helvetica (WinAnsi) can't encode. */
function safe(input: unknown): string {
  return String(input ?? '')
    .replace(/₹/g, 'Rs.')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .trim();
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxW) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      // hard-split a single over-long token
      let token = w;
      while (font.widthOfTextAtSize(token, size) > maxW && token.length > 1) {
        let cut = token.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(token.slice(0, cut), size) > maxW) cut--;
        lines.push(token.slice(0, cut));
        token = token.slice(cut);
      }
      cur = token;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export interface PdfInvoice {
  invoiceNumber: string;
  issuedAt: Date | string;
  seller: any;
  buyer: any;
  placeOfSupply?: string;
  isInterState: boolean;
  lines: any[];
  totals: any;
  amountInWords?: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  order: { toString(): string } | string;
}

export async function renderInvoicePdf(inv: PdfInvoice): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${safe(inv.invoiceNumber)}`);
  pdf.setAuthor(safe(inv.seller?.legalName || 'Bespokewala'));
  pdf.setSubject('GST Invoice');
  pdf.setCreator('Bespokewala');

  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const hasGstin = !!inv.seller?.gstin;
  const docTitle = hasGstin ? 'TAX INVOICE' : 'INVOICE';
  const orderId = inv.order
    ? (typeof inv.order === 'object' && 'toString' in inv.order ? inv.order.toString() : String(inv.order))
    : '';
  const shortOrder = orderId ? orderId.slice(-8).toUpperCase() : 'N/A';

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
  let pageNo = 1;

  const text = (
    t: string, x: number, top: number,
    o: { size?: number; font?: PDFFont; color?: any; align?: 'left' | 'right' | 'center'; w?: number } = {}
  ) => {
    const size = o.size ?? 9;
    const font = o.font ?? reg;
    const s = safe(t);
    let px = x;
    if (o.align === 'right' && o.w !== undefined) px = x + o.w - font.widthOfTextAtSize(s, size);
    else if (o.align === 'center' && o.w !== undefined) px = x + (o.w - font.widthOfTextAtSize(s, size)) / 2;
    page.drawText(s, { x: px, y: PAGE_H - top - size, size, font, color: o.color ?? INK });
  };

  const rect = (x: number, top: number, w: number, h: number, color: any, border?: any) =>
    page.drawRectangle({ x, y: PAGE_H - top - h, width: w, height: h, color, borderColor: border, borderWidth: border ? 0.6 : 0 });

  const hline = (top: number, x1 = M, x2 = PAGE_W - M, color = LINE, thickness = 0.6) =>
    page.drawLine({ start: { x: x1, y: PAGE_H - top }, end: { x: x2, y: PAGE_H - top }, thickness, color });

  // ── Header band ───────────────────────────────────────────────────────────
  const drawHeader = () => {
    rect(0, 0, PAGE_W, 92, INK);
    rect(0, 92, PAGE_W, 3, GOLD);
    text('BESPOKEWALA', M, 28, { size: 24, font: bold, color: GOLD });
    text('Couture  |  Jewellery  |  Footwear  |  Accessories', M, 58, { size: 8, color: rgb(0.8, 0.8, 0.8) });
    text(docTitle, PAGE_W - M - 200, 30, { size: 20, font: bold, color: WHITE, align: 'right', w: 200 });
    text('Original for Recipient', PAGE_W - M - 200, 56, { size: 8, font: ital, color: GOLD, align: 'right', w: 200 });
  };
  drawHeader();

  // ── Meta strip ────────────────────────────────────────────────────────────
  let y = 112;
  const metaH = 50;
  rect(M, y, CONTENT_W, metaH, PAPER, LINE);
  const metaCols = [
    ['Invoice No.', inv.invoiceNumber],
    ['Invoice Date', fmtDate(new Date(inv.issuedAt))],
    ['Order Ref.', `#${shortOrder}`],
    ['Place of Supply', `${inv.placeOfSupply || '-'}${inv.buyer?.stateCode ? ` (${inv.buyer.stateCode})` : ''}`],
  ];
  const colW = CONTENT_W / metaCols.length;
  metaCols.forEach(([label, value], i) => {
    const cx = M + i * colW + 12;
    text(label.toUpperCase(), cx, y + 11, { size: 6.5, font: bold, color: GREY });
    text(value, cx, y + 25, { size: 9.5, font: bold });
    if (i > 0) page.drawLine({ start: { x: M + i * colW, y: PAGE_H - y - 8 }, end: { x: M + i * colW, y: PAGE_H - y - metaH + 8 }, thickness: 0.5, color: LINE });
  });
  y += metaH + 18;

  // ── Parties ───────────────────────────────────────────────────────────────
  const partyW = (CONTENT_W - 16) / 2;
  const sellerLines: string[] = [
    safe(inv.seller?.legalName),
    ...(inv.seller?.addressLines || []).flatMap((l: string) => wrap(l, reg, 8.5, partyW - 24)),
    `State: ${safe(inv.seller?.state)}${inv.seller?.stateCode ? ` (${inv.seller.stateCode})` : ''}`,
    ...(hasGstin ? [`GSTIN: ${inv.seller.gstin}`] : []),
    ...(inv.seller?.pan ? [`PAN: ${inv.seller.pan}`] : []),
    `${safe(inv.seller?.email)}  |  ${safe(inv.seller?.phone)}`,
  ];
  const buyerLines: string[] = [
    safe(inv.buyer?.name),
    ...(inv.buyer?.addressLines || []).flatMap((l: string) => wrap(l, reg, 8.5, partyW - 24)),
    ...(inv.buyer?.phone ? [`Phone: ${safe(inv.buyer.phone)}`] : []),
    ...(inv.buyer?.email ? [safe(inv.buyer.email)] : []),
  ];
  const partyH = Math.max(sellerLines.length, buyerLines.length) * 12.5 + 34;

  const drawParty = (x: number, title: string, lines: string[]) => {
    rect(x, y, partyW, partyH, WHITE, LINE);
    rect(x, y, 3, partyH, GOLD);
    text(title.toUpperCase(), x + 14, y + 10, { size: 7, font: bold, color: GOLD });
    lines.forEach((l, i) => text(l, x + 14, y + 25 + i * 12.5, { size: 8.5, font: i === 0 ? bold : reg, color: i === 0 ? INK : rgb(0.25, 0.25, 0.28) }));
  };
  drawParty(M, 'Sold By', sellerLines);
  drawParty(M + partyW + 16, 'Billed & Shipped To', buyerLines);
  y += partyH + 20;

  // ── Items table ───────────────────────────────────────────────────────────
  const cols = [
    { k: 'sr', label: '#', w: 22, align: 'center' as const },
    { k: 'desc', label: 'Description', w: 150, align: 'left' as const },
    { k: 'hsn', label: 'HSN/SAC', w: 40, align: 'center' as const },
    { k: 'qty', label: 'Qty', w: 24, align: 'center' as const },
    { k: 'rate', label: 'Unit Price', w: 58, align: 'right' as const },
    { k: 'taxable', label: 'Taxable Value', w: 62, align: 'right' as const },
    { k: 'gst', label: 'GST %', w: 34, align: 'center' as const },
    { k: 'tax', label: 'GST Amt', w: 52, align: 'right' as const },
    { k: 'amt', label: 'Amount', w: 0, align: 'right' as const }, // fills the rest
  ];
  const fixed = cols.reduce((a, c) => a + c.w, 0);
  cols[cols.length - 1].w = CONTENT_W - fixed;
  const colX: number[] = [];
  cols.reduce((x, c) => { colX.push(x); return x + c.w; }, M);

  const drawTableHeader = () => {
    rect(M, y, CONTENT_W, 24, INK);
    cols.forEach((c, i) =>
      text(c.label, colX[i] + (c.align === 'left' ? 6 : 0), y + 8, {
        size: 7.2, font: bold, color: GOLD, align: c.align === 'left' ? 'left' : c.align, w: c.align === 'left' ? undefined : c.w - (c.align === 'right' ? 6 : 0),
      })
    );
    y += 24;
  };

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pageNo += 1;
    rect(0, 0, PAGE_W, 34, INK);
    rect(0, 34, PAGE_W, 2, GOLD);
    text('BESPOKEWALA', M, 11, { size: 13, font: bold, color: GOLD });
    text(`${docTitle} ${inv.invoiceNumber}  (continued)`, PAGE_W - M - 280, 13, { size: 8, color: WHITE, align: 'right', w: 280 });
    y = 54;
  };

  drawTableHeader();
  const FOOTER_RESERVE = 70;

  const invoiceLines = inv.lines || (inv as any).lineItems || [];
  invoiceLines.forEach((l: any, idx: number) => {
    const descLines = wrap(l.description, bold, 8.2, cols[1].w - 10);
    const subParts = [l.size ? `Size: ${l.size}` : '', l.sku ? `Style: ${l.sku}` : ''].filter(Boolean).join('   ');
    const subLines = subParts ? wrap(subParts, reg, 7, cols[1].w - 10) : [];
    const rowH = Math.max(26, descLines.length * 10.5 + subLines.length * 9 + 12);

    if (y + rowH > PAGE_H - FOOTER_RESERVE) {
      newPage();
      drawTableHeader();
    }

    if (idx % 2 === 1) rect(M, y, CONTENT_W, rowH, PAPER);
    const mid = y + 8;
    text(String(idx + 1), colX[0], mid, { size: 8, align: 'center', w: cols[0].w, color: GREY });
    descLines.forEach((dl, i) => text(dl, colX[1] + 6, mid + i * 10.5 - 2, { size: 8.2, font: bold }));
    subLines.forEach((sl, i) => text(sl, colX[1] + 6, mid + descLines.length * 10.5 + i * 9 - 1, { size: 7, color: GREY }));

    const rate = l.cgstRate + l.sgstRate + l.igstRate || l.gstRate;
    const tax = (l.cgst || 0) + (l.sgst || 0) + (l.igst || 0);
    text(l.hsn, colX[2], mid, { size: 8, align: 'center', w: cols[2].w });
    text(String(l.quantity), colX[3], mid, { size: 8, align: 'center', w: cols[3].w });
    text(inr(l.unitPriceInclusive), colX[4], mid, { size: 8, align: 'right', w: cols[4].w - 6 });
    text(inr(l.taxableValue), colX[5], mid, { size: 8, align: 'right', w: cols[5].w - 6 });
    text(`${rate}%`, colX[6], mid, { size: 8, align: 'center', w: cols[6].w });
    text(inr(tax), colX[7], mid, { size: 8, align: 'right', w: cols[7].w - 6 });
    text(inr(l.grossTotal), colX[8], mid, { size: 8.4, font: bold, align: 'right', w: cols[8].w - 6 });
    y += rowH;
    hline(y);
  });

  // Prices are GST-inclusive: make that explicit under the table.
  y += 6;
  text('Unit Price and Amount are inclusive of GST. Taxable Value = Amount / (1 + GST%).', M, y, { size: 7, font: ital, color: GREY });
  y += 22;

  // ── Totals block (keep together) ─────────────────────────────────────────
  const t = inv.totals;
  const totalRows: [string, string, boolean?][] = [['Total Taxable Value', inr(t.taxableValue)]];
  if (inv.isInterState) {
    totalRows.push(['IGST', inr(t.igst)]);
  } else {
    totalRows.push(['CGST', inr(t.cgst)], ['SGST / UTGST', inr(t.sgst)]);
  }
  totalRows.push(['Total GST', inr(t.totalTax)]);

  const totalsH = totalRows.length * 18 + 44;
  if (y + totalsH + 150 > PAGE_H - 30) {
    newPage();
  }

  // left: amount in words + payment
  const leftW = CONTENT_W - 210;
  rect(M, y, leftW - 14, totalsH, PAPER, LINE);
  text('AMOUNT IN WORDS', M + 12, y + 11, { size: 6.8, font: bold, color: GREY });
  wrap(inv.amountInWords || '', bold, 9, leftW - 40).forEach((ln, i) => text(ln, M + 12, y + 25 + i * 12, { size: 9, font: bold }));
  const payTop = y + totalsH - 38;
  hline(payTop - 4, M + 12, M + leftW - 26);
  text('PAYMENT', M + 12, payTop + 3, { size: 6.8, font: bold, color: GREY });
  text(`Paid online via ${safe(inv.paymentMethod || 'Razorpay')}${inv.razorpayPaymentId ? `   Ref: ${safe(inv.razorpayPaymentId)}` : ''}`, M + 12, payTop + 15, { size: 7.6 });

  // right: totals
  const rx = M + leftW + 6;
  const rw = 204;
  rect(rx, y, rw, totalsH, WHITE, LINE);
  totalRows.forEach(([label, val], i) => {
    const ry = y + 10 + i * 18;
    text(label, rx + 12, ry, { size: 8.5, color: GREY });
    text(val, rx + 12, ry, { size: 8.5, align: 'right', w: rw - 24 });
  });
  const gy = y + totalsH - 34;
  rect(rx, gy, rw, 34, INK);
  text('GRAND TOTAL', rx + 12, gy + 12, { size: 8, font: bold, color: GOLD });
  text(`Rs. ${inr(t.grandTotal)}`, rx + 12, gy + 10, { size: 13, font: bold, color: WHITE, align: 'right', w: rw - 24 });
  y += totalsH + 22;

  // ── Declaration & signature ──────────────────────────────────────────────
  const declLines = [
    'Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    'Goods once sold are subject to our Shipping & Returns policy published at ' + safe(inv.seller?.website || 'bespokewala.com') + '. Made-to-order pieces are non-returnable unless defective.',
    'Subject to Mumbai jurisdiction. This is a computer-generated invoice and does not require a physical signature.',
  ];
  let dy = y;
  text('TERMS & DECLARATION', M, dy, { size: 7, font: bold, color: GOLD });
  dy += 13;
  declLines.forEach((d) => wrap(d, reg, 7.4, CONTENT_W - 190).forEach((ln) => { text(ln, M, dy, { size: 7.4, color: GREY }); dy += 10; }));

  const sx = PAGE_W - M - 160;
  hline(y + 52, sx, PAGE_W - M, GREY, 0.6);
  text(`For ${safe(inv.seller?.legalName)}`, sx, y + 58, { size: 8, font: bold, align: 'center', w: 160 });
  text('Authorised Signatory', sx, y + 70, { size: 7, color: GREY, align: 'center', w: 160 });

  // ── Footer on every page ─────────────────────────────────────────────────
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 30, color: GOLD_SOFT });
    p.drawRectangle({ x: 0, y: 30, width: PAGE_W, height: 1.2, color: GOLD });
    const foot = safe(`${inv.seller?.tradeName || 'Bespokewala'}  |  ${inv.seller?.website}  |  ${inv.seller?.email}  |  ${inv.seller?.phone}`);
    p.drawText(foot, { x: M, y: 11, size: 7.4, font: reg, color: GREY });
    const pg = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pg, { x: PAGE_W - M - reg.widthOfTextAtSize(pg, 7.4), y: 11, size: 7.4, font: reg, color: GREY });
  });

  return pdf.save();
}
