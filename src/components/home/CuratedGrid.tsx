import React from 'react';
import Link from 'next/link';

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
      title: 'Signature Diffusion',
      link: '/products?productType=diffusion'
    },
    {
      url: 'https://images.unsplash.com/photo-1583391733958-d698188172c9?auto=format&fit=crop&q=80',
      title: 'Pret',
      link: '/products?productType=pret'
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
    <section style={{ padding: '6rem 2rem 4rem 2rem', backgroundColor: '#fff', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>
        {title}
      </h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4rem', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto 4rem auto', lineHeight: '1.6' }}>
        {subtitle}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${images.length}, 1fr)`, gap: '1.5rem', width: '100%' }}>
        {images.map((item: { url: string; title: string; link: string }, index: number) => (
          <Link href={item.link} key={index} style={{ position: 'relative', overflow: 'hidden', display: 'block', height: '600px', borderRadius: '12px' }}>
            <img 
              src={item.url} 
              alt={item.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: 0, left: 0, right: 0, 
              padding: '2rem', 
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
              color: '#fff',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{item.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
