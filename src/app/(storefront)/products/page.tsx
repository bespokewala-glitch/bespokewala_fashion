import React from 'react';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 0;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string, productType?: string, subcategory?: string, collectionName?: string, occasion?: string }>
}) {
  await dbConnect();
  
  let query: any = {};
  
  // Need to await searchParams in Next.js 15+ 
  const resolvedParams = await searchParams;
  const category = resolvedParams.category;
  const productType = resolvedParams.productType;
  const subcategory = resolvedParams.subcategory;
  const collectionName = resolvedParams.collectionName;
  const occasion = resolvedParams.occasion;

  if (category) query.category = category;
  if (productType) query.productType = productType;
  if (subcategory) query.subcategory = subcategory;
  if (collectionName) query.collectionName = collectionName;
  if (occasion) query.occasion = occasion;
  
  const products = await Product.find(query).lean();
  
  const pageTitle = productType 
    ? productType.charAt(0).toUpperCase() + productType.slice(1) 
    : category 
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : 'All Products';

  const containerStyle: React.CSSProperties = {
    padding: '8rem 2rem 4rem 2rem',
    maxWidth: '1600px',
    margin: '0 auto',
    minHeight: '80vh',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '3rem 2rem',
    marginTop: '3rem',
  };

  return (
    <>
      <Header />
      <main style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="h1">{pageTitle}</h1>
          <p className="subtitle" style={{ marginTop: '1rem' }}>
            Discover our luxury {pageTitle.toLowerCase()} collection.
          </p>
        </div>
        
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p className="text-body">No products found in this category.</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {products.map((product: any) => (
              <ProductCard key={product._id.toString()} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
