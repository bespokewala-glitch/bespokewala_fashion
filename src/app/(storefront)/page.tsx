import Link from 'next/link';
import HeroSection from '@/components/home/HeroSection';
import DynamicCategoryShowcase from '@/components/home/DynamicCategoryShowcase';
import PremiumFeaturedCarousel from '@/components/home/PremiumFeaturedCarousel';
import CuratedGrid from '@/components/home/CuratedGrid';
import FeatureBanner from '@/components/home/FeatureBanner';
import SplitShowcase from '@/components/home/SplitShowcase';
import CoutureProcess from '@/components/home/CoutureProcess';
import TrustSection from '@/components/home/TrustSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import HeroCampaign from '@/models/HeroCampaign';
import HomepageSection from '@/models/HomepageSection';
import { getOrFetch } from '@/lib/serverCache';
import { Metadata } from 'next';
import { generatePageMetadata, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = generatePageMetadata(
  "Luxury Couture, Footwear & Jewellery",
  "Discover Bespokewala's luxury couture, footwear and jewellery collections, crafted with timeless elegance and exceptional design.",
  "/"
);

export default async function Home() {
  await dbConnect();

  // ─── Run all independent DB queries IN PARALLEL ─────────────────────────────
  // Each query is individually memoized in the in-process cache (5-min TTL),
  // so warm requests within 5 minutes are served instantly with zero DB round-trips.
  const [rawFeaturedProducts, campaigns, hpSections] = await Promise.all([
    getOrFetch('home:featuredProducts', 300, () =>
      Product.find({ isFeatured: true })
        .sort({ _id: -1 })
        .select('name slug price images category referenceImages')
        .limit(10)
        .lean()
    ),
    getOrFetch('home:campaigns', 300, () =>
      HeroCampaign.find({}).sort({ order: 1, _id: -1 }).lean()
    ),
    getOrFetch('home:hpSections', 300, () =>
      HomepageSection.find({ page: 'home' }).sort({ _id: -1 }).lean()
    ),
  ]);

  // ─── Serialize for Client Components ────────────────────────────────────────
  const featuredProducts = JSON.parse(JSON.stringify(rawFeaturedProducts));

  // ─── Campaign processing ─────────────────────────────────────────────────────
  const plainCampaigns = (campaigns as any[]).map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    subtitle: c.subtitle,
    videoUrl: c.videoUrl,
    linkUrl: c.linkUrl,
    category: c.category || 'general',
    mediaType: c.mediaType || (c.videoUrl?.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image'),
  }));

  const heroCampaigns = plainCampaigns.filter(
    (c) => c.category === 'general' || c.category === 'couture'
  );
  const finalHeroCampaigns = heroCampaigns.length > 0 ? heroCampaigns : plainCampaigns;

  // ─── Homepage section map ────────────────────────────────────────────────────
  const sectionMap: any = {};
  (hpSections as any[]).forEach((s: any) => {
    sectionMap[s.sectionType] = s.content;
  });

  // Track used product IDs to avoid duplicates on the homepage
  const usedProductIds = new Set(
    (rawFeaturedProducts as any[]).map((p: any) => p._id.toString())
  );

  // ─── CuratedGrid slug resolution + SplitShowcase (parallel) ─────────────────
  const curatedTitles: string[] =
    sectionMap.CuratedGrid?.items?.map((i: any) => i.title).filter(Boolean) ?? [];

  const [curatedMatchingProducts, showcaseProducts] = await Promise.all([
    curatedTitles.length > 0
      ? getOrFetch(`home:curatedSlugs:${curatedTitles.join(',')}`, 300, () =>
          Product.find({ name: { $in: curatedTitles } })
            .sort({ _id: -1 })
            .select('_id name slug')
            .lean()
        )
      : Promise.resolve([]),
    getOrFetch('home:showcaseProducts', 300, () =>
      Product.find({ _id: { $nin: Array.from(usedProductIds) } })
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .select('name slug price images')
        .lean()
    ),
  ]);

  // Apply CuratedGrid slugs
  if (sectionMap.CuratedGrid?.items) {
    (curatedMatchingProducts as any[]).forEach((p: any) =>
      usedProductIds.add(p._id.toString())
    );
    sectionMap.CuratedGrid.items = sectionMap.CuratedGrid.items.map((item: any) => {
      const match = (curatedMatchingProducts as any[]).find(
        (p: any) => p.name === item.title
      );
      return { ...item, link: match ? `/products/${match.slug}` : '#' };
    });
  }

  // Populate SplitShowcase ONLY if the CMS didn't provide custom products
  const hasCustomShowcase = sectionMap.SplitShowcase?.products?.some((p: any) => p.image && p.image.trim() !== '');
  
  if (!hasCustomShowcase && (showcaseProducts as any[]).length > 0) {
    if (!sectionMap.SplitShowcase) sectionMap.SplitShowcase = {};
    sectionMap.SplitShowcase.products = (showcaseProducts as any[]).map((p: any) => ({
      name: p.name,
      slug: p.slug,
      price: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(p.price),
      image: p.images?.[0] || '',
    }));
  } else if (hasCustomShowcase) {
    sectionMap.SplitShowcase.products = sectionMap.SplitShowcase.products.filter((p: any) => p.image && p.image.trim() !== '');
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
      <h1
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        Luxury Couture, Footwear &amp; Jewellery Crafted for You
      </h1>
      <main style={{ backgroundColor: '#fff' }}>
        <HeroSection campaigns={finalHeroCampaigns} />

        {/* Curated Sections */}
        <CuratedGrid data={sectionMap.CuratedGrid} />
        <TrustSection />
        <FeatureBanner data={sectionMap.FeatureBanner} />
        <SplitShowcase data={sectionMap.SplitShowcase} />
        <CoutureProcess data={sectionMap.CoutureProcess} />
        <TestimonialsSection />

        {/* Featured Products */}
        <section className="featured-arrivals-section">
          <style>{`
            .featured-arrivals-section {
              padding: 6rem 0;
              text-align: center;
              width: 100%;
              overflow: hidden;
            }
            .featured-arrivals-h2 {
              font-size: 2.5rem;
              font-weight: 300;
              letter-spacing: 0.1em;
              margin-bottom: 1rem;
              text-transform: uppercase;
            }
            .featured-arrivals-sub {
              color: #666;
              font-size: 0.9rem;
              margin-bottom: 0rem;
              font-style: italic;
              max-width: 600px;
              margin: 0 auto;
              line-height: 1.6;
            }
            .featured-cta-container {
              margin-top: 4rem;
            }
            
            @media (max-width: 767px) {
              .featured-arrivals-section {
                padding: 40px 0 30px 0;
              }
              .featured-arrivals-h2 {
                font-size: 22px;
                letter-spacing: 2px;
                margin-bottom: 8px;
              }
              .featured-arrivals-sub {
                font-size: 12px;
                font-style: normal;
                margin-bottom: 30px;
              }
              .featured-cta-container {
                margin-top: 30px;
              }
              .featured-cta-btn {
                font-size: 10px !important;
                letter-spacing: 1.5px !important;
                height: 46px !important;
                padding: 0 24px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
            }
          `}</style>

          <h2 className="featured-arrivals-h2">Featured Arrivals</h2>
          <p className="featured-arrivals-sub">Curated collection for the season</p>

          <PremiumFeaturedCarousel products={featuredProducts} />

          <div className="featured-cta-container">
            <Link
              href="/products"
              className="btn-primary featured-cta-btn"
              aria-label="Explore Full Collection"
            >
              Explore Full Collection
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
