import { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Identify if we are currently running on a staging/development/ngrok domain
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';
  
  // A robust check to see if this is a non-production environment
  const isNonProduction = rawBaseUrl.includes('localhost') || 
                          rawBaseUrl.includes('ngrok') || 
                          rawBaseUrl.includes('vercel.app') ||
                          (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');

  // If non-production (e.g., ngrok, local, staging), strictly block all crawling 
  // and do NOT include the sitemap URL.
  if (isNonProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // Production Environment: allow crawling, block private/utility paths, and include sitemap
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
      ],
      disallow: [
        '/admin',
        '/dashboard',
        '/api',
        '/account',
        '/cart',
        '/checkout',
        '/login',
        '/register',
        '/wishlist',
        '/forgot-password',
        '/track-order',
        '/*?sort=*',
        '/*?size=*',
        '/*?price=*',
        '/*?page=*',
        '/*?color=*',
        '/*?minPrice=*',
        '/*?maxPrice=*',
        '/*?colors=*',
        '/*?q=*',
      ],
    },
    sitemap: 'https://www.bespokewala.com/sitemap.xml',
  };
}
