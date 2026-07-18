import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import HorizontalVideoScroll from '@/components/home/HorizontalVideoScroll';
import DynamicCategoryShowcase from '@/components/home/DynamicCategoryShowcase';
import ProductCard from '@/components/product/ProductCard';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import HeroCampaign from '@/models/HeroCampaign';
import HomepageSection from '@/models/HomepageSection';

export const revalidate = 0;

export default async function Home() {
  await dbConnect();
  
  // Fetch up to 4 featured products
  const featuredProducts = await Product.find({ isFeatured: true }).limit(4).lean();
  
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
  // General campaigns (both Images and Videos) go ONLY to the top HeroSection
  const heroCampaigns = plainCampaigns.filter(c => c.category === 'general');
  
  // Specific categories go ONLY to their respective DynamicCategoryShowcase
  const coutureMedia = plainCampaigns.filter(c => c.category === 'couture');
  const jewelleryMedia = plainCampaigns.filter(c => c.category === 'jewellery');
  const diffusionMedia = plainCampaigns.filter(c => c.category === 'diffusion');
  const beautyMedia = plainCampaigns.filter(c => c.category === 'beauty');

  // Fetch Homepage Sections
  const hpSections = await HomepageSection.find({}).lean();
  const sectionMap: any = {};
  hpSections.forEach(s => {
    sectionMap[s.sectionType] = s.content;
  });

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#fff' }}>
        <HeroSection campaigns={heroCampaigns} />
        
        {/* New Advanced Layout Sections */}
        <DynamicCategoryShowcase categoryName="Couture" campaigns={coutureMedia} />
        <DynamicCategoryShowcase categoryName="Jewellery" campaigns={jewelleryMedia} />
        <DynamicCategoryShowcase categoryName="Diffusion" campaigns={diffusionMedia} />
        <DynamicCategoryShowcase categoryName="Beauty" campaigns={beautyMedia} />
        
        {/* Featured Products */}
        <section style={{ padding: '8rem 2rem', textAlign: 'center', maxWidth: '1600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>
            Featured Arrivals
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4rem', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto 4rem auto', lineHeight: '1.6' }}>
            Curated collection for the season
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '3rem 2rem',
            marginTop: '3rem',
            textAlign: 'left'
          }}>
            {featuredProducts.map((product: any) => (
              <ProductCard key={product._id.toString()} product={product} />
            ))}
          </div>

          <div style={{ marginTop: '4rem' }}>
            <a href="/products" style={{
              display: 'inline-block',
              padding: '1rem 3rem',
              backgroundColor: '#000',
              color: '#fff',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.9rem'
            }}>View All Products</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
