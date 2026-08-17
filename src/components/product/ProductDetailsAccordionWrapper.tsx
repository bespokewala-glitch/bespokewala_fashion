"use client";

/**
 * Thin client-side wrapper for ProductDetailsAccordion.
 *
 * `ssr: false` is only valid inside a Client Component ("use client").
 * This wrapper lets the Server Component (page.tsx) render the accordion
 * without including its JS in the initial SSR bundle.
 */
import dynamic from 'next/dynamic';

const ProductDetailsAccordion = dynamic(
  () => import('@/components/product/ProductDetailsAccordion'),
  { ssr: false }
);

export default ProductDetailsAccordion;
