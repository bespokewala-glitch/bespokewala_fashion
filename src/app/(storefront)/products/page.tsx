import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { redirect } from 'next/navigation';

export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; productType?: string; subcategory?: string; collectionName?: string; occasion?: string }>;
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
