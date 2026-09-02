import React, { cache, Suspense } from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import ProductGallery from '@/components/product/ProductGallery';
import ProductPriceDisplay from '@/components/product/ProductPriceDisplay';
import { notFound } from 'next/navigation';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { Metadata } from 'next';
import { normalizeImageUrl } from '@/lib/imageUrl';
import ReactDOM from 'react-dom';
import nextDynamic from 'next/dynamic';
import FootwearGallery from '@/components/product/FootwearGallery';
import ProductActions from '@/components/product/ProductActions';
import ProductClientActions from '@/components/product/ProductClientActions';
import ProductDetailsAccordionWrapper from '@/components/product/ProductDetailsAccordionWrapper';
import { getOrFetch } from '@/lib/serverCache';

import { generatePageMetadata, generateProductSchema, generateBreadcrumbSchema, generateCategoryMetadata, generateProductMetadata } from '@/lib/seo';
const ProductTrustBadges = nextDynamic(() => import('@/components/product/ProductTrustBadges'));
const RelatedProducts = nextDynamic(() => import('@/components/product/RelatedProducts'));
const ProductReviews = nextDynamic(() => import('@/components/product/reviews/ProductReviews'));
import ProductChatContext from '@/components/chatbot/ProductChatContext';

const getProductBySlug = cache(async (slug: string) => {
  await dbConnect();
  return getOrFetch(`product:detail:${slug}`, 300, () =>
    Product.findOne({ slug }).lean()
  );
});

// ISR: cache this page at the Vercel edge for 60 seconds.
// Product listing pages are fully public — auth/cart/wishlist state is managed client-side.
// This reduces TTFB from ~500ms (SSR cold start) to ~50ms (edge cache hit).
export const revalidate = 60;

