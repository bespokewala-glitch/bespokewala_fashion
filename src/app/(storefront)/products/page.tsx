import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { generateCategoryMetadata, generatePageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; productType?: string; subcategory?: string; collectionName?: string; occasion?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; sort?: string }>;
}): Promise<Metadata> {
  const p = await searchParams;
  
  if (p.productType) {
    return generateCategoryMetadata(p.productType, p.category, p.subcategory);
  }
  
  return generatePageMetadata(
    'All Products',
    'Explore the complete luxury collection at Bespokewala.',
    '/products'
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; productType?: string; subcategory?: string; collectionName?: string; occasion?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; sort?: string; page?: string }>;
}) {
  const p = await searchParams;
  
  const isPureCouture = 
    (p.productType === 'couture' && !p.category) || 
    (p.category === 'couture' && !p.productType);
    
  if (isPureCouture && !p.subcategory && !p.collectionName && !p.occasion) {
    redirect('/');
  }

  return <CollectionPageContent params={p} />;
}
