import React from 'react';
import Link from 'next/link';

export default function CategoryGrid() {
  const gridContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
    padding: '4rem 2rem',
    maxWidth: '1600px',
    margin: '0 auto',
  };

  const categories = [
    { name: 'Couture', slug: 'couture', image: 'https://images.unsplash.com/photo-1574044572237-7f938d821217?q=80&w=2687&auto=format&fit=crop' },
    { name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2940&auto=format&fit=crop' },
    { name: 'Jewellery', slug: 'jewellery', image: 'https://images.unsplash.com/photo-1599643478524-fb66f70d00f0?q=80&w=2728&auto=format&fit=crop' },
  ];

  return (
    <section>
      <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2 className="h2">Discover the Collections</h2>
      </div>
      <div style={gridContainerStyle}>
        {categories.map((category) => (
          <Link href={`/products/${category.slug}`} prefetch={false} key={category.slug} style={{ position: 'relative', overflow: 'hidden', height: '600px', display: 'block' }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${category.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'transform 0.5s ease',
            }}
            className="category-image"
            />
            <div style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#fff',
              fontSize: '1.5rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '0.5rem 1.5rem',
            }}>
              {category.name}
            </div>
            
            {/* Adding a small global style override just for the hover effect here */}
            <style>{`
              .category-image:hover { transform: scale(1.05); }
            `}</style>
          </Link>
        ))}
      </div>
    </section>
  );
}
