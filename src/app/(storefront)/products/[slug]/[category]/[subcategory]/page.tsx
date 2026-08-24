import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { generatePageMetadata, generateCategoryMetadata } from '@/lib/seo';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';
import Product from '@/models/Product';
import { getOrFetch } from '@/lib/serverCache';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; category: string; subcategory: string }>;
  searchParams: Promise<{ page?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; size?: string; occasion?: string; sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category, subcategory } = await params;
  console.log(`[SUBCATEGORY] generateMetadata called for ${productType}/${category}/${subcategory}`);
  
  try {
    await dbConnect();
    const taxonomy = await getOrFetch(`taxonomy:meta:${subcategory}`, 600, () => 
      Taxonomy.findOne({ slug: subcategory }).lean()
    );
    if (taxonomy && (taxonomy as any).seo) {
      return generateCategoryMetadata(productType, category, subcategory, (taxonomy as any).seo);
    }
  } catch (err) {}

  return generateCategoryMetadata(productType, category, subcategory);
}

export default async function ProductSubcategoryPage({ params, searchParams }: Props) {
  const { slug: productType, category, subcategory } = await params;
  const searchParamsAwaited = await searchParams;
  console.log(`[SUBCATEGORY] page render called for ${productType}/${category}/${subcategory}`);
  
  await dbConnect();
  const taxonomy = await getOrFetch(`taxonomy:meta:${subcategory}`, 600, () => 
    Taxonomy.findOne({ slug: subcategory }).lean()
  );

  const collectionParams: any = { ...searchParamsAwaited, productType, category };
  
  let isOccasion = false;
  let isCollection = false;

  if (taxonomy) {
    if ((taxonomy as any).type === 'occasion') isOccasion = true;
    else if ((taxonomy as any).type === 'collection') isCollection = true;
  } else {
    const productWithOccasion = await Product.findOne({ occasion: subcategory }).select('_id').lean();
    if (productWithOccasion) {
      isOccasion = true;
    } else {
      const productWithCollection = await Product.findOne({ collectionName: subcategory }).select('_id').lean();
      if (productWithCollection) {
        isCollection = true;
      }
    }
  }

  if (isOccasion) {
    collectionParams.occasion = subcategory;
  } else if (isCollection) {
    collectionParams.collectionName = subcategory;
  } else {
    collectionParams.subcategory = subcategory;
  }

  return <CollectionPageContent params={collectionParams} />;
}
