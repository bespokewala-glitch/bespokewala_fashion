import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; category: string; subcategory: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category, subcategory } = await params;
  const pt = productType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const cat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const sub = subcategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `${sub} – ${cat} | Bespoken`,
    description: `Shop ${sub.toLowerCase()} from the ${cat} ${pt.toLowerCase()} collection at Bespoken. Luxury jewellery crafted to perfection.`,
  };
}

/**
 * Route: /products/[slug]/[category]/[subcategory]
 * Examples:
 *   /products/jewellery/signature-collection/ring    ← RING DEDICATED PAGE
 *   /products/jewellery/diamond-collection/necklace
 *   /products/jewellery/menswear-collection/bracelet
 */
export default async function ProductSubcategoryPage({ params }: Props) {
  const { slug: productType, category, subcategory } = await params;
  console.log("====== MATCHED SUBCATEGORY PAGE ======", { productType, category, subcategory });
  return <CollectionPageContent params={{ productType, category, subcategory }} />;
}
