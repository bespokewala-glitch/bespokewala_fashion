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
import JewelleryProcess from '@/components/home/JewelleryProcess';
import SeoAccordion from '@/components/ui/SeoAccordion';
import { getOrFetch } from '@/lib/serverCache';
import { generateBreadcrumbSchema, generateItemListSchema, generateCategoryHeading } from '@/lib/seo';

export interface CollectionPageParams {
  productType?: string;
  category?: string;
  subcategory?: string;
  collectionName?: string;
  occasion?: string;
  slug2?: string;
  slug3?: string;
  page?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  colors?: string;
  size?: string;
  sort?: string;
}

/** Shared data-fetching and rendering logic for all collection / category pages */
export async function CollectionPageContent({ params }: { params: CollectionPageParams }) {
  await dbConnect();

  const { productType, category, subcategory, collectionName, occasion, slug2, slug3, page, q, minPrice, maxPrice, colors, size, sort } = params;
  const currentPage = parseInt(page || '1', 10) || 1;
  const productsPerPage = 24;
  const skip = (currentPage - 1) * productsPerPage;

  // Build MongoDB query from whatever filters are active
  const productQuery: Record<string, any> = {};
  const buildInQuery = (val: string) => {
    const arr = val.split(',').map(v => v.trim()).filter(Boolean);
    if (arr.length === 0) return undefined;
    // Case-insensitive match for each item
    return { $in: arr.map(item => new RegExp(`^${item.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')) };
  };

  const KNOWN_OCCASIONS = ['bridal', 'cocktail', 'mehendi', 'reception', 'sangeet', 'pooja', 'festive', 'groom', 'mehandi', 'party', 'wedding'];

  if (productType) (productQuery as any).productType = buildInQuery(productType);

  if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'all-products' && category.toLowerCase() !== 'all-collections') {
    const isOccasion = KNOWN_OCCASIONS.includes(category.toLowerCase());
    const isCollection = category.toLowerCase().includes('collection');
    if (isOccasion) {
      (productQuery as any).occasion = buildInQuery(category);
    } else if (isCollection) {
      (productQuery as any).collectionName = buildInQuery(category);
    } else {
      (productQuery as any).category = buildInQuery(category);
    }
  }

  if (subcategory && subcategory.toLowerCase() !== 'all' && subcategory.toLowerCase() !== 'all-products' && subcategory.toLowerCase() !== 'all-collections') {
    const isOccasion = KNOWN_OCCASIONS.includes(subcategory.toLowerCase());
    const isCollection = subcategory.toLowerCase().includes('collection');
    if (isOccasion) {
      (productQuery as any).occasion = buildInQuery(subcategory);
    } else if (isCollection) {
      (productQuery as any).collectionName = buildInQuery(subcategory);
    } else {
      (productQuery as any).subcategory = buildInQuery(subcategory);
    }
  }

  if (collectionName) (productQuery as any).collectionName = buildInQuery(collectionName);
  if (occasion) (productQuery as any).occasion = buildInQuery(occasion);
  
  if (slug2) {
    const isAll = slug2.toLowerCase() === 'all' || slug2.toLowerCase() === 'all-products' || slug2.toLowerCase() === 'all-collections';
    const slug2Query = !isAll ? buildInQuery(slug2) : undefined;
    if (slug2Query) {
      if (!(productQuery as any).$and) {
        (productQuery as any).$and = [];
      }
      // When slug3 is also present (3-segment URL: /products/[type]/[category]/[subcategory]),
      // slug2 unambiguously means `category`. When slug3 is absent (2-segment URL:
      // /products/[type]/[collection-or-category]), we keep the broad $or so that
      // collection pages like /products/couture/bridal-collection still work.
      if (slug3) {
        // 3-segment URL: slug2 = category
        (productQuery as any).$and.push({ category: slug2Query });
      } else {
        // 2-segment URL: ambiguous — could be category, collectionName, or occasion
        (productQuery as any).$and.push({
          $or: [
            { category: slug2Query },
            { collectionName: slug2Query },
            { occasion: slug2Query }
          ]
        });
      }
    }
  }

  if (slug3) {
    const isAll = slug3.toLowerCase() === 'all' || slug3.toLowerCase() === 'all-products' || slug3.toLowerCase() === 'all-collections';
    const slug3Query = !isAll ? buildInQuery(slug3) : undefined;
    if (slug3Query) {
      if (!(productQuery as any).$and) {
        (productQuery as any).$and = [];
      }
      
      const KNOWN_OCCASIONS = [
        'bridal', 'cocktail', 'mehendi', 'reception', 'sangeet', 'pooja',
        'festive', 'groom', 'mehandi', 'party', 'wedding'
      ];
      
      const isOccasion = KNOWN_OCCASIONS.includes(slug3.toLowerCase());
      const isCollection = slug3.toLowerCase().includes('collection');

      if (isOccasion) {
        (productQuery as any).$and.push({ occasion: slug3Query });
      } else if (isCollection) {
        (productQuery as any).$and.push({ collectionName: slug3Query });
      } else {
        (productQuery as any).$and.push({ subcategory: slug3Query });
      }
    }
  }
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
    (productQuery as any).colors = buildInQuery(colors);
  }

  if (size) {
    const sizeArr = size.split(',').map(s => s.trim()).filter(Boolean);
    if (sizeArr.length > 0) {
      // Sizes are usually exactly matched (e.g., 'L', 'XL') but making it case-insensitive is safer
      (productQuery as any).sizes = { $in: sizeArr.map(s => new RegExp(`^${s}$`, 'i')) };
    }
  }

  let sortQuery: any = { createdAt: -1 };
  if (sort === 'price_asc') sortQuery = { price: 1 };
  if (sort === 'price_desc') sortQuery = { price: -1 };
  if (sort === 'newest') sortQuery = { createdAt: -1 };
  if (sort === 'popular') sortQuery = { isFeatured: -1, createdAt: -1 };

  const pageId = subcategory || slug3 || collectionName || category || slug2 || productType || 'all-products';

  // Construct canonical path for ItemList and Route-Specific SEO
  let canonicalPath = '/products';
  if (productType) canonicalPath += `/${productType}`;
  if (category) canonicalPath += `/${category}`;
  else if (slug2) canonicalPath += `/${slug2}`;
  if (subcategory) canonicalPath += `/${subcategory}`;
  else if (slug3) canonicalPath += `/${slug3}`; // Ensure slug3 (e.g. cocktail) is appended if subcategory is undefined
  else if (collectionName) canonicalPath += `/${collectionName}`; // Fallback if it's a collection page


  const productCacheKey = `products:${JSON.stringify(params)}:p${currentPage}`;
  const totalProductsCacheKey = `products:total:${JSON.stringify(params)}`;
  const sectionCacheKey = `sections:${pageId}`;

  const [rawProducts, totalProducts, hpSections, rawCampaigns, rawTaxonomy, rawFilters, rawDynamicFilters] = await Promise.all([
    getOrFetch(productCacheKey, 300, () =>
      Product.find(productQuery)
        .select('_id name slug price originalPrice images referenceImages productType category subcategory collectionName isFeatured inventoryCount')
        .sort(sortQuery)
        .skip(skip)
        .limit(productsPerPage)
        .lean()
    ),
    getOrFetch(totalProductsCacheKey, 300, () =>
      Product.countDocuments(productQuery)
    ),
    getOrFetch(sectionCacheKey, 300, () =>
      HomepageSection.find({ page: pageId }).lean()
    ),
    getOrFetch(`campaigns:${productType || category || 'none'}`, 300, () => {
      const campCategory = productType || category;
      if (!campCategory) return Promise.resolve([]);
      return HeroCampaign.find({ category: campCategory }).sort({ order: 1, _id: -1 }).lean();
    }),
    getOrFetch(`taxonomy:${pageId}:${canonicalPath}`, 300, async () => {
      import('@/models/Taxonomy');
      const mongoose = await import('mongoose');
      
      const fullRoutePath = canonicalPath.replace(/^\/products\//, '');
      if (fullRoutePath && fullRoutePath !== pageId) {
        const exactMatch = await mongoose.models.Taxonomy?.findOne({ slug: fullRoutePath }).select('seo').lean();
        if (exactMatch) return { ...exactMatch, isExactMatch: true };
      }
      
      const fallback = await mongoose.models.Taxonomy?.findOne({ slug: pageId }).select('seo').lean();
      return fallback ? { ...fallback, isExactMatch: false } : null;
    }),
    // Fetch distinct child categories/subcategories for the filter bar
    getOrFetch(`filters:${productCacheKey}`, 300, async () => {
      if (subcategory || collectionName || occasion) return []; // Too deep
      if (category) {
        return Product.distinct('subcategory', { productType, category });
      }
      if (productType) {
        return Product.distinct('category', { productType });
      }
      return [];
    }),
    // Single $facet aggregation replaces 5 separate distinct() calls — 1 DB round-trip vs 5
    getOrFetch(`dynamicFilters:${JSON.stringify(productQuery)}`, 300, async () => {
      const facetResult = await Product.aggregate([
        { $match: productQuery },
        {
          $facet: {
            colors:       [{ $unwind: '$colors' },       { $group: { _id: '$colors' } },       { $sort: { _id: 1 } }],
            sizes:        [{ $unwind: '$sizes' },        { $group: { _id: '$sizes' } },        { $sort: { _id: 1 } }],
            categories:   [{ $group: { _id: '$category' } },   { $sort: { _id: 1 } }],
            productTypes: [{ $group: { _id: '$productType' } }, { $sort: { _id: 1 } }],
            occasions:    [{ $match: { occasion: { $exists: true, $nin: [null, ''] } } }, { $group: { _id: '$occasion' } }, { $sort: { _id: 1 } }],
          },
        },
      ]);
      const f = facetResult[0] || {};
      return {
        colors:       (f.colors       || []).map((d: any) => d._id).filter(Boolean),
        sizes:        (f.sizes        || []).map((d: any) => d._id).filter(Boolean),
        categories:   (f.categories   || []).map((d: any) => d._id).filter(Boolean),
        productTypes: (f.productTypes || []).map((d: any) => d._id).filter(Boolean),
        occasions:    (f.occasions    || []).map((d: any) => d._id).filter(Boolean),
      };
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
  const dynamicFilters = rawDynamicFilters as { colors: string[], sizes: string[], categories: string[], productTypes: string[], occasions: string[] };

  const plainCampaigns = (rawCampaigns as any[] || []).map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    subtitle: c.subtitle,
    videoUrl: c.videoUrl,
    linkUrl: c.linkUrl,
    mediaType: c.mediaType || (c.videoUrl?.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image'),
    category: c.category || 'general'
  }));

  const finalHeroCampaigns = plainCampaigns.filter(
    (c) => c.category === (productType || category) || c.category === 'general'
  );


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
  // If we're relying on a fallback taxonomy (e.g. 'cocktail'), we shouldn't use its generic seoH1 for a specific page.
  const isExactMatch = (rawTaxonomy as any)?.isExactMatch;
  const isRootTaxonomy = pageId === (canonicalPath.replace(/^\/products\//, '') || pageId);

  // Use slug2/slug3 as category/subcategory fallbacks so the heading is correct
  // (e.g. /products/couture/womens/lehenga → "Luxury Women's Lehengas")
  const effectiveCategory = category || slug2;
  const effectiveSubcategory = subcategory || slug3;

  const generatedTitle = generateCategoryHeading(productType, effectiveCategory, effectiveSubcategory, collectionName);
  const taxonomySeo = (rawTaxonomy as any)?.seo || {};
  
  // Use the taxonomy's H1 if we matched exactly OR if it's a top-level department
  const useTaxonomyH1 = taxonomySeo.seoH1 && (isExactMatch || isRootTaxonomy);
  
  const pageTitle = useTaxonomyH1 ? taxonomySeo.seoH1 : generatedTitle;
  const seoIntro = taxonomySeo.seoIntro;
  const seoContent = taxonomySeo.seoContent;

  /** Breadcrumb trail so users know where they are */
  const breadcrumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }];
  if (productType) {
    const pt = productType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({ label: pt, href: `/products/${productType}` });
  }
  if (effectiveCategory) {
    const cat = effectiveCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({
      label: cat,
      href: productType
        ? `/products/${productType}/${effectiveCategory}`
        : `/products?category=${effectiveCategory}`,
    });
  }
  if (effectiveSubcategory) {
    const sub = effectiveSubcategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({
      label: sub,
      href: productType && effectiveCategory
        ? `/products/${productType}/${effectiveCategory}/${effectiveSubcategory}`
        : `/products?subcategory=${effectiveSubcategory}`,
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
    !slug2 &&
    !slug3 &&
    !q &&
    !minPrice &&
    !maxPrice &&
    !colors
  );

  // Show hero only on top-level pages, EXCEPT for couture which should never have the banner.
  const showHero = isTopLevelDepartment && finalHeroCampaigns.length > 0 && productType !== 'couture';

  // The user specifically requested to NOT show the product grid on the jewellery home page,
  // making it act purely as a curated landing page.
  const hideProductGrid = isTopLevelDepartment && pageId === 'jewellery';

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  const itemListSchema = generateItemListSchema(products, canonicalPath);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      {showHero && (
        <div className={productType === 'couture' ? 'mobile-hide' : ''}>
          <HeroSection campaigns={finalHeroCampaigns} />
        </div>
      )}
      <main style={containerStyle} className={`desktop-px-8 mobile-px-4 ${!showHero ? 'desktop-pt-no-hero' : ''} mobile-content-top-pad`}>
        {/* Curated Sections */}
        {/* We use desktop-mx-negative to apply the negative margins ONLY on desktop, avoiding mobile breakages */}
        {(sectionMap.CuratedGrid || sectionMap.FeatureBanner || sectionMap.SplitShowcase || sectionMap.CoutureProcess || sectionMap.JewelleryProcess) && (
          <div className="desktop-mx-negative mobile-m-0">
            {sectionMap.CuratedGrid && <CuratedGrid data={{...sectionMap.CuratedGrid, buttonLink: sectionMap.CuratedGrid.buttonLink || (productType ? `/products/${productType}/all` : '/products')}} />}
            {sectionMap.FeatureBanner && <FeatureBanner data={sectionMap.FeatureBanner} />}
            {sectionMap.SplitShowcase && <SplitShowcase data={sectionMap.SplitShowcase} />}
            {sectionMap.CoutureProcess && pageId !== 'jewellery' && <CoutureProcess data={sectionMap.CoutureProcess} />}
            {sectionMap.JewelleryProcess && pageId === 'jewellery' && <JewelleryProcess data={sectionMap.JewelleryProcess} />}
          </div>
        )}


        {/* Product grid and heading (hidden on curated landing pages) */}
        {!hideProductGrid && (
          <>
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

            {/* Product grid */}
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <p className="text-body">No products found in this category.</p>
              </div>
            ) : (
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
            )}
          </>
        )}

        {seoContent && (
          <SeoAccordion content={seoContent} />
        )}
      </main>
    </>
  );
}
