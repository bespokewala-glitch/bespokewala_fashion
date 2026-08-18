import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { generatePageMetadata } from '@/lib/seo';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category } = await params;
  const pt = productType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const cat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  try {
    await dbConnect();
    const taxonomy = await Taxonomy.findOne({ slug: category, type: { $in: ['category', 'collection'] } }).lean();
    if (taxonomy && taxonomy.seo) {
      return generatePageMetadata(
        `${cat} – ${pt} | Bespokewala`,
        `Explore the ${cat} collection from our ${pt.toLowerCase()} range at Bespokewala.`,
        `/products/${productType}/${category}`,
        taxonomy.seo
      );
    }
  } catch (err) {}

  return generatePageMetadata(
    `${cat} – ${pt} | Bespokewala`,
    `Explore the ${cat} collection from our ${pt.toLowerCase()} range at Bespokewala.`,
    `/products/${productType}/${category}`
  );
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
  const { page } = await searchParams;
  return <CollectionPageContent params={{ productType, category, page }} />;
}
