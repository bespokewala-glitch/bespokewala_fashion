import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import ProductCard from '@/components/product/ProductCard';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import HeroCampaign from '@/models/HeroCampaign';

export const revalidate = 0;

export default async function Home() {
  await dbConnect();
  
  // Fetch up to 4 featured products
  const featuredProducts = await Product.find({ isFeatured: true }).limit(4).lean();
  
  // Fetch hero campaigns
  const campaigns = await HeroCampaign.find({}).sort({ order: 1 }).lean();
  // Ensure we can pass plain objects to client components
  const plainCampaigns = campaigns.map(c => ({
    _id: c._id.toString(),
    title: c.title,
    subtitle: c.subtitle,
    videoUrl: c.videoUrl,
    linkUrl: c.linkUrl
  }));

  return (
    <>
      <Header />
      <main>
        <HeroSection campaigns={plainCampaigns} />
        <CategoryGrid />
        
        {/* Featured Products */}
        <section style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '1600px', margin: '0 auto' }}>
          <h2 className="h2" style={{ marginBottom: '2rem' }}>Featured Arrivals</h2>
          <p className="subtitle">Curated collection for the season</p>
          
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
            <a href="/products" className="btn-primary">View All Products</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
