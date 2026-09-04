import React from 'react';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongoose';
import { getOrFetch } from '@/lib/serverCache';
import { generateCategoryMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

export const revalidate = 60;

interface Props {
  params: Promise<{ category: string[] }>;
  searchParams: Promise<{ page?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; size?: string; occasion?: string; sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slugArray } = await params;
  if (!slugArray || slugArray.length === 0) return {};
  
  const productType = slugArray[0];
  const category = slugArray[1];
  const subcategory = slugArray[2];
  
  // Use the deepest slug for metadata lookup
  const deepestSlug = slugArray[slugArray.length - 1];

  await dbConnect();
  const taxonomy = await getOrFetch(`taxonomy:meta:${deepestSlug}`, 300, () => {
    import('@/models/Taxonomy');
    return import('mongoose').then(m => m.models.Taxonomy?.findOne({ slug: deepestSlug }).select('seo').lean() || null);
  }) as any;

  return generateCategoryMetadata(deepestSlug, undefined, undefined, taxonomy?.seo);
}

export default async function ProductsCategoryPage({ params, searchParams }: Props) {
  const { category: slugArray } = await params;
  const searchParamsAwaited = await searchParams;

  if (!slugArray || slugArray.length === 0) {
    notFound();
  }

  const productType = slugArray[0];
  const category = slugArray.length > 1 ? slugArray[1] : undefined;
  const subcategory = slugArray.length > 2 ? slugArray[2] : undefined;
  const collectionName = slugArray.length > 3 ? slugArray[3] : undefined;

  return (
    <CollectionPageContent 
      params={{ 
        ...searchParamsAwaited, 
        productType,
        category,
        subcategory,
        collectionName
      }} 
    />
  );
}
