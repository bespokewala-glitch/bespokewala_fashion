import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { generatePageMetadata, generateCategoryMetadata } from '@/lib/seo';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';
import Product from '@/models/Product';
import { getOrFetch } from '@/lib/serverCache';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; category: string }>;
  searchParams: Promise<{ page?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; size?: string; occasion?: string; sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category } = await params;

  try {
    await dbConnect();
    const taxonomy = await getOrFetch(`taxonomy:meta:${category}`, 600, () => 
      Taxonomy.findOne({ slug: category }).lean()
    );
    if (taxonomy && (taxonomy as any).seo) {
      return generateCategoryMetadata(productType, category, undefined, (taxonomy as any).seo);
    }
  } catch (err) {}

  return generateCategoryMetadata(productType, category);
}

/**
 * Route: /products/[slug]/[category]
 * Examples:
 *   /products/jewellery/signature-collection
 *   /products/jewellery/diamond-collection
 *   /products/couture/womens
 */
export default async function ProductCategoryPage({ params, searchParams }: Props) {
  const { slug: productType, category } = await params;
  const searchParamsAwaited = await searchParams;

  await dbConnect();
  const taxonomy = await getOrFetch(`taxonomy:meta:${category}`, 600, () => 
    Taxonomy.findOne({ slug: category }).lean()
  );

  const collectionParams: any = { ...searchParamsAwaited, productType, slug2: category };

  return <CollectionPageContent params={collectionParams} />;
}
