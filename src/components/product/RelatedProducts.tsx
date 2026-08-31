import React from 'react';
import Link from 'next/link';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import ProductCard from '@/components/product/ProductCard';

interface RelatedProductsProps {
  currentProductId: string;
  subcategory: string;
  productType: string;
  category?: string;
  /** Optional heading override. Defaults to "You May Also Like" */
  heading?: string;
}

/**
 * RelatedProducts — Server Component
 *
 * Fetches up to 4 products from the same subcategory (or productType as
 * fallback) and renders them as a crawlable section with real <a> links.
 *
 * SEO benefit:
 *   - Creates internal links from every product page to related products,
 *     which helps Googlebot discover and crawl the entire catalogue.
 *   - ProductCard already uses Next.js <Link> (real <a> tags), so these
 *     links are crawlable without any JavaScript.
 *
 * Design note:
 *   - Uses the existing ProductCard component and existing grid layout CSS.
 *   - Does NOT use client-side fetching — all data is server-rendered into HTML.
 */
export default async function RelatedProducts({
  currentProductId,
  subcategory,
  productType,
  category,
  heading = 'You May Also Like',
}: RelatedProductsProps) {
  try {
    await dbConnect();

    // Build query: same subcategory, exclude current product.
    // Fall back to same productType + category if subcategory yields nothing.
    let relatedProducts: any[] = [];

    if (subcategory) {
      relatedProducts = await Product.find({
        subcategory,
        _id: { $ne: currentProductId },
        'seo.noIndex': { $ne: true },
      })
        .select('_id name slug price images referenceImages category productType')
        .limit(4)
        .lean();
    }

    // Fallback: same productType + category if subcategory didn't return enough
    if (relatedProducts.length < 2 && productType) {
      const fallbackQuery: any = {
        productType,
        _id: { $ne: currentProductId },
        'seo.noIndex': { $ne: true },
      };
      if (category) fallbackQuery.category = category;

      relatedProducts = await Product.find(fallbackQuery)
        .select('_id name slug price images referenceImages category productType')
        .limit(4)
        .lean();
    }

    if (!relatedProducts || relatedProducts.length === 0) {
      return null; // Don't render the section if nothing related found
    }

    // Serialize Mongoose documents for client components
    const products = JSON.parse(JSON.stringify(relatedProducts));

    // Determine a contextual sub-heading
    const capitalize = (s: string) =>
      s ? s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
    const contextLabel = subcategory ? capitalize(subcategory) : capitalize(productType || '');

    return (
      <section
        style={{
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '4rem 4rem 2rem',
        }}
        className="mobile-px-4"
        aria-label={heading}
      >
        {/* Section heading */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '2rem',
            borderTop: '1px solid #eaeaea',
            paddingTop: '3rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#111',
              margin: 0,
            }}
          >
            {heading}
          </h2>
          {contextLabel && (
            <p
              style={{
                fontSize: '0.8rem',
                color: '#888',
                margin: 0,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              More {contextLabel} Pieces
            </p>
          )}
        </div>

        {/* Product grid — uses existing ProductCard which has crawlable <a> links */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem',
          }}
          className="mobile-grid-2"
        >
          {products.map((product: any, index: number) => (
            <ProductCard
              key={product._id}
              product={product}
              variant="default"
              priority={false}
            />
          ))}
        </div>
      </section>
    );
  } catch (err) {
    console.error('[RelatedProducts] Error fetching related products:', err);
    return null; // Fail silently — never break the product page
  }
}
