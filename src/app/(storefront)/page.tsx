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

export const revalidate = 0;

export const metadata: Metadata = generatePageMetadata(
  "Bespokewala | Luxury Couture, Footwear & Jewellery",
  "Discover Bespokewala's luxury couture, footwear and jewellery collections, crafted with timeless elegance and exceptional design.",
  "/"
);

export default async function Home() {
  await dbConnect();
  
  // Fetch up to 4 featured products and serialize them for Client Components
  const rawFeaturedProducts = await Product.find({ isFeatured: true }).select('name slug price images category referenceImages').limit(4).lean();
  const featuredProducts = JSON.parse(JSON.stringify(rawFeaturedProducts));
  
  // Fetch hero campaigns
  const campaigns = await HeroCampaign.find({}).sort({ order: 1 }).lean();
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
  const hpSections = await HomepageSection.find({ page: 'home' }).lean();
  const sectionMap: any = {};
  hpSections.forEach(s => {
    sectionMap[s.sectionType] = s.content;
  });

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
            <Link href="/products" style={{
              display: 'inline-block',
              padding: '1rem 3rem',
              backgroundColor: '#000',
              color: '#fff',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.9rem'
            }} className="mobile-label-clamp">View All Products</Link>
          </div>
        </section>
      </main>
    </>
  );
}
