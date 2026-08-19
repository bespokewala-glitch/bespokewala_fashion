import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { generatePageMetadata, generateCategoryMetadata } from '@/lib/seo';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';
import { getOrFetch } from '@/lib/serverCache';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; category: string; subcategory: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category, subcategory } = await params;
  
  try {
    await dbConnect();
    const taxonomy = await getOrFetch(`taxonomy:meta:${subcategory}`, 600, () => 
      Taxonomy.findOne({ slug: subcategory, type: 'category' }).lean()
    );
    if (taxonomy && (taxonomy as any).seo) {
      return generateCategoryMetadata(productType, category, subcategory, (taxonomy as any).seo);
    }
  } catch (err) {}

  return generateCategoryMetadata(productType, category, subcategory);
}

/**
 * Route: /products/[slug]/[category]/[subcategory]
 * Examples:
 *   /products/jewellery/signature-collection/ring    ← RING DEDICATED PAGE
 *   /products/jewellery/diamond-collection/necklace
 *   /products/jewellery/menswear-collection/bracelet
 */
export default async function ProductSubcategoryPage({ params, searchParams }: Props) {
  const { slug: productType, category, subcategory } = await params;
  const { page } = await searchParams;
  return <CollectionPageContent params={{ productType, category, subcategory, page }} />;
}
