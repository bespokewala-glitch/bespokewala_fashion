"use client";

import React, { useState } from 'react';

interface ProductDetailsAccordionProps {
  productType?: string;
  category?: string;
  details?: {
    styleCode?: string;
    commodityName?: string;
    composition?: string;
    componentsCount?: string;
    includes?: string;
    shipping?: string;
    disclaimer?: string;
    legal?: string;
  };
}

// Inline SVG chevron — replaces lucide-react ChevronDown (~40KB saved).
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#666"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.3s ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      flexShrink: 0,
    }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * AccordionItem — pure-CSS expand/collapse.
 *
 * Uses max-height transition instead of framer-motion AnimatePresence so that
 * framer-motion is completely absent from this component's JS bundle.
 * Visual result is identical to the previous implementation.
 */
const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #e0e0e0', padding: '1.25rem 0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.9rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#111',
        }}
      >
        {title}
        <ChevronIcon isOpen={isOpen} />
      </button>

      {/*
        CSS max-height trick: collapsed = max-height:0 + overflow:hidden,
        expanded = max-height:600px (safe upper bound for any accordion content).
        Transition animates the height change at 0.3s — same feel as framer-motion.
      */}
      <div
        style={{
          maxHeight: isOpen ? '600px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <div
          style={{
            paddingTop: '1.25rem',
            color: '#555',
            fontSize: '0.9rem',
            lineHeight: '1.8',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ProductDetailsAccordion({
  productType,
  category,
  details,
}: ProductDetailsAccordionProps) {
  const d = details || {};
  const hasProductDetails =
    d.styleCode || d.commodityName || d.composition || d.componentsCount || d.includes;

  const isFootwear =
    productType?.toLowerCase() === 'footwear' || category?.toLowerCase() === 'footwear';
  const isCouture =
    productType?.toLowerCase() === 'couture' || category?.toLowerCase() === 'couture';

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      {hasProductDetails && (
        <AccordionItem title="Product Details" defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {d.styleCode && <div><strong>Style Code:</strong> {d.styleCode}</div>}
            {d.commodityName && <div><strong>Name of Commodity:</strong> {d.commodityName}</div>}
            {d.composition && <div><strong>Composition:</strong> {d.composition}</div>}
            {d.componentsCount && <div><strong>No of Components:</strong> {d.componentsCount}</div>}
            {d.includes && <div><strong>Includes:</strong> {d.includes}</div>}
          </div>
        </AccordionItem>
      )}

      <AccordionItem title="Shipping, Packaging & Alteration">
        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
          {isFootwear ? (
            <>
              • <strong>Footwear Delivery:</strong> 15 to 20 days for custom crafting &amp; delivery.{"\n"}
            </>
          ) : isCouture ? (
            <>
              • <strong>Couture Delivery:</strong> 40 to 45 days for handcrafted creation &amp; delivery.{"\n"}
            </>
          ) : (
            <>
              • <strong>Footwear Delivery:</strong> 15 to 20 days.{"\n"}
              • <strong>Couture &amp; Bespoke:</strong> 40 to 45 days for handcrafted creation &amp; delivery.{"\n"}
              • <strong>Standard Shipping:</strong> 5 to 7 business days.{"\n"}
            </>
          )}
          • <strong>Alterations:</strong> Alteration services are available. Custom-made, footwear &amp; couture garments are non-refundable.
        </div>
      </AccordionItem>

      <AccordionItem title="Disclaimer">
        <div style={{ whiteSpace: 'pre-line' }}>
          Product colour may slightly vary due to photographic lighting sources or your monitor settings.
          Handcrafted items may have slight variations in embroidery or embellishments, which adds to the unique charm of each piece.
        </div>
      </AccordionItem>

      <AccordionItem title="Legal">
        <div style={{ whiteSpace: 'pre-line' }}>
          All designs, images, and content are intellectual property of Bespokewala.
          Unauthorized use or reproduction is strictly prohibited.
        </div>
      </AccordionItem>
    </div>
  );
}
