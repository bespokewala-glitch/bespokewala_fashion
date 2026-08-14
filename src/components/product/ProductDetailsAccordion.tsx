"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ProductDetailsAccordionProps {
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

export default function ProductDetailsAccordion({ details }: ProductDetailsAccordionProps) {
  if (!details) return null;

  const hasProductDetails = details.styleCode || details.commodityName || details.composition || details.componentsCount || details.includes;

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      {hasProductDetails && (
        <AccordionItem title="Product Details" defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {details.styleCode && <div><strong>Style Code:</strong> {details.styleCode}</div>}
            {details.commodityName && <div><strong>Name of Commodity:</strong> {details.commodityName}</div>}
            {details.composition && <div><strong>Composition:</strong> {details.composition}</div>}
            {details.componentsCount && <div><strong>No of Components:</strong> {details.componentsCount}</div>}
            {details.includes && <div><strong>Includes:</strong> {details.includes}</div>}
          </div>
        </AccordionItem>
      )}

      <AccordionItem title="Shipping, Packaging & Returns">
        <div style={{ whiteSpace: 'pre-line' }}>
          Standard shipping typically takes 3-5 business days. 
          Bespoke and Couture items may take 8-12 weeks for production and delivery.
          Returns are accepted within 14 days of delivery for standard items. 
          Custom-made items are non-refundable.
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
