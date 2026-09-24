import React from 'react';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const revalidate = 60;

interface Props {
  searchParams: Promise<{ page?: string; q?: string; minPrice?: string; maxPrice?: string; colors?: string; size?: string; sort?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'New Arrivals',
    'Shop the latest luxury new arrivals at Bespokewala.',
    '/new-arrivals'
  );
}

export default async function NewArrivalsPage({ searchParams }: Props) {
  const searchParamsAwaited = await searchParams;

  return (
    <CollectionPageContent
      params={{
        ...searchParamsAwaited,
        productType: 'Couture',
        isNewArrival: 'true',
      }}
    />
  );
}
