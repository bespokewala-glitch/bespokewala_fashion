"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

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

const AccordionItem = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #e0e0e0', padding: '1.25rem 0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          color: '#111'
        }}
      >
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={18} color="#666" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '1.25rem', color: '#555', fontSize: '0.9rem', lineHeight: '1.8' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ProductDetailsAccordion({ productType, category, details }: ProductDetailsAccordionProps) {
  const d = details || {};
  const hasProductDetails = d.styleCode || d.commodityName || d.composition || d.componentsCount || d.includes;

  const isFootwear = productType?.toLowerCase() === 'footwear' || category?.toLowerCase() === 'footwear';
  const isCouture = productType?.toLowerCase() === 'couture' || category?.toLowerCase() === 'couture';

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

      <AccordionItem title="Shipping, Packaging & Returns">
        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
          {isFootwear ? (
            <>
              • <strong>Footwear Delivery:</strong> 15 to 20 days for custom crafting & delivery.{"\n"}
            </>
          ) : isCouture ? (
            <>
              • <strong>Couture Delivery:</strong> 40 to 45 days for handcrafted creation & delivery.{"\n"}
            </>
          ) : (
            <>
              • <strong>Footwear Delivery:</strong> 15 to 20 days.{"\n"}
              • <strong>Couture & Bespoke:</strong> 40 to 45 days for handcrafted creation & delivery.{"\n"}
              • <strong>Standard Shipping:</strong> 5 to 7 business days.{"\n"}
            </>
          )}
          • <strong>Returns:</strong> Accepted within 7 days of delivery for standard ready-to-wear items. Custom-made, footwear & couture garments are non-refundable.
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
