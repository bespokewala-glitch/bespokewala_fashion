/**
 * GST invoice PDF renderer (pdf-lib, pure JS — no native deps, safe on Vercel).
 *
 * Uses the built-in Helvetica family (WinAnsi). The Rupee glyph is not in WinAnsi,
 * so amounts are printed as "Rs." and any other unsupported character is stripped
 * rather than crashing the renderer.
 *
 * Features:
 * - Plain White pure monochrome aesthetic (no gold tints)
 * - Embeds official BW logo (public/bespoken.png)
 * - Embeds official cursive signature (public/invoice-signature.png)
 * - Strictly bounded widths and multi-line wrapping for company title & signature
 */

import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { inr } from './calc';

// ── Pure monochrome luxury palette (zero gold) ──────────────────────────────
const INK = rgb(0.1, 0.1, 0.1);
const GREY = rgb(0.42, 0.42, 0.45);
const MUTED = rgb(0.55, 0.55, 0.58);
const LINE = rgb(0.85, 0.85, 0.85);
const LIGHT_BG = rgb(0.97, 0.97, 0.97);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40; // strict page margin on both left and right (40pt)
const CONTENT_W = PAGE_W - M * 2; // 515.28 pt

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
  pdf.setSubject('GST Tax Invoice');
  pdf.setCreator('Bespokewala');

  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Load logo (public/bespoken.png)
  let logoImg: any = null;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'bespoken.png');
    if (fs.existsSync(logoPath)) {
      logoImg = await pdf.embedPng(fs.readFileSync(logoPath));
    }
  } catch (e) {
    console.warn('Could not load logo for invoice:', e);
  }

  // Load signature (public/invoice-signature.png)
  let sigImg: any = null;
  try {
    const sigPath = path.join(process.cwd(), 'public', 'invoice-signature.png');
    if (fs.existsSync(sigPath)) {
      sigImg = await pdf.embedPng(fs.readFileSync(sigPath));
    }
  } catch (e) {
    console.warn('Could not load signature for invoice:', e);
  }

  const hasGstin = !!inv.seller?.gstin;
  const docTitle = hasGstin ? 'TAX INVOICE' : 'INVOICE';
  const orderId = inv.order
    ? (typeof inv.order === 'object' && 'toString' in inv.order ? inv.order.toString() : String(inv.order))
    : (inv as any).orderNumber || '';
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

  const rect = (x: number, top: number, w: number, h: number, color: any, border?: any, borderWidth = 0.6) =>
    page.drawRectangle({ x, y: PAGE_H - top - h, width: w, height: h, color, borderColor: border, borderWidth: border ? borderWidth : 0 });

  const hline = (top: number, x1 = M, x2 = PAGE_W - M, color = LINE, thickness = 0.6) =>
    page.drawLine({ start: { x: x1, y: PAGE_H - top }, end: { x: x2, y: PAGE_H - top }, thickness, color });

  // ── Header (Plain White, Clean Monochrome) ──────────────────────────────
  const drawHeader = () => {
    rect(0, 0, PAGE_W, PAGE_H, WHITE);

    let logoRight = M;
    if (logoImg) {
      const targetH = 46;
      const targetW = (logoImg.width / logoImg.height) * targetH;
      page.drawImage(logoImg, {
        x: M,
        y: PAGE_H - 24 - targetH,
        width: targetW,
        height: targetH,
      });
      logoRight = M + targetW + 12;
    }

    text('BESPOKEWALA', logoRight, 26, { size: 19, font: bold, color: INK });
    text('Couture  |  Jewellery  |  Footwear  |  Accessories', logoRight, 48, { size: 7.8, font: reg, color: GREY });

    text(docTitle, PAGE_W - M - 200, 24, { size: 19, font: bold, color: INK, align: 'right', w: 200 });
    text('Original for Recipient', PAGE_W - M - 200, 48, { size: 8, font: ital, color: GREY, align: 'right', w: 200 });

    hline(78, M, PAGE_W - M, LINE, 0.8);
  };
  drawHeader();

  // ── Meta Strip ───────────────────────────────────────────────────────────
  let y = 90;
  const metaH = 44;
  rect(M, y, CONTENT_W, metaH, LIGHT_BG, LINE, 0.6);
  const metaCols = [
    ['Invoice No.', inv.invoiceNumber],
    ['Invoice Date', fmtDate(new Date(inv.issuedAt || (inv as any).orderDate || new Date()))],
    ['Order Ref.', `#${shortOrder}`],
    ['Place of Supply', `${inv.placeOfSupply || '-'}${inv.buyer?.stateCode ? ` (${inv.buyer.stateCode})` : ''}`],
  ];
  const colW = CONTENT_W / metaCols.length;
  metaCols.forEach(([label, value], i) => {
    const cx = M + i * colW + 12;
    text(label.toUpperCase(), cx, y + 9, { size: 6.5, font: bold, color: MUTED });
    text(value, cx, y + 23, { size: 9, font: bold, color: INK });
    if (i > 0) page.drawLine({ start: { x: M + i * colW, y: PAGE_H - y - 6 }, end: { x: M + i * colW, y: PAGE_H - y - metaH + 6 }, thickness: 0.5, color: LINE });
  });
  y += metaH + 14;

  // ── Parties (Seller & Buyer Boxes) ─────────────────────────────────────────
  const partyW = (CONTENT_W - 14) / 2;
  const sellerLines: string[] = [
    safe(inv.seller?.legalName),
    ...(inv.seller?.addressLines || []).flatMap((l: string) => wrap(l, reg, 8, partyW - 22)),
    `State: ${safe(inv.seller?.state)}${inv.seller?.stateCode ? ` (${inv.seller.stateCode})` : ''}`,
    ...(hasGstin ? [`GSTIN: ${inv.seller.gstin}`] : []),
    ...(inv.seller?.pan ? [`PAN: ${inv.seller.pan}`] : []),
    `${safe(inv.seller?.email)}  |  ${safe(inv.seller?.phone)}`,
  ];
  const buyerLines: string[] = [
    safe(inv.buyer?.name),
    ...(inv.buyer?.addressLines || []).flatMap((l: string) => wrap(l, reg, 8, partyW - 22)),
    `State: ${safe(inv.buyer?.state || 'Maharashtra')}${inv.buyer?.stateCode ? ` (${inv.buyer.stateCode})` : ''}`,
    ...(inv.buyer?.phone ? [`Phone: ${safe(inv.buyer.phone)}`] : []),
    ...(inv.buyer?.email ? [safe(inv.buyer.email)] : []),
  ];
  const partyH = Math.max(sellerLines.length, buyerLines.length) * 11.5 + 30;

  const drawParty = (x: number, title: string, lines: string[]) => {
    rect(x, y, partyW, partyH, WHITE, LINE, 0.6);
    rect(x, y, 3, partyH, INK); // Sleek solid black accent edge
    text(title.toUpperCase(), x + 12, y + 9, { size: 7, font: bold, color: INK });
    lines.forEach((l, i) => text(l, x + 12, y + 22 + i * 11.5, { size: 8, font: i === 0 ? bold : reg, color: i === 0 ? INK : rgb(0.25, 0.25, 0.28) }));
  };
  drawParty(M, 'Sold By (Seller)', sellerLines);
  drawParty(M + partyW + 14, 'Billed & Shipped To (Buyer)', buyerLines);
  y += partyH + 14;

  // ── Items Table ────────────────────────────────────────────────────────────
  const cols = [
    { k: 'sr', label: '#', w: 22, align: 'center' as const },
    { k: 'desc', label: 'Item Description', w: 156, align: 'left' as const },
    { k: 'hsn', label: 'HSN/SAC', w: 42, align: 'center' as const },
    { k: 'qty', label: 'Qty', w: 24, align: 'center' as const },
    { k: 'rate', label: 'Unit Price', w: 58, align: 'right' as const },
    { k: 'taxable', label: 'Taxable Val', w: 58, align: 'right' as const },
    { k: 'gst', label: 'GST %', w: 32, align: 'center' as const },
    { k: 'tax', label: 'GST Amt', w: 50, align: 'right' as const },
    { k: 'amt', label: 'Amount', w: 0, align: 'right' as const },
  ];
  const fixed = cols.reduce((a, c) => a + c.w, 0);
  cols[cols.length - 1].w = CONTENT_W - fixed;
  const colX: number[] = [];
  cols.reduce((x, c) => { colX.push(x); return x + c.w; }, M);

  const drawTableHeader = () => {
    rect(M, y, CONTENT_W, 22, LIGHT_BG, LINE, 0.6);
    cols.forEach((c, i) =>
      text(c.label, colX[i] + (c.align === 'left' ? 6 : 0), y + 7, {
        size: 7, font: bold, color: INK, align: c.align === 'left' ? 'left' : c.align, w: c.align === 'left' ? undefined : c.w - (c.align === 'right' ? 6 : 0),
      })
    );
    y += 22;
  };

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pageNo += 1;
    rect(0, 0, PAGE_W, PAGE_H, WHITE);
    if (logoImg) {
      const h = 24;
      const w = (logoImg.width / logoImg.height) * h;
      page.drawImage(logoImg, { x: M, y: PAGE_H - 12 - h, width: w, height: h });
      text('BESPOKEWALA', M + w + 8, 17, { size: 12, font: bold, color: INK });
    } else {
      text('BESPOKEWALA', M, 17, { size: 12, font: bold, color: INK });
    }
    text(`${docTitle} ${inv.invoiceNumber} (continued)`, PAGE_W - M - 240, 18, { size: 8, color: GREY, align: 'right', w: 240 });
    hline(42, M, PAGE_W - M, LINE);
    y = 52;
  };

  drawTableHeader();
  const FOOTER_RESERVE = 175;

  const invoiceLines = inv.lines || (inv as any).lineItems || [];
  invoiceLines.forEach((l: any, idx: number) => {
    const descLines = wrap(l.description, bold, 8, cols[1].w - 10);
    const subParts = [l.size ? `Size: ${l.size}` : '', l.sku ? `Style: ${l.sku}` : ''].filter(Boolean).join('   ');
    const subLines = subParts ? wrap(subParts, reg, 7, cols[1].w - 10) : [];
    const rowH = Math.max(24, descLines.length * 9.5 + subLines.length * 8.5 + 8);

    if (y + rowH > PAGE_H - FOOTER_RESERVE) {
      newPage();
      drawTableHeader();
    }

    if (idx % 2 === 1) rect(M, y, CONTENT_W, rowH, rgb(0.99, 0.99, 0.99));
    const mid = y + 7;
    text(String(idx + 1), colX[0], mid, { size: 7.8, align: 'center', w: cols[0].w, color: MUTED });
    descLines.forEach((dl, i) => text(dl, colX[1] + 6, mid + i * 9.5 - 2, { size: 7.8, font: bold, color: INK }));
    subLines.forEach((sl, i) => text(sl, colX[1] + 6, mid + descLines.length * 9.5 + i * 8.5 - 1, { size: 6.8, color: GREY }));

    const rate = l.cgstRate + l.sgstRate + l.igstRate || l.gstRate;
    const tax = (l.cgst || 0) + (l.sgst || 0) + (l.igst || 0);
    text(l.hsn, colX[2], mid, { size: 7.8, align: 'center', w: cols[2].w });
    text(String(l.quantity), colX[3], mid, { size: 7.8, align: 'center', w: cols[3].w });
    text(inr(l.unitPriceInclusive), colX[4], mid, { size: 7.8, align: 'right', w: cols[4].w - 6 });
    text(inr(l.taxableValue), colX[5], mid, { size: 7.8, align: 'right', w: cols[5].w - 6 });
    text(`${rate}%`, colX[6], mid, { size: 7.8, align: 'center', w: cols[6].w });
    text(inr(tax), colX[7], mid, { size: 7.8, align: 'right', w: cols[7].w - 6 });
    text(inr(l.grossTotal), colX[8], mid, { size: 8, font: bold, align: 'right', w: cols[8].w - 6, color: INK });
    y += rowH;
    hline(y, M, PAGE_W - M, LINE, 0.5);
  });

  y += 5;
  text('Unit Price and Amount are inclusive of GST. Taxable Value = Amount / (1 + GST%).', M, y, { size: 6.8, font: ital, color: GREY });
  y += 14;

  // ── Totals & Payment Section ──────────────────────────────────────────────
  const t = inv.totals;
  const totalRows: [string, string, boolean?][] = [['Total Taxable Value', inr(t.taxableValue)]];
  if (inv.isInterState) {
    totalRows.push(['IGST', inr(t.igst)]);
  } else {
    totalRows.push(['CGST', inr(t.cgst)], ['SGST / UTGST', inr(t.sgst)]);
  }
  totalRows.push(['Total GST', inr(t.totalTax)]);

  const totalsH = totalRows.length * 16 + 40;
  if (y + totalsH + 130 > PAGE_H - 30) {
    newPage();
  }

  // Left: Amount in Words + Payment Details
  const leftW = CONTENT_W - 196; // 319.28 pt
  rect(M, y, leftW - 10, totalsH, LIGHT_BG, LINE, 0.6);
  text('AMOUNT IN WORDS', M + 12, y + 9, { size: 6.8, font: bold, color: MUTED });
  wrap(inv.amountInWords || '', bold, 8.2, leftW - 34).forEach((ln, i) => text(ln, M + 12, y + 21 + i * 10.5, { size: 8.2, font: bold, color: INK }));

  const payTop = y + totalsH - 32;
  hline(payTop - 4, M + 12, M + leftW - 22, LINE, 0.5);
  text('PAYMENT DETAILS', M + 12, payTop + 2, { size: 6.8, font: bold, color: MUTED });
  text(`Paid online via ${safe(inv.paymentMethod || 'Razorpay')}${inv.razorpayPaymentId ? `  |  Ref: ${safe(inv.razorpayPaymentId)}` : ''}`, M + 12, payTop + 13, { size: 7.5, color: INK });

  // Right: Totals
  const rx = M + leftW + 4;
  const rw = 192;
  rect(rx, y, rw, totalsH, WHITE, LINE, 0.6);
  totalRows.forEach(([label, val], i) => {
    const ry = y + 8 + i * 16;
    text(label, rx + 12, ry, { size: 7.8, color: GREY });
    text(val, rx + 12, ry, { size: 7.8, align: 'right', w: rw - 24, color: INK });
  });

  // Grand Total Strip (Clean monochrome box with crisp border)
  const gy = y + totalsH - 30;
  rect(rx, gy, rw, 30, LIGHT_BG, INK, 0.8);
  text('GRAND TOTAL', rx + 12, gy + 10, { size: 7.8, font: bold, color: INK });
  text(`Rs. ${inr(t.grandTotal)}`, rx + 12, gy + 8, { size: 11.5, font: bold, color: INK, align: 'right', w: rw - 24 });
  y += totalsH + 16;

  // ── Terms & Signature Section (Strict Margin Adherence) ───────────────────
  const declLines = [
    'Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    'Goods once sold are subject to our Shipping & Returns policy published at ' + safe(inv.seller?.website || 'bespokewala.com') + '.',
    'Subject to Mumbai jurisdiction. This is a computer-generated tax invoice.',
  ];

  // Signature Box width & placement (strictly flush with right margin PAGE_W - M = 555.28)
  const sw = 190;
  const sx = PAGE_W - M - sw; // 365.28 pt -> [365.28 to 555.28]

  // Terms on Left (width bounded to avoid any collision with signature box)
  const termsW = sx - M - 16;
  let dy = y;
  text('TERMS & CONDITIONS', M, dy, { size: 6.8, font: bold, color: INK });
  dy += 11;
  declLines.forEach((d) => wrap(d, reg, 7, termsW).forEach((ln) => { text(ln, M, dy, { size: 7, color: GREY }); dy += 9.5; }));

  // Signature Block on Right
  // Wrap company title into multiple lines so it NEVER exceeds sw!
  const sellerLegal = safe(inv.seller?.legalName || 'BESPOKEWALA ENTERPRISES (OPC) PRIVATE LIMITED');
  const compLines = wrap(`For ${sellerLegal}`, bold, 7.2, sw - 12);
  let compY = y;
  compLines.forEach((cl) => {
    text(cl, sx, compY, { size: 7.2, font: bold, align: 'center', w: sw, color: INK });
    compY += 9.5;
  });

  // Draw signature image cleanly centered within sw
  let sigBottomY = compY + 28;
  if (sigImg) {
    const targetW = 100;
    const targetH = (sigImg.height / sigImg.width) * targetW;
    const sigX = sx + (sw - targetW) / 2;
    const sigY = compY + 2;
    page.drawImage(sigImg, {
      x: sigX,
      y: PAGE_H - sigY - targetH,
      width: targetW,
      height: targetH,
    });
    sigBottomY = sigY + targetH + 3;
  }

  // Divider line under signature (strictly inside sw)
  hline(sigBottomY, sx + 20, sx + sw - 20, LINE, 0.6);
  text('Authorised Signatory', sx, sigBottomY + 4, { size: 7, font: reg, color: GREY, align: 'center', w: sw });

  // ── Page Footers ──────────────────────────────────────────────────────────
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 30 }, end: { x: PAGE_W - M, y: 30 }, thickness: 0.5, color: LINE });
    const foot = safe(`${inv.seller?.tradeName || 'Bespokewala'}  |  ${inv.seller?.website || 'bespokewala.com'}  |  ${inv.seller?.email}  |  ${inv.seller?.phone}`);
    p.drawText(foot, { x: M, y: 14, size: 7, font: reg, color: GREY });
    const pg = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pg, { x: PAGE_W - M - reg.widthOfTextAtSize(pg, 7), y: 14, size: 7, font: reg, color: GREY });
  });

  return pdf.save();
}
