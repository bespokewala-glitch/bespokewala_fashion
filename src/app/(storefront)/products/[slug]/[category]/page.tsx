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
    const fullRoutePath = `${productType}/${category}`;
    
    // 1. Check exact route match (e.g., 'couture/womens')
    let taxonomy = await getOrFetch(`taxonomy:meta:${fullRoutePath}`, 600, () => 
      Taxonomy.findOne({ slug: fullRoutePath }).lean()
    );
    
    // 2. Fall back to generic slug (e.g., 'womens')
    if (!taxonomy) {
      taxonomy = await getOrFetch(`taxonomy:meta:${category}`, 600, () => 
        Taxonomy.findOne({ slug: category }).lean()
      );
    }

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
    const fullRoutePath = `${productType}/${category}`;
    
    // 1. Check exact route match (e.g., 'couture/womens')
    let taxonomy = await getOrFetch(`taxonomy:meta:${fullRoutePath}`, 600, () => 
      Taxonomy.findOne({ slug: fullRoutePath }).lean()
    );
    
    // 2. Fall back to generic slug (e.g., 'womens')
    if (!taxonomy) {
      taxonomy = await getOrFetch(`taxonomy:meta:${category}`, 600, () => 
        Taxonomy.findOne({ slug: category }).lean()
      );
    }

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
  
  const collectionParams: any = { ...searchParamsAwaited, productType, slug2: category, category: undefined };

  return <CollectionPageContent params={collectionParams} />;
}
