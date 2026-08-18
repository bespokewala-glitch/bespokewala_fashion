import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Taxonomy from '@/models/Taxonomy';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { getCanonicalUrl } = await import('@/lib/seo');
  
  // Use getCanonicalUrl directly for base so we get the production domain correctly overridden
  const siteUrl = getCanonicalUrl('/').replace(/\/$/, '');

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/products/couture`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/products/jewellery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/products/footwear`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/products/beauty`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/products/diffusion`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  ];

  try {
    await dbConnect();
    
    // Add dynamic taxonomies
    const taxonomies = await Taxonomy.find({ enabled: true }).select('slug type updatedAt seo').lean();
    taxonomies.forEach((tax: any) => {
      if (!tax.slug || tax.seo?.noIndex) return;
      
      let urlPath = `/products`;
      if (tax.type === 'category' || tax.type === 'collection') {
        if (tax.productTypes && tax.productTypes.length > 0) {
          urlPath = `/products/${tax.productTypes[0]}/${tax.slug}`;
        } else {
          urlPath = `/products/${tax.slug}`; // Changed from query params to avoid duplicate issues
        }
      } else {
        // Fallback for occasion or other types - generally we don't index ?query parameters in sitemap
        // but if it's an occasion taxonomy it might have a dedicated path eventually
        return; 
      }

      routes.push({
        url: getCanonicalUrl(urlPath),
        lastModified: tax.updatedAt ? new Date(tax.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Add public products
    // TODO(SEO): If product count exceeds 10,000, implement Next.js generateSitemaps() 
    // to split sitemaps into chunks and prevent timeout/size limits.
    const products = await Product.find({ 'seo.noIndex': { $ne: true } }).select('slug productType category subcategory updatedAt').lean();
    
    products.forEach((product: any) => {
      if (!product.slug) return;
      
      const productPath = `/products/${product.slug}`;

      routes.push({
        url: getCanonicalUrl(productPath),
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // De-duplicate URLs just in case
  const uniqueUrls = new Set<string>();
  const uniqueRoutes: MetadataRoute.Sitemap = [];
  
  for (const route of routes) {
    if (!uniqueUrls.has(route.url)) {
      uniqueUrls.add(route.url);
      uniqueRoutes.push(route);
    }
  }

  return uniqueRoutes;
}
