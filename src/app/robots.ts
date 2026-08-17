import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';

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
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
