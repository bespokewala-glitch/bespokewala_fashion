import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Taxonomy from '@/models/Taxonomy';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';

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
          urlPath = `/products?category=${tax.slug}`;
        }
      } else {
        urlPath = `/products?${tax.type}=${tax.slug}`;
      }

      routes.push({
        url: `${siteUrl}${urlPath}`,
        lastModified: tax.updatedAt ? new Date(tax.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Add public products
    const products = await Product.find({ 'seo.noIndex': { $ne: true } }).select('slug updatedAt').lean();
    
    products.forEach((product: any) => {
      if (!product.slug) return;
      routes.push({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
