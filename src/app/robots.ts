import { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { getCanonicalUrl } = await import('@/lib/seo');
  
  // Use getCanonicalUrl directly for base so we get the production domain correctly overridden
  const siteUrl = getCanonicalUrl('/').replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/products',
      ],
      disallow: [
        '/admin',
        '/api',
        '/account',
        '/cart',
        '/checkout',
        '/login',
        '/register',
        '/wishlist',
        '/*?sort=*',
        '/*?size=*',
        '/*?price=*',
        '/*?page=*',
        '/*?color=*',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
