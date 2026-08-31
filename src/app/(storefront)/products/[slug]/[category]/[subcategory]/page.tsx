import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { generatePageMetadata, generateCategoryMetadata } from '@/lib/seo';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';
import Product from '@/models/Product';
import { getOrFetch } from '@/lib/serverCache';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string; category: string; subcategory: string }>;
  searchParams: Promise<{ page?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; size?: string; occasion?: string; sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category, subcategory } = await params;
  
  try {
    await dbConnect();
    const fullRoutePath = `${productType}/${category}/${subcategory}`;
    
    // 1. Check exact route match (e.g., 'couture/womens/cocktail')
    let taxonomy = await getOrFetch(`taxonomy:meta:${fullRoutePath}`, 600, () => 
      Taxonomy.findOne({ slug: fullRoutePath }).lean()
    );
    
    // 2. Fall back to generic slug (e.g., 'cocktail')
    if (!taxonomy) {
      taxonomy = await getOrFetch(`taxonomy:meta:${subcategory}`, 600, () => 
        Taxonomy.findOne({ slug: subcategory }).lean()
      );
    }

    if (taxonomy && (taxonomy as any).seo) {
      return generateCategoryMetadata(productType, category, subcategory, (taxonomy as any).seo);
    }
  } catch (err) {}

  return generateCategoryMetadata(productType, category, subcategory);
}

export default async function ProductSubcategoryPage({ params, searchParams }: Props) {
  const { slug: productType, category, subcategory } = await params;
  const searchParamsAwaited = await searchParams;
  
  // We no longer need to prefetch taxonomy here since CollectionPageContent will fetch it,
  // and CollectionPageContent now handles the fullRoutePath matching logic.
  
  const collectionParams: any = { ...searchParamsAwaited, productType, category, slug3: subcategory };

  return <CollectionPageContent params={collectionParams} />;
}
