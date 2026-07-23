import React from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGallery from '@/components/product/ProductGallery';
import ProductActions from '@/components/product/ProductActions';
import ProductClientActions from '@/components/product/ProductClientActions';
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

  // Combine main images and reference images
  const allImages: { url: string; alt: string }[] = [];
  
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: string, idx: number) => {
      allImages.push({ url: img, alt: `${product.name} - View ${idx + 1}` });
    });
  }

  if (product.referenceImages) {
    if (product.referenceImages.front) {
      allImages.push({ url: product.referenceImages.front, alt: `${product.name} - Front View` });
    }
    if (product.referenceImages.back) {
      allImages.push({ url: product.referenceImages.back, alt: `${product.name} - Back View` });
    }
    if (product.referenceImages.left) {
      allImages.push({ url: product.referenceImages.left, alt: `${product.name} - Left View` });
    }
    if (product.referenceImages.right) {
      allImages.push({ url: product.referenceImages.right, alt: `${product.name} - Right View` });
    }
  }

  const containerStyle: React.CSSProperties = {
    padding: '8rem 4rem 4rem 4rem',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '6rem',
    minHeight: '80vh',
    fontFamily: '"Jost", "Inter", sans-serif',
  };

  const detailsContainerStyle: React.CSSProperties = {
    position: 'sticky',
    top: '8rem',
    height: 'fit-content',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  };

  const categoryStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '-1rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 400,
    color: '#222',
    lineHeight: '1.2',
  };

  const descriptionStyle: React.CSSProperties = {
    lineHeight: '1.6',
    color: '#666',
    fontSize: '0.95rem',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 500,
    color: '#000',
    marginTop: '0.5rem',
  };

  const taxLabelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: '#888',
    marginTop: '-1.25rem',
  };

  return (
    <>
      <Header />
      <main style={containerStyle}>
        <div>
          <ProductGallery images={allImages} />
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={detailsContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '-0.5rem' }}>
              {product.category ? (
                <div style={{ ...categoryStyle, marginBottom: 0 }}>{product.category}</div>
              ) : <div />}
              
              <ProductActions productName={product.name} />
            </div>
            
            <h1 style={titleStyle}>{product.name}</h1>
            
            <div style={descriptionStyle}>
              {product.description}
            </div>

            <div style={priceStyle}>MRP: ₹{product.price.toLocaleString('en-IN')}</div>
            <div style={taxLabelStyle}>Price included of all taxes</div>

            {product.colors && product.colors.length > 0 && (
              <div style={{ fontSize: '0.95rem', color: '#444', marginTop: '0.5rem' }}>
                Colour: {product.colors.join(', ')}
              </div>
            )}

            <ProductClientActions 
              product={{
                slug: product.slug,
                name: product.name,
                price: product.price,
                images: product.images,
                colors: product.colors,
                sizes: product.sizes,
              }} 
            />
            
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
