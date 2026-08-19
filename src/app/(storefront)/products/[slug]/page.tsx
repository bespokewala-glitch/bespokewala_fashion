import React from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import ProductGallery from '@/components/product/ProductGallery';
import ProductPriceDisplay from '@/components/product/ProductPriceDisplay';
import { notFound, redirect } from 'next/navigation';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { Metadata } from 'next';
import { normalizeImageUrl } from '@/lib/imageUrl';
import ReactDOM from 'react-dom';
import dynamic from 'next/dynamic';
import FootwearGallery from '@/components/product/FootwearGallery';
import ProductActions from '@/components/product/ProductActions';
import ProductClientActions from '@/components/product/ProductClientActions';
import ProductDetailsAccordionWrapper from '@/components/product/ProductDetailsAccordionWrapper';
import ProductTrustBadges from '@/components/product/ProductTrustBadges';
import { getOrFetch } from '@/lib/serverCache';

const ProductReviews = dynamic(() => import('@/components/product/reviews/ProductReviews'));

export const revalidate = 60;

import { generatePageMetadata, generateProductSchema, generateBreadcrumbSchema, generateCategoryMetadata, generateProductMetadata } from '@/lib/seo';

// Known product types — used to distinguish /products/jewellery (listing)
// from /products/the-pink-diamond-ring (product detail)
const PRODUCT_TYPES = ['jewellery', 'couture', 'accessories', 'footwear', 'beauty', 'diffusion'];

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // If it's a known product type, generate collection metadata
  if (PRODUCT_TYPES.includes(slug)) {
    return generateCategoryMetadata(slug);
  }

  // Otherwise treat as product slug — use server cache to avoid a second DB call
  // when the page render immediately follows (revalidate=60 means ISR handles staleness)
  await dbConnect();
  const product = await getOrFetch(`product:meta:${slug}`, 300, () =>
    Product.findOne({ slug }).select('name slug description images seo productType category subcategory colors details fabric').lean()
  ) as any;
  if (!product) notFound();
  
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : undefined;
  
  return generateProductMetadata(product, product.seo, imageUrl);
}

/**
 * Route: /products/[slug]
 *
 * Smart single-segment route that handles two cases:
 *   1. Known product type  → renders the collection listing page
 *      e.g. /products/jewellery, /products/couture
 *   2. Product slug        → renders the individual product detail page
 *      e.g. /products/the-pink-diamond-ring
 */
export default async function ProductsSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page } = await searchParams;

  // ── Case 1: Couture page is Homepage ─────────────────────────────────────
  if (slug === 'couture') {
    redirect('/');
  }

  // ── Case 2: Product-type listing ─────────────────────────────────────────
  if (PRODUCT_TYPES.includes(slug)) {
    return <CollectionPageContent params={{ productType: slug, page }} />;
  }

  // ── Case 3: Individual product detail ────────────────────────────────────
  // Use server cache (5-min TTL) so navigating back to the same product
  // within a session doesn't trigger a second DB round-trip.
  await dbConnect();
  const rawProduct = await getOrFetch(`product:detail:${slug}`, 300, () =>
    Product.findOne({ slug }).lean()
  );
  const product = JSON.parse(JSON.stringify(rawProduct));

  if (!product) {
    notFound();
  }

  // Combine main images and reference images
  const allImages: { url: string; alt: string }[] = [];

  // Normalize all image URLs from MongoDB to browser-safe proxy URLs.
  // Handles: legacy ?file= format, stale GCS CDN URLs, correct proxy URLs.
  // See src/lib/imageUrl.ts for full normalization logic.

  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: string, idx: number) => {
      const url = normalizeImageUrl(img);
      if (url) allImages.push({ url, alt: `${product.name} - View ${idx + 1}` });
    });
  }

  if (product.referenceImages) {
    const addRef = (img: string | undefined, label: string) => {
      const url = normalizeImageUrl(img);
      if (url) allImages.push({ url, alt: `${product.name} - ${label}` });
    };
    addRef(product.referenceImages.front, 'Front View');
    addRef(product.referenceImages.back, 'Back View');
    addRef(product.referenceImages.left, 'Left View');
    addRef(product.referenceImages.right, 'Right View');
  }

  if (allImages.length > 0) {
    const mainImg = allImages[0].url;
    const preloadUrl = mainImg.includes('/api/media/') 
      ? `${mainImg}${mainImg.includes('?') ? '&' : '?'}v=medium` 
      : mainImg;
    ReactDOM.preload(preloadUrl, { as: 'image', fetchPriority: 'high' });
  }

  const containerStyle: React.CSSProperties = {
    padding: '8rem 4rem 0 4rem',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '6rem',
    fontFamily: '"Jost", "Inter", sans-serif',
  };

  const detailsContainerStyle: React.CSSProperties = {
    position: 'sticky',
    top: '8rem',
    height: 'fit-content',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  };

  const productSchema = generateProductSchema(product, allImages);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: product.productType ? product.productType.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Products', href: `/products?productType=${product.productType}` }
  ];
  if (product.category) {
    breadcrumbs.push({ label: product.category.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), href: `/products/${product.productType}/${product.category}` });
  }
  breadcrumbs.push({ label: product.name, href: `/products/${product.slug}` });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main style={containerStyle} className="mobile-grid-1 mobile-px-4 mobile-pt-20 mobile-pb-4">
        <div>
          {(() => {
            const isFootwear = product.productType?.toLowerCase() === 'footwear' || product.category?.toLowerCase() === 'footwear';
            return isFootwear ? (
              <FootwearGallery images={allImages} />
            ) : (
              <ProductGallery images={allImages} />
            );
          })()}
        </div>

        <div style={{ position: 'relative' }}>
          <div style={detailsContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '-0.5rem' }}>
              {product.category ? (
                <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {product.category}
                </div>
              ) : <div />}

              <ProductActions product={product} />
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 400, color: '#222', lineHeight: '1.2' }}>
              {product.name}
            </h1>

            <div style={{ lineHeight: '1.6', color: '#666', fontSize: '0.95rem' }}>
              {product.description}
            </div>

            <ProductPriceDisplay price={product.price} />

            {product.colors && product.colors.length > 0 && (
              <div style={{ fontSize: '0.95rem', color: '#444', marginTop: '0.5rem' }}>
                Colour: {product.colors.join(', ')}
              </div>
            )}

            {/* Shipping Info */}
            {(() => {
              const categoryStr = `${product.productType || ''} ${product.category || ''} ${product.subcategory || ''}`.toLowerCase();
              if (categoryStr.includes('footwear')) {
                return (
                  <div style={{ fontSize: '0.95rem', color: '#444', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <span>Shipping Time: <strong>15-20 days</strong></span>
                  </div>
                );
              }
              if (categoryStr.includes('couture')) {
                return (
                  <div style={{ fontSize: '0.95rem', color: '#444', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <span>Shipping Time: <strong>40-50 days</strong></span>
                  </div>
                );
              }
              return null;
            })()}

            <ProductClientActions
              product={{
                slug: product.slug,
                name: product.name,
                price: product.price,
                images: product.images,
                colors: product.colors,
                sizes: product.sizes,
              }}
            />

            <ProductTrustBadges />

            <ProductDetailsAccordionWrapper details={product.details} productType={product.productType} category={product.category} />
          </div>
        </div>
      </main>
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <ProductReviews productId={product._id.toString()} deferFetch={true} />
      </div>
    </>
  );
}
