import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category } = await params;
  const pt = productType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const cat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `${cat} – ${pt} | Bespokewala`,
    description: `Explore the ${cat} collection from our ${pt.toLowerCase()} range at Bespokewala.`,
  };
}

/**
 * Route: /products/[slug]/[category]
 * Examples:
 *   /products/jewellery/signature-collection
 *   /products/jewellery/diamond-collection
 *   /products/couture/womens
 */
export default async function ProductCategoryPage({ params }: Props) {
  const { slug: productType, category } = await params;
  return <CollectionPageContent params={{ productType, category }} />;
}
