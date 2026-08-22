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
  searchParams: Promise<{ page?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; sort?: string }>;
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

  const collectionParams: any = { ...searchParamsAwaited, productType };
  
  let isOccasion = false;
  let isCollection = false;

  if (taxonomy) {
    if ((taxonomy as any).type === 'occasion') isOccasion = true;
    else if ((taxonomy as any).type === 'collection') isCollection = true;
  } else {
    const productWithOccasion = await Product.findOne({ occasion: category }).select('_id').lean();
    if (productWithOccasion) {
      isOccasion = true;
    } else {
      const productWithCollection = await Product.findOne({ collectionName: category }).select('_id').lean();
      if (productWithCollection) isCollection = true;
    }
  }

  if (isOccasion) {
    collectionParams.occasion = category;
  } else if (isCollection) {
    collectionParams.collectionName = category;
  } else {
    collectionParams.category = category;
  }

  return <CollectionPageContent params={collectionParams} />;
}
