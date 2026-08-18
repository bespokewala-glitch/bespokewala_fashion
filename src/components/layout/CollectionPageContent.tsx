import React from 'react';
import Link from 'next/link';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import HeroCampaign from '@/models/HeroCampaign';

import ProductCard from '@/components/product/ProductCard';
import HeroSection from '@/components/home/HeroSection';
import HomepageSection from '@/models/HomepageSection';
import CuratedGrid from '@/components/home/CuratedGrid';
import FeatureBanner from '@/components/home/FeatureBanner';
import SplitShowcase from '@/components/home/SplitShowcase';
import CoutureProcess from '@/components/home/CoutureProcess';
import { getOrFetch } from '@/lib/serverCache';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/lib/seo';

export interface CollectionPageParams {
  productType?: string;
  category?: string;
  subcategory?: string;
  collectionName?: string;
  occasion?: string;
  page?: string;
}

/** Shared data-fetching and rendering logic for all collection / category pages */
export async function CollectionPageContent({ params }: { params: CollectionPageParams }) {
  await dbConnect();

  const { productType, category, subcategory, collectionName, occasion, page } = params;
  const currentPage = parseInt(page || '1', 10) || 1;
  const productsPerPage = 24;
  const skip = (currentPage - 1) * productsPerPage;

  // Build MongoDB query from whatever filters are active
  const productQuery: Record<string, string> = {};
  if (productType) productQuery.productType = productType;
  if (category) productQuery.category = category;
  if (subcategory) productQuery.subcategory = subcategory;
  if (collectionName) productQuery.collectionName = collectionName;
  if (occasion) productQuery.occasion = occasion;

  // Campaign hero — only shown on top-level pages (productType or category).
  // Subcategory and collectionName pages skip the hero and go straight to products.
  const showHero = !subcategory && !collectionName;

  let campaignCategory = 'general';
  if (productType) campaignCategory = productType;
  else if (category && !['womens', 'mens', 'new-arrivals'].includes(category)) campaignCategory = category;

  const pageId = subcategory || collectionName || category || productType || 'all-products';

  const productCacheKey = `products:${JSON.stringify(productQuery)}:p${currentPage}`;
  const totalProductsCacheKey = `products:total:${JSON.stringify(productQuery)}`;
  const sectionCacheKey = `sections:${pageId}`;

  const [rawProducts, totalProducts, rawCampaigns, hpSections] = await Promise.all([
    getOrFetch(productCacheKey, 60, () =>
      Product.find(productQuery)
        .select('_id name slug price originalPrice images referenceImages productType category subcategory collectionName isFeatured inventoryCount')
        .skip(skip)
        .limit(productsPerPage)
        .lean()
    ),
    getOrFetch(totalProductsCacheKey, 60, () =>
      Product.countDocuments(productQuery)
    ),
    // Only fetch campaigns for top-level pages
    showHero
      ? getOrFetch(`campaigns:${campaignCategory}`, 60, () =>
          HeroCampaign.find({ category: campaignCategory })
            .select('_id title subtitle videoUrl linkUrl mediaType order')
            .sort({ order: 1 })
            .lean()
        )
      : Promise.resolve([]),
    getOrFetch(sectionCacheKey, 60, () =>
      HomepageSection.find({ page: pageId }).lean()
    ),
  ]);

  const products = (rawProducts as any[]).map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    price: p.price,
    originalPrice: p.originalPrice,
    images: p.images,
    referenceImages: p.referenceImages,
    productType: p.productType,
    category: p.category,
    subcategory: p.subcategory,
    collectionName: p.collectionName,
    isFeatured: p.isFeatured,
    inventoryCount: p.inventoryCount,
  }));

  const campaigns = (rawCampaigns as any[]).map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    subtitle: c.subtitle,
    videoUrl: c.videoUrl,
    linkUrl: c.linkUrl,
    mediaType: c.mediaType,
  }));

  const sectionMap: Record<string, any> = {};
  (hpSections as any[]).forEach((s: any) => {
    sectionMap[s.sectionType] = s.content;
  });

  /**
   * Page title priority: subcategory > collectionName > category > productType > 'All Products'
   * e.g. subcategory "ring" → "Ring"
   */
  const rawTitle = subcategory || collectionName || category || productType || 'All Products';
  const pageTitle = rawTitle
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  /** Breadcrumb trail so users know where they are */
  const breadcrumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }];
  if (productType) {
    const pt = productType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({ label: pt, href: `/products?productType=${productType}` });
  }
  if (category) {
    const cat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({
      label: cat,
      href: productType
        ? `/products/${productType}/${category}`
        : `/products?category=${category}`,
    });
  }
  if (subcategory) {
    const sub = subcategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({
      label: sub,
      href: productType && category
        ? `/products/${productType}/${category}/${subcategory}`
        : `/products?subcategory=${subcategory}`,
    });
  }

  const containerStyle: React.CSSProperties = {
    // Only apply bottom padding and horizontal padding inline. 
    // Top padding is moved to CSS so we can easily override it on mobile without specificity wars.
    paddingBottom: '4rem',
    paddingLeft: '2rem',
    paddingRight: '2rem',
    maxWidth: '1600px',
    margin: '0 auto',
    minHeight: '80vh',
  };

  // ... (keeping other variables unchanged)
  const isTopLevelDepartment = Boolean(productType && !category && !subcategory && !collectionName && !occasion);

  const cmsGridItems = sectionMap.CuratedGrid?.items;
  const departmentCollections = (cmsGridItems && cmsGridItems.some((it: any) => it.image || it.title))
    ? cmsGridItems.map((item: any, idx: number) => ({
        title: item.title || ['Signature Collection', 'Diamond Collection', 'Menswear Collection', 'New Arrivals'][idx] || 'Collection',
        href: item.link || ['/products/jewellery/signature-collection', '/products/jewellery/diamond-collection', '/products/jewellery/menswear-collection', '/products/jewellery/new-arrivals'][idx] || '/products/jewellery',
        subtitle: item.subtitle || 'Explore collection',
        image: item.image || ''
      }))
    : productType === 'jewellery' ? [
        { title: 'Signature Collection', href: '/products/jewellery/signature-collection', subtitle: 'Timeless luxury', image: '' },
        { title: 'Diamond Collection', href: '/products/jewellery/diamond-collection', subtitle: 'Exquisite brilliance', image: '' },
        { title: 'Menswear Collection', href: '/products/jewellery/menswear-collection', subtitle: 'Refined elegance', image: '' },
        { title: 'New Arrivals', href: '/products/jewellery/new-arrivals', subtitle: 'Latest creations', image: '' },
      ] : [];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  
  // Construct canonical path for ItemList
  let canonicalPath = '/products';
  if (productType) canonicalPath += `/${productType}`;
  if (category) canonicalPath += `/${category}`;
  if (subcategory) canonicalPath += `/${subcategory}`;
  else if (collectionName) canonicalPath += `/${collectionName}`; // Fallback if it's a collection page

  const itemListSchema = generateItemListSchema(products, canonicalPath);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      {showHero && campaigns.length > 0 && <HeroSection campaigns={campaigns} />}
      <main style={containerStyle} className="mobile-px-4 desktop-pt-hero">
        {/* Curated Sections */}
        {/* We use desktop-mx-negative to apply the negative margins ONLY on desktop, avoiding mobile breakages */}
        <div className="desktop-mx-negative mobile-m-0">
          {sectionMap.CuratedGrid && !isTopLevelDepartment && <CuratedGrid data={sectionMap.CuratedGrid} />}
          {sectionMap.FeatureBanner && <FeatureBanner data={sectionMap.FeatureBanner} />}
          {sectionMap.SplitShowcase && <SplitShowcase data={sectionMap.SplitShowcase} />}
          {sectionMap.CoutureProcess && <CoutureProcess data={sectionMap.CoutureProcess} />}
        </div>


        {/* Page heading */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="h1">{pageTitle}</h1>
          <p className="subtitle" style={{ marginTop: '1rem' }}>
            Discover our luxury {pageTitle.toLowerCase()} collection.
          </p>
        </div>

        {/* Top-Level Department Navigation Cards (if top-level department like Jewellery) */}
        {isTopLevelDepartment ? (
          departmentCollections.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              marginTop: '2rem',
              marginBottom: '4rem',
            }} className="mobile-carousel">
              {departmentCollections.map((col: any) => (
                <Link
                  key={col.href}
                  href={col.href}
                  draggable={false}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    minHeight: '340px',
                    padding: '3rem 2rem',
                    backgroundColor: col.image ? '#000' : '#fafafa',
                    backgroundImage: col.image ? `url(${col.image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid #eaeaea',
                    textDecoration: 'none',
                    color: col.image ? '#ffffff' : '#1c1c1c',
                    transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                    textAlign: 'center',
                    overflow: 'hidden',
                    userSelect: 'none',
                  }}
                  className="department-card-hover"
                >
                  {col.image && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 70%)',
                      zIndex: 1,
                    }} />
                  )}
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem',
                      color: col.image ? '#ffffff' : '#1c1c1c'
                    }}>
                      {col.title}
                    </h3>
                    <span style={{
                      fontSize: '0.85rem',
                      color: col.image ? 'rgba(255,255,255,0.8)' : '#888',
                      fontStyle: 'italic',
                      letterSpacing: '0.05em'
                    }}>
                      {col.subtitle}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          /* Product grid — shown ONLY when a category, subcategory, collection, or occasion is selected */
          products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p className="text-body">No products found in this category.</p>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product: any, index: number) => (
                  <ProductCard key={product._id} product={product} priority={index < 4} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalProducts > productsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '4rem' }}>
                  {currentPage > 1 && (
                    <Link 
                      href={`?${new URLSearchParams(
                        Object.entries({ ...params, page: (currentPage - 1).toString() })
                          .filter(([_, v]) => v !== undefined && v !== null) as [string, string][]
                      ).toString()}`}
                      className="btn-secondary"
                    >
                      Previous
                    </Link>
                  )}
                  {currentPage * productsPerPage < totalProducts && (
                    <Link 
                      href={`?${new URLSearchParams(
                        Object.entries({ ...params, page: (currentPage + 1).toString() })
                          .filter(([_, v]) => v !== undefined && v !== null) as [string, string][]
                      ).toString()}`}
                      className="btn-secondary"
                    >
                      Next Page
                    </Link>
                  )}
                </div>
              )}
            </>
          )
        )}
      </main>
    </>
  );
}
