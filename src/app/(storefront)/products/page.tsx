import React from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import HeroCampaign from '@/models/HeroCampaign';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/product/ProductCard';
import HeroSection from '@/components/home/HeroSection';
import HomepageSection from '@/models/HomepageSection';
import CuratedGrid from '@/components/home/CuratedGrid';
import FeatureBanner from '@/components/home/FeatureBanner';
import SplitShowcase from '@/components/home/SplitShowcase';
import CoutureProcess from '@/components/home/CoutureProcess';

export const revalidate = 0;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string, productType?: string, subcategory?: string, collectionName?: string, occasion?: string }>
}) {
  await dbConnect();
  
  let query: any = {};
  
  // Need to await searchParams in Next.js 15+ 
  const resolvedParams = await searchParams;
  const category = resolvedParams.category;
  const productType = resolvedParams.productType;
  const subcategory = resolvedParams.subcategory;
  const collectionName = resolvedParams.collectionName;
  const occasion = resolvedParams.occasion;

  if (category) query.category = category;
  if (productType) query.productType = productType;
  if (subcategory) query.subcategory = subcategory;
  if (collectionName) query.collectionName = collectionName;
  if (occasion) query.occasion = occasion;
  
  const products = await Product.find(query).lean();
  
  // Fetch campaigns for this product type
  let campaignQuery: any = {};
  if (productType) {
    campaignQuery = { category: productType };
  } else if (category && !['womens', 'mens', 'new-arrivals'].includes(category)) {
    // If it's a specific custom category, try to match it, else fallback
    campaignQuery = { category: category };
  } else {
    // If just /products or generic category, maybe show general or no hero
    // Let's just look for general if no specific productType
    campaignQuery = { category: 'general' };
  }
  
  const rawCampaigns = await HeroCampaign.find(campaignQuery).sort({ order: 1 }).lean();
  const campaigns = rawCampaigns.map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    subtitle: c.subtitle,
    videoUrl: c.videoUrl,
    linkUrl: c.linkUrl
  }));

  // Fetch Homepage Sections for this specific page
  const pageId = productType || category || 'all-products';
  const hpSections = await HomepageSection.find({ page: pageId }).lean();
  const sectionMap: any = {};
  hpSections.forEach((s: any) => {
    sectionMap[s.sectionType] = s.content;
  });
  
  const pageTitle = productType  
    ? productType.charAt(0).toUpperCase() + productType.slice(1) 
    : category 
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : 'All Products';

  const containerStyle: React.CSSProperties = {
    padding: campaigns.length > 0 ? '4rem 2rem' : '8rem 2rem 4rem 2rem',
    maxWidth: '1600px',
    margin: '0 auto',
    minHeight: '80vh',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '3rem 2rem',
    marginTop: '3rem',
  };

  return (
    <>
      <Header />
      {campaigns.length > 0 && (
        <HeroSection campaigns={campaigns} />
      )}
      <main style={containerStyle}>
        {/* Curated Sections */}
        <div style={{ margin: '-4rem -2rem 4rem -2rem' }}>
          {sectionMap.CuratedGrid && <CuratedGrid data={sectionMap.CuratedGrid} />}
          {sectionMap.FeatureBanner && <FeatureBanner data={sectionMap.FeatureBanner} />}
          {sectionMap.SplitShowcase && <SplitShowcase data={sectionMap.SplitShowcase} />}
          {sectionMap.CoutureProcess && <CoutureProcess data={sectionMap.CoutureProcess} />}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="h1">{pageTitle}</h1>
          <p className="subtitle" style={{ marginTop: '1rem' }}>
            Discover our luxury {pageTitle.toLowerCase()} collection.
          </p>
        </div>
        
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p className="text-body">No products found in this category.</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {products.map((product: any) => (
              <ProductCard key={product._id.toString()} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
