import Link from 'next/link';
import HeroSection from '@/components/home/HeroSection';
import HorizontalVideoScroll from '@/components/home/HorizontalVideoScroll';
import DynamicCategoryShowcase from '@/components/home/DynamicCategoryShowcase';
import ProductCard from '@/components/product/ProductCard';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import HeroCampaign from '@/models/HeroCampaign';
import HomepageSection from '@/models/HomepageSection';
import PremiumFeaturedCarousel from '@/components/home/PremiumFeaturedCarousel';
import CuratedGrid from '@/components/home/CuratedGrid';
import FeatureBanner from '@/components/home/FeatureBanner';
import SplitShowcase from '@/components/home/SplitShowcase';
import CoutureProcess from '@/components/home/CoutureProcess';
import { Metadata } from 'next';

import { generatePageMetadata, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = generatePageMetadata(
  "Bespokewala | Luxury Couture, Footwear & Jewellery",
  "Discover Bespokewala's luxury couture, footwear and jewellery collections, crafted with timeless elegance and exceptional design.",
  "/"
);

export default async function Home() {
  await dbConnect();
  
  // Fetch up to 10 featured products and serialize them for Client Components (minimum 7 needed for smooth carousel loop without duplicating)
  const rawFeaturedProducts = await Product.find({ isFeatured: true })
    .sort({ _id: -1 })
    .select('name slug price images category referenceImages')
    .limit(10)
    .lean();
  const featuredProducts = JSON.parse(JSON.stringify(rawFeaturedProducts));
  
  // Track used product IDs to avoid duplicates on the homepage
  const usedProductIds = new Set(rawFeaturedProducts.map(p => p._id.toString()));
  
  // Fetch hero campaigns
  const campaigns = await HeroCampaign.find({}).sort({ order: 1, _id: -1 }).lean();
  const plainCampaigns = campaigns.map(c => ({
    _id: c._id.toString(),
    title: c.title,
    subtitle: c.subtitle,
    videoUrl: c.videoUrl,
    linkUrl: c.linkUrl,
    category: c.category || 'general',
    mediaType: c.mediaType || (c.videoUrl?.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image')
  }));

  // Categorize campaigns
  // General & Couture campaigns go to the top HeroSection (Homepage is the Couture page)
  const heroCampaigns = plainCampaigns.filter(c => c.category === 'general' || c.category === 'couture');
  const finalHeroCampaigns = heroCampaigns.length > 0 ? heroCampaigns : plainCampaigns;
  
  // Specific categories go ONLY to their respective DynamicCategoryShowcase
  const coutureMedia = plainCampaigns.filter(c => c.category === 'couture');
  const jewelleryMedia = plainCampaigns.filter(c => c.category === 'jewellery');
  const diffusionMedia = plainCampaigns.filter(c => c.category === 'diffusion');
  const beautyMedia = plainCampaigns.filter(c => c.category === 'beauty');

  // Fetch Homepage Sections
  const hpSections = await HomepageSection.find({ page: 'home' }).sort({ _id: -1 }).lean();
  const sectionMap: any = {};
  hpSections.forEach(s => {
    sectionMap[s.sectionType] = s.content;
  });

  // Dynamically resolve product slugs for CuratedGrid based on title
  if (sectionMap.CuratedGrid?.items) {
    const titles = sectionMap.CuratedGrid.items.map((i: any) => i.title).filter(Boolean);
    const matchingProducts = await Product.find({ name: { $in: titles } })
      .sort({ _id: -1 })
      .select('_id name slug')
      .lean();
    matchingProducts.forEach(p => usedProductIds.add(p._id.toString()));
    sectionMap.CuratedGrid.items = sectionMap.CuratedGrid.items.map((item: any) => {
      const match = matchingProducts.find(p => p.name === item.title);
      return {
        ...item,
        link: match ? `/products/${match.slug}` : '#'
      };
    });
  }

  // Populate SplitShowcase with actual products instead of dummy/hardcoded data without slugs
  const showcaseProducts = await Product.find({ _id: { $nin: Array.from(usedProductIds) } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(5)
    .select('name slug price images')
    .lean();
  if (showcaseProducts.length > 0) {
    if (!sectionMap.SplitShowcase) sectionMap.SplitShowcase = {};
    sectionMap.SplitShowcase.products = showcaseProducts.map((p: any) => ({
      name: p.name,
      slug: p.slug,
      price: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.price),
      image: p.images?.[0] || ''
    }));
  }

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        Luxury Couture, Footwear & Jewellery Crafted for You
      </h1>
      <main style={{ backgroundColor: '#fff' }}>
        <HeroSection campaigns={finalHeroCampaigns} />
        
        {/* Curated Sections */}
        <CuratedGrid data={sectionMap.CuratedGrid} />
        <FeatureBanner data={sectionMap.FeatureBanner} />
        <SplitShowcase data={sectionMap.SplitShowcase} />
        <CoutureProcess data={sectionMap.CoutureProcess} />



        {/* Featured Products */}
        <section style={{ padding: '8rem 0', textAlign: 'center', width: '100%', overflow: 'hidden' }} className="mobile-section-py">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }} className="mobile-h2-clamp">
            Featured Arrivals
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0rem', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }} className="mobile-body-clamp">
            Curated collection for the season
          </p>
          
          <PremiumFeaturedCarousel products={featuredProducts} />

          <div style={{ marginTop: '4rem' }} className="mobile-section-mt">
            <Link href="/products" className="btn-primary mobile-label-clamp" aria-label="View All Products">
              View All Products
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
