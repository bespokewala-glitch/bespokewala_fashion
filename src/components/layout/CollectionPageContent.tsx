import React from 'react';
import Link from 'next/link';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import HeroCampaign from '@/models/HeroCampaign';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import InfiniteProductGrid from '@/components/product/InfiniteProductGrid';
import HeroSection from '@/components/home/HeroSection';
import HomepageSection from '@/models/HomepageSection';
import CuratedGrid from '@/components/home/CuratedGrid';
import FeatureBanner from '@/components/home/FeatureBanner';
import SplitShowcase from '@/components/home/SplitShowcase';
import CoutureProcess from '@/components/home/CoutureProcess';
import { getOrFetch } from '@/lib/serverCache';
import { generateBreadcrumbSchema, generateItemListSchema, generateCategoryHeading } from '@/lib/seo';

export interface CollectionPageParams {
  productType?: string;
  category?: string;
  subcategory?: string;
  collectionName?: string;
  occasion?: string;
  page?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  colors?: string;
  sort?: string;
}

/** Shared data-fetching and rendering logic for all collection / category pages */
export async function CollectionPageContent({ params }: { params: CollectionPageParams }) {
  await dbConnect();

  const { productType, category, subcategory, collectionName, occasion, page, q, minPrice, maxPrice, colors, sort } = params;
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
  if (q) {
    const words = q.trim().split(/\s+/).filter(Boolean);
    const regexPattern = words.map(w => `(?=.*${w})`).join('');
    const regexString = `^${regexPattern}`;

    (productQuery as any).$or = [
      { name: { $regex: regexString, $options: 'i' } },
      { category: { $regex: regexString, $options: 'i' } },
      { subcategory: { $regex: regexString, $options: 'i' } },
      { collectionName: { $regex: regexString, $options: 'i' } }
    ];
  }

  if (minPrice || maxPrice) {
    (productQuery as any).price = {};
    if (minPrice) (productQuery as any).price.$gte = Number(minPrice);
    if (maxPrice) (productQuery as any).price.$lte = Number(maxPrice);
  }

  if (colors) {
    (productQuery as any).colors = colors;
  }

  let sortQuery: any = { createdAt: -1 };
  if (sort === 'price_asc') sortQuery = { price: 1 };
  if (sort === 'price_desc') sortQuery = { price: -1 };
  if (sort === 'newest') sortQuery = { createdAt: -1 };
  if (sort === 'popular') sortQuery = { isFeatured: -1, createdAt: -1 };

  const pageId = subcategory || collectionName || category || productType || 'all-products';

  const productCacheKey = `products:${JSON.stringify(productQuery)}:p${currentPage}`;
  const totalProductsCacheKey = `products:total:${JSON.stringify(productQuery)}`;
  const sectionCacheKey = `sections:${pageId}`;

  const [rawProducts, totalProducts, hpSections, rawTaxonomy, rawFilters, rawDynamicFilters] = await Promise.all([
    getOrFetch(productCacheKey, 60, () =>
      Product.find(productQuery)
        .select('_id name slug price originalPrice images referenceImages productType category subcategory collectionName isFeatured inventoryCount')
        .sort(sortQuery)
        .skip(skip)
        .limit(productsPerPage)
        .lean()
    ),
    getOrFetch(totalProductsCacheKey, 60, () =>
      Product.countDocuments(productQuery)
    ),
    getOrFetch(sectionCacheKey, 60, () =>
      HomepageSection.find({ page: pageId }).lean()
    ),
    getOrFetch(`taxonomy:${pageId}`, 60, () => {
      import('@/models/Taxonomy');
      return import('mongoose').then(m => m.models.Taxonomy?.findOne({ slug: pageId }).select('seo').lean() || null);
    }),
    // Fetch distinct child categories/subcategories for the filter bar
    getOrFetch(`filters:${productCacheKey}`, 60, async () => {
      if (subcategory || collectionName || occasion) return []; // Too deep
      if (category) {
        return Product.distinct('subcategory', { productType, category });
      }
      if (productType) {
        return Product.distinct('category', { productType });
      }
      return [];
    }),
    getOrFetch(`dynamicFilters:${JSON.stringify(productQuery)}`, 60, async () => {
      const [colors, sizes, categories, productTypes] = await Promise.all([
        Product.distinct('colors', productQuery),
        Product.distinct('sizes', productQuery),
        Product.distinct('category', productQuery),
        Product.distinct('productType', productQuery)
      ]);
      return { colors, sizes, categories, productTypes };
    }),
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

  const filterList = Array.isArray(rawFilters) ? rawFilters.filter(Boolean) : [];
  const dynamicFilters = rawDynamicFilters as { colors: string[], sizes: string[], categories: string[], productTypes: string[] };

  const sectionMap: Record<string, any> = {};
  if (hpSections && Array.isArray(hpSections)) {
    hpSections.forEach((s: any) => {
      sectionMap[s.sectionType] = s.content;
    });
  }

  /**
   * Use reusable title logic to produce meaningful H1s 
   * (e.g. "Luxury Women's Lehengas", "Luxury Footwear Collection")
   */
  const generatedTitle = generateCategoryHeading(productType, category, subcategory, collectionName);
  const taxonomySeo = (rawTaxonomy as any)?.seo || {};
  const pageTitle = taxonomySeo.seoH1 || generatedTitle;
  const seoIntro = taxonomySeo.seoIntro;
  const seoContent = taxonomySeo.seoContent;

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
    maxWidth: '1600px',
    margin: '0 auto',
    minHeight: '80vh',
  };

  // ... (keeping other variables unchanged)
  const isTopLevelDepartment = Boolean(
    productType &&
    !category &&
    !subcategory &&
    !collectionName &&
    !occasion &&
    !q &&
    !minPrice &&
    !maxPrice &&
    !colors
  );



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
      <main style={containerStyle} className="desktop-px-8 mobile-px-4 desktop-pt-no-hero mobile-content-top-pad">
        {/* Curated Sections */}
        {/* We use desktop-mx-negative to apply the negative margins ONLY on desktop, avoiding mobile breakages */}
        {(sectionMap.CuratedGrid || sectionMap.FeatureBanner || sectionMap.SplitShowcase || sectionMap.CoutureProcess) && (
          <div className="desktop-mx-negative mobile-m-0">
            {sectionMap.CuratedGrid && <CuratedGrid data={sectionMap.CuratedGrid} />}
            {sectionMap.FeatureBanner && <FeatureBanner data={sectionMap.FeatureBanner} />}
            {sectionMap.SplitShowcase && <SplitShowcase data={sectionMap.SplitShowcase} />}
            {sectionMap.CoutureProcess && <CoutureProcess data={sectionMap.CoutureProcess} />}
          </div>
        )}


        {/* Page heading */}
        <div className="page-heading-container">
          <h1 className="h1">{pageTitle}</h1>
          {seoIntro ? (
            <div className="seo-intro" dangerouslySetInnerHTML={{ __html: seoIntro }} />
          ) : (
            <p className="subtitle" style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Discover our {pageTitle.toLowerCase()}.
            </p>
          )}
        </div>

        {/* Product grid — shown when a category is selected, OR for top-level departments */}
        {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p className="text-body">No products found in this category.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <ProductFilters
                  totalCount={totalProducts}
                  availableSubcategories={filterList}
                  dynamicFilters={dynamicFilters}
                />

                <div style={{ width: '100%' }}>
                  <InfiniteProductGrid 
                    key={JSON.stringify(params)}
                    initialProducts={products}
                    totalProducts={totalProducts}
                    queryParams={params as Record<string, string | undefined>}
                  />
                </div>
              </div>
            </>
          )
        }

        {seoContent && (
          <div className="seo-content" style={{ marginTop: '6rem', paddingTop: '4rem', borderTop: '1px solid #eaeaea', color: '#555', lineHeight: '1.8', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: seoContent }} />
        )}
      </main>
    </>
  );
}
