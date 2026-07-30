import React from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGallery from '@/components/product/ProductGallery';
import ProductActions from '@/components/product/ProductActions';
import ProductClientActions from '@/components/product/ProductClientActions';
import ProductDetailsAccordion from '@/components/product/ProductDetailsAccordion';
import { notFound, redirect } from 'next/navigation';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { Metadata } from 'next';

export const revalidate = 60;

// Known product types — used to distinguish /products/jewellery (listing)
// from /products/the-pink-diamond-ring (product detail)
const PRODUCT_TYPES = ['jewellery', 'couture', 'accessories', 'beauty', 'diffusion'];

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // If it's a known product type, generate collection metadata
  if (PRODUCT_TYPES.includes(slug)) {
    const title = slug.charAt(0).toUpperCase() + slug.slice(1);
    return {
      title: `${title} | Bespoken`,
      description: `Shop our luxury ${title.toLowerCase()} collection at Bespoken.`,
    };
  }

  // Otherwise treat as product slug
  await dbConnect();
  const product = await Product.findOne({ slug }).select('name description').lean() as any;
  if (!product) return { title: 'Product Not Found | Bespoken' };
  return {
    title: `${product.name} | Bespoken`,
    description: product.description?.slice(0, 160),
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

  // ── Case 1: Couture page is Homepage ─────────────────────────────────────
  if (slug === 'couture') {
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

  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: string, idx: number) => {
      allImages.push({ url: img, alt: `${product.name} - View ${idx + 1}` });
    });
  }

  if (product.referenceImages) {
    if (product.referenceImages.front) allImages.push({ url: product.referenceImages.front, alt: `${product.name} - Front View` });
    if (product.referenceImages.back)  allImages.push({ url: product.referenceImages.back,  alt: `${product.name} - Back View` });
    if (product.referenceImages.left)  allImages.push({ url: product.referenceImages.left,  alt: `${product.name} - Left View` });
    if (product.referenceImages.right) allImages.push({ url: product.referenceImages.right, alt: `${product.name} - Right View` });
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

  return (
    <>
      <Header />
      <main style={containerStyle}>
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
      <Footer />
    </>
  );
}
