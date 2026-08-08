import React from 'react';
import Link from 'next/link';

export default function FeatureBanner({ data }: { data?: any }) {
  const image = data?.image || "https://images.unsplash.com/photo-1599643478514-4a4e09b52342?auto=format&fit=crop&q=80";
  const title = data?.title || "High Jewellery";
  const subtitle = data?.subtitle || "Pair text with an image to focus on your chosen product.";
  const link = data?.link || "/products?productType=jewellery";

  return (
    <div style={{ padding: '6rem 2rem 6rem 2rem', backgroundColor: '#FAF9F6', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="mobile-section-py mobile-px-container">

      {/* Top Header matching screenshot */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="mobile-mb-2">
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: '#c1a68d', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }} className="mobile-label-clamp">
          Our Craft, Your Forever
        </p>
        <div style={{ width: '40px', height: '1px', backgroundColor: '#c1a68d', margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'serif', fontWeight: 400, color: '#222', marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }} className="mobile-h2-clamp">
          Curated Grid
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#666', fontStyle: 'italic' }} className="mobile-body-clamp">
          A glimpse into the world of timeless craftsmanship.
        </p>
      </div>

      {/* Video / Image Container */}
      <section style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        height: '70vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {image.match(/\.(mp4|webm|ogg)$/i) ? (
          <video
            src={image}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7,
            }}
            autoPlay loop muted playsInline
          />
        ) : (
          <img
            src={image}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7,
            }}
          />
        )}

        {/* Play Button Overlay (Visible only if video, but we'll show it for aesthetic if it's a video) */}
        {image.match(/\.(mp4|webm|ogg)$/i) && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(2px)'
          }}>
            <div style={{
              width: 0, height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '14px solid white',
              marginLeft: '5px'
            }} />
          </div>
        )}

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
        }} className="mobile-flex-col mobile-p-4" >
          <div className="mobile-text-left" style={{ textAlign: 'left', width: '100%', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.15em', fontWeight: 300, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              {title}
            </h2>
            <p style={{ fontSize: '1rem', fontStyle: 'italic', margin: 0, color: '#c1a68d', fontWeight: 500 }}>
              {subtitle}
            </p>
          </div>
          <Link href={link} prefetch={false} style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.85rem',
            letterSpacing: '0.15em',
            textTransform: 'lowercase',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            opacity: 0.9,
            transition: 'opacity 0.2s ease'
          }}>
            explore &gt;
          </Link>
        </div>
      </section>

      {/* Bottom Decorative Element */}
      <div style={{ width: '100%', maxWidth: '1200px', margin: '4rem auto 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
        <div style={{ width: '8px', height: '8px', transform: 'rotate(45deg)', border: '1px solid #c1a68d', margin: '0 1rem' }} />
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
      </div>

    </div>
  );
}
