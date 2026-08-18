import { Metadata } from 'next';
import { CollectionPageContent } from '@/components/layout/CollectionPageContent';
import { generatePageMetadata } from '@/lib/seo';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; category: string; subcategory: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: productType, category, subcategory } = await params;
  const pt = productType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const cat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const sub = subcategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  try {
    await dbConnect();
    const taxonomy = await Taxonomy.findOne({ slug: subcategory, type: 'category' }).lean();
    if (taxonomy && taxonomy.seo) {
      return generatePageMetadata(
        `${sub} – ${cat} | Bespokewala`,
        `Shop ${sub.toLowerCase()} from the ${cat} ${pt.toLowerCase()} collection at Bespokewala. Luxury jewellery crafted to perfection.`,
        `/products/${productType}/${category}/${subcategory}`,
        taxonomy.seo
      );
    }
  } catch (err) {}

  return generatePageMetadata(
    `${sub} – ${cat} | Bespokewala`,
    `Shop ${sub.toLowerCase()} from the ${cat} ${pt.toLowerCase()} collection at Bespokewala. Luxury jewellery crafted to perfection.`,
    `/products/${productType}/${category}/${subcategory}`
  );
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
  console.log("====== MATCHED SUBCATEGORY PAGE ======", { productType, category, subcategory, page });
  return <CollectionPageContent params={{ productType, category, subcategory, page }} />;
}
