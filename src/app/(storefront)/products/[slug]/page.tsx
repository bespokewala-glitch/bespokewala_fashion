import React from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import ProductGallery from '@/components/product/ProductGallery';
import ProductActions from '@/components/product/ProductActions';
import ProductClientActions from '@/components/product/ProductClientActions';
import ProductDetailsAccordion from '@/components/product/ProductDetailsAccordion';
import { notFound, redirect } from 'next/navigation';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { Metadata } from 'next';
import { normalizeImageUrl } from '@/lib/imageUrl';

export const revalidate = 60;

// Known product types — used to distinguish /products/jewellery (listing)
// from /products/the-pink-diamond-ring (product detail)
const PRODUCT_TYPES = ['jewellery', 'couture', 'accessories', 'footwear', 'beauty', 'diffusion'];

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';

  // If it's a known product type, generate collection metadata
  if (PRODUCT_TYPES.includes(slug)) {
    const title = slug.charAt(0).toUpperCase() + slug.slice(1);
    const url = `${siteUrl}/products/${slug}`;
    return {
      title: `${title} | Bespokewala`,
      description: `Shop our luxury ${title.toLowerCase()} collection at Bespokewala.`,
      alternates: {
        canonical: url
      },
      openGraph: {
        title: `${title} | Bespokewala`,
        description: `Shop our luxury ${title.toLowerCase()} collection at Bespokewala.`,
        url,
        siteName: 'Bespokewala',
        type: 'website'
      }
    };
  }

  // Otherwise treat as product slug
  await dbConnect();
  const product = await Product.findOne({ slug }).select('name description images').lean() as any;
  if (!product) return { title: 'Product Not Found | Bespokewala' };
  
  const url = `${siteUrl}/products/${slug}`;
  const imageUrl = product.images && product.images.length > 0 ? normalizeImageUrl(product.images[0]) : undefined;

  return {
    title: `${product.name} | Bespokewala`,
    description: product.description?.slice(0, 160),
    alternates: {
      canonical: url
    },
    openGraph: {
      title: `${product.name} | Bespokewala`,
      description: product.description?.slice(0, 160),
      url,
      siteName: 'Bespokewala',
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800 }] : undefined,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Bespokewala`,
      description: product.description?.slice(0, 160),
    }
  };
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
export default async function ProductsSlugPage({ params }: Props) {
  const { slug } = await params;
  console.log("====== MATCHED SLUG PAGE ======", { slug });

  // ── Case 1: Couture page is Homepage ─────────────────────────────────────
  if (slug === 'couture') {
    console.log("====== Redirecting to / ======");
    redirect('/');
  }

  // ── Case 2: Product-type listing ─────────────────────────────────────────
  if (PRODUCT_TYPES.includes(slug)) {
    return <CollectionPageContent params={{ productType: slug }} />;
  }

  // ── Case 2: Individual product detail ────────────────────────────────────
  await dbConnect();
  const rawProduct = await Product.findOne({ slug }).lean();
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
    addRef(product.referenceImages.back,  'Back View');
    addRef(product.referenceImages.left,  'Left View');
    addRef(product.referenceImages.right, 'Right View');
  }

  const containerStyle: React.CSSProperties = {
    padding: '8rem 4rem 4rem 4rem',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '6rem',
    minHeight: '80vh',
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';
  
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": allImages.map(img => img.url),
    "description": product.description,
    "sku": product.slug,
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <main style={containerStyle} className="mobile-grid-1 mobile-px-4 mobile-pt-20 mobile-pb-4">
        <div>
          <ProductGallery images={allImages} />
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

            <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#000', marginTop: '0.5rem' }}>
              MRP: ₹{product.price.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '-1.25rem' }}>
              Price included of all taxes
            </div>

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

            <ProductDetailsAccordion details={product.details} />
          </div>
        </div>
      </main>
          </>
  );
}
