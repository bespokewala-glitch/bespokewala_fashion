import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import Taxonomy from '@/models/Taxonomy';
import { getCanonicalUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getCanonicalUrl('/').replace(/\/$/, '');

  // ── Static routes ───────────────────────────────────────────────────────────
  // These are the known, always-present indexable pages.
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // ── Main department pages ────────────────────────────────────────────────
    {
      url: `${siteUrl}/products/couture`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/products/jewellery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/products/footwear`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
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
    },
    // ── Informational / Brand pages ──────────────────────────────────────────
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/press`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/consultation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // ── Support / Utility pages ──────────────────────────────────────────────
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/size-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // ── Legal pages (low priority but should be included for completeness) ───
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    // ── Excluded (noindex pages — do NOT add these) ──────────────────────────
    // /cart, /checkout, /account, /wishlist, /login, /register, /track-order,
    // /forgot-password, /products (generic — redirects for couture, thin catch-all otherwise)
  ];

  try {
    await dbConnect();
    
    // ── Dynamic taxonomy pages (categories and collections from MongoDB) ──────
    // TODO(SEO): If taxonomy count grows large, add pagination.
    const taxonomies = await Taxonomy.find({ enabled: true }).select('slug type updatedAt seo productTypes').lean();
    taxonomies.forEach((tax: any) => {
      if (!tax.slug || tax.seo?.noIndex) return;
      
      // Only include category and collection pages that have a parent product type
      // to avoid short-path cannibalization (e.g. /products/womens without a context)
      if (tax.type === 'category' || tax.type === 'collection') {
        if (tax.productTypes && tax.productTypes.length > 0) {
          const urlPath = `/products/${tax.productTypes[0]}/${tax.slug}`;
          routes.push({
            url: getCanonicalUrl(urlPath),
            lastModified: tax.updatedAt ? new Date(tax.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
        // If no parent productType, skip — the page has no canonical URL context
        return;
      }
      // Occasion pages and other generic taxonomies — skip (they are query-param filtered pages)
    });

    // ── Dynamic product pages ────────────────────────────────────────────────
    // TODO(SEO): If product count exceeds 10,000, implement Next.js generateSitemaps()
    // to split sitemaps into chunks and prevent timeout/size limits.
    const products = await Product.find({ 'seo.noIndex': { $ne: true } })
      .select('slug updatedAt')
      .lean();
    
    products.forEach((product: any) => {
      if (!product.slug) return;
      routes.push({
        url: getCanonicalUrl(`/products/${product.slug}`),
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

  } catch (error) {
    console.error('[sitemap.ts] Error generating dynamic sitemap entries:', error);
  }

  // ── De-duplicate URLs ────────────────────────────────────────────────────────
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