// Known product types — used to distinguish /products/jewellery (listing)
// from /products/the-pink-diamond-ring (product detail)
const PRODUCT_TYPES = ['jewellery', 'couture', 'accessories', 'footwear', 'beauty', 'diffusion'];

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; size?: string; occasion?: string; sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // If it's a known product type, generate collection metadata
  if (PRODUCT_TYPES.includes(slug)) {
    await dbConnect();
    const taxonomy = await getOrFetch(`taxonomy:meta:${slug}`, 300, () => {
      import('@/models/Taxonomy');
      return import('mongoose').then(m => m.models.Taxonomy?.findOne({ slug }).select('seo').lean() || null);
    }) as any;
    return generateCategoryMetadata(slug, undefined, undefined, taxonomy?.seo);
  }

  // Otherwise treat as product slug — use server cache to avoid a second DB call
  // when the page render immediately follows (revalidate=60 means ISR handles staleness)
  const product = await getProductBySlug(slug) as any;
  if (!product) notFound();
  
  // Normalize the OG image to a proxy URL. Social crawlers (Facebook, Twitter, Google)
  // cannot follow our private GCS proxy without normalization, and a relative URL like
  // /api/media/... won't work in OG tags — generatePageMetadata prepends SITE_URL for us.
  const rawImageUrl = product.images && product.images.length > 0 ? product.images[0] : undefined;
  const imageUrl = rawImageUrl ? normalizeImageUrl(rawImageUrl) : undefined;
  
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
  const searchParamsAwaited = await searchParams;

  // ── Case 2: Product-type listing ─────────────────────────────────────────
  if (PRODUCT_TYPES.includes(slug)) {
    return <CollectionPageContent params={{ ...searchParamsAwaited, productType: slug }} />;
  }

  // ── Case 3: Individual product detail ────────────────────────────────────
  // Use server cache (5-min TTL) so navigating back to the same product
  // within a session doesn't trigger a second DB round-trip.
  const rawProduct = await getProductBySlug(slug);
  const product = JSON.parse(JSON.stringify(rawProduct));

  if (!product) {
    notFound();
  }

  // Helper to capitalize slug-formatted strings
  const capitalize = (s: string) =>
    s ? s.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

  // Combine main images and reference images
  const allImages: { url: string; alt: string }[] = [];

  // Normalize all image URLs from MongoDB to browser-safe proxy URLs.
  // Handles: legacy ?file= format, stale GCS CDN URLs, correct proxy URLs.
  // See src/lib/imageUrl.ts for full normalization logic.
  //
  // Alt text pattern:
  //   Main image[0]  → "{Product Name} — front view"
  //   Main image[1+] → "{Product Name} — {category} detail view {n}"
  //   Reference front/back/left/right → "{Product Name} — {angle} view"
  // This provides keyword-rich, unique alt text for every image without
  // keyword stuffing or generic "image 1" patterns.

  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: string, idx: number) => {
      const url = normalizeImageUrl(img);
      if (!url) return;
      let altText: string;
      if (idx === 0) {
        altText = `${product.name} — front view`;
      } else {
        const categoryLabel = product.subcategory
          ? capitalize(product.subcategory)
          : product.category
          ? capitalize(product.category)
          : '';
        altText = `${product.name}${categoryLabel ? ` ${categoryLabel}` : ''} — detail view ${idx + 1}`;
      }
      allImages.push({ url, alt: altText });
    });
  }

  if (product.referenceImages) {
    const addRef = (img: string | undefined, label: string) => {
      const url = normalizeImageUrl(img);
      if (url) allImages.push({ url, alt: `${product.name} — ${label}` });
    };
    addRef(product.referenceImages.front, 'front view');
    addRef(product.referenceImages.back, 'back view');
    addRef(product.referenceImages.left, 'left side view');
    addRef(product.referenceImages.right, 'right side view');
  }

  if (allImages.length > 0) {
    // next/image priority=true handles the preload injection automatically 
    // based on the correct srcset sizes. We don't need manual ReactDOM.preload here.
  }

  const containerStyle: React.CSSProperties = {
    padding: '3rem 4rem 0 4rem',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    fontFamily: '"Jost", "Inter", sans-serif',
  };

  const detailsContainerStyle: React.CSSProperties = {
    position: 'sticky',
    top: '8rem',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 10rem)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const productSchema = generateProductSchema(product, allImages);

  // Build breadcrumb items — used for both JSON-LD and visible HTML nav
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    {
      label: product.productType ? capitalize(product.productType) : 'Products',
      href: `/products/${product.productType || ''}`,
    },
  ];
  if (product.category) {
    breadcrumbItems.push({
      label: capitalize(product.category),
      href: `/products/${product.productType}/${product.category}`,
    });
  }
  breadcrumbItems.push({ label: product.name, href: `/products/${product.slug}` });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  // Build crawlable product attributes — only include attributes that exist,
  // never invent or assume data. These are rendered as HTML text for crawlers.
  const fabric = product.details?.composition || product.details?.commodityName;
  const occasion = product.occasion;
  const collectionName = product.collectionName;

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
      <style>{`
        .details-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .details-scroll-container {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      <main style={containerStyle} className="mobile-flex-col mobile-px-4 mobile-pt-4 mobile-pb-4">
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
          <div style={detailsContainerStyle} className="details-scroll-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '-0.5rem' }}>
              {product.category ? (
                <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {product.category}
                </div>
              ) : <div />}

              <ProductActions product={product} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: '#222', lineHeight: '1.4', letterSpacing: '0.02em' }}>
              {product.name}
            </h1>

            <div style={{ lineHeight: '1.5', color: '#777', fontSize: '0.85rem' }}>
              {product.description}
            </div>

            {product.productType?.toLowerCase() !== 'jewellery' && (
              <ProductPriceDisplay price={product.price} />
            )}

            {product.colors && product.colors.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: '#444', marginTop: '0.25rem' }}>
                Colour: {product.colors.join(', ')}
              </div>
            )}

            {/* ── Crawlable product attributes ─────────────────────────────────
                Only rendered when the data actually exists in MongoDB.
                These provide meaningful context to search engines about the
                product without keyword stuffing or hidden text.
            ────────────────────────────────────────────────────────────────── */}
            {(fabric || occasion || collectionName) && (
              <dl
                style={{
                  fontSize: '0.8rem',
                  color: '#888',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  margin: 0,
                  padding: '0.5rem 0',
                  borderTop: '1px solid #f0f0f0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                {fabric && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <dt style={{ textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '80px' }}>Fabric</dt>
                    <dd style={{ margin: 0 }}>{fabric}</dd>
                  </div>
                )}
                {occasion && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <dt style={{ textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '80px' }}>Occasion</dt>
                    <dd style={{ margin: 0 }}>{capitalize(occasion)}</dd>
                  </div>
                )}
                {collectionName && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <dt style={{ textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '80px' }}>Collection</dt>
                    <dd style={{ margin: 0 }}>
                      {/* Link to the collection page for internal linking */}
                      <a
                        href={`/products/${product.productType}/${collectionName}`}
                        style={{ color: '#888', textDecoration: 'underline', textDecorationColor: '#ddd' }}
                      >
                        {capitalize(collectionName)}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            )}

            <ProductClientActions
              product={{
                slug: product.slug,
                name: product.name,
                price: product.price,
                images: product.images,
                colors: product.colors,
                sizes: product.sizes,
                productType: product.productType,
                category: product.category,
                subcategory: product.subcategory
              }}
            />

            <Suspense fallback={<div style={{ height: '80px' }} />}>
              <ProductTrustBadges />
            </Suspense>

            <ProductDetailsAccordionWrapper details={product.details} productType={product.productType} category={product.category} />
          </div>
        </div>
      </main>

      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <Suspense fallback={<div style={{ height: '200px' }} />}>
          <ProductReviews productId={product._id.toString()} deferFetch={true} />
        </Suspense>
      </div>

      {/* ── Related Products ──────────────────────────────────────────────────
          Server-rendered section with crawlable <a> links. Fetches products
          from same subcategory so Google can discover the full catalogue via
          internal links from every product page.
      ─────────────────────────────────────────────────────────────────────── */}
      <Suspense fallback={<div style={{ height: '400px' }} />}>
        <RelatedProducts
          currentProductId={product._id.toString()}
          subcategory={product.subcategory || ''}
          productType={product.productType || ''}
          category={product.category}
        />
      </Suspense>

      <ProductChatContext context={{
        slug: product.slug,
        name: product.name,
        category: product.category,
        productType: product.productType,
        price: product.price,
        colors: product.colors || [],
        sizes: product.sizes || [],
      }} />
    </>
  );
}

