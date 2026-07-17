import React from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await dbConnect();
  
  // Need to await params in Next.js 15+ 
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const product = await Product.findOne({ slug }).lean();

  if (!product) {
    notFound();
  }

  const containerStyle: React.CSSProperties = {
    padding: '8rem 2rem 4rem 2rem',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    minHeight: '80vh',
  };

  const imageContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const mainImageStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '2/3',
    objectFit: 'cover',
  };

  const detailsContainerStyle: React.CSSProperties = {
    position: 'sticky',
    top: '8rem',
    height: 'fit-content',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    color: '#666',
  };

  const descriptionStyle: React.CSSProperties = {
    lineHeight: '1.8',
    color: '#444',
  };

  const optionsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const optionBtnStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    border: '1px solid #ccc',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <>
      <Header />
      <main style={containerStyle}>
        <div style={imageContainerStyle}>
          {product.images.map((img: string, idx: number) => (
            <img key={idx} src={img} alt={`${product.name} - View ${idx + 1}`} style={mainImageStyle} />
          ))}
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={detailsContainerStyle}>
            <h1 className="h2">{product.name}</h1>
            <div style={priceStyle}>INR {product.price.toLocaleString('en-IN')}</div>
            
            <div style={descriptionStyle}>
              {product.description}
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div style={optionsContainerStyle}>
                <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Size</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {product.sizes.map((size: string) => (
                    <button key={size} style={optionBtnStyle}>{size}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1 }}>Add to Cart</button>
              <button className="btn-secondary" style={{ flex: 1 }}>Buy it Now</button>
            </div>
            
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee', fontSize: '0.875rem', lineHeight: '1.8' }}>
              <p><strong>Shipping:</strong> Complimentary shipping within India.</p>
              <p><strong>Returns:</strong> 14 days returns for all items.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
