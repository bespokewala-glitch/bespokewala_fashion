import React from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function CuratedGrid({ data }: { data?: any }) {
  const defaultImages = [
    {
      url: 'https://images.unsplash.com/photo-1579298245158-33e8f568f7d3?auto=format&fit=crop&q=80',
      title: 'Bridal Couture',
      link: '/products?productType=couture'
    },
    {
      url: 'https://images.unsplash.com/photo-1599643478514-4a4e09b52342?auto=format&fit=crop&q=80',
      title: 'Fine Jewellery',
      link: '/products?productType=jewellery'
    },
    {
      url: 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?auto=format&fit=crop&q=80',
      title: 'Footwear',
      link: '/products?productType=footwear'
    }
  ];

  const title = data?.title || 'Curated This Season';
  const subtitle = data?.subtitle || 'A blend of classic silhouettes and our signature shine, embodied by enigmatic sequins.';
  const images = (data?.items && data.items.length > 0) ? data.items.map((i: any) => ({
    url: i.image || '',
    title: i.title || '',
    link: i.link || '#'
  })).slice(0, 4) : defaultImages;

  return (
    <section style={{ padding: '6rem 2rem 4rem 2rem', backgroundColor: '#fff', textAlign: 'center', overflow: 'hidden' }} className="mobile-section-py mobile-px-container">
      <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }} className="mobile-h2-clamp mobile-mb-2">
        {title}
      </h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4rem', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto 4rem auto', lineHeight: '1.6' }} className="mobile-body-clamp mobile-section-mb">
        {subtitle}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${images.length}, 1fr)`, gap: '1.5rem', width: '100%' }} className="mobile-carousel">
        {images.map((item: { url: string; title: string; link: string }, index: number) => (
          <Link href={item.link} prefetch={false} key={index} style={{ position: 'relative', overflow: 'hidden', display: 'block', height: '600px', borderRadius: '12px' }} aria-label={`Explore ${item.title} collection`}>
            <OptimizedImage 
              src={item.url || ''} 
              alt={item.title ? `Bespokewala ${item.title} collection` : 'Bespokewala curated collection'} 
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              variant="thumbnail"
            />
            <div style={{ 
              position: 'absolute', 
              bottom: 0, left: 0, right: 0, 
              padding: '2rem', 
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
              color: '#fff',
              textAlign: 'left'
            }} className="mobile-card-overlay">
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }} className="mobile-card-title">{item.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }} className="mobile-section-mt">
        <Link href="/products" prefetch={false} className="btn-secondary mobile-label-clamp" aria-label="View all Bespokewala products">
          View All
        </Link>
      </div>
    </section>
  );
}
