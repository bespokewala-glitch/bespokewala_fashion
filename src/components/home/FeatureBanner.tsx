import React from 'react';
import Link from 'next/link';

export default function FeatureBanner({ data }: { data?: any }) {
  const image = data?.image || "https://images.unsplash.com/photo-1599643478514-4a4e09b52342?auto=format&fit=crop&q=80";
  const title = data?.title || "High Jewellery";
  const subtitle = data?.subtitle || "Pair text with an image to focus on your chosen product.";
  const link = data?.link || "/products?category=jewellery";

  return (
    <section style={{ 
      position: 'relative', 
      width: '100%', 
      height: '80vh', 
      backgroundColor: '#000',
      overflow: 'hidden'
    }}>
      <img 
        src={image} 
        alt={title} 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.6, // Darken image
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '4rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        color: '#fff',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', letterSpacing: '0.15em', fontWeight: 300, margin: '0 0 10px 0', textTransform: 'uppercase' }}>
            {title}
          </h2>
          <p style={{ fontSize: '1rem', fontStyle: 'italic', margin: 0, opacity: 0.8 }}>
            {subtitle}
          </p>
        </div>
        <Link href={link} style={{ 
          color: '#fff', 
          textDecoration: 'none', 
          fontSize: '0.9rem', 
          letterSpacing: '0.1em',
          textTransform: 'lowercase',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          explore &gt;
        </Link>
      </div>
    </section>
  );
}
