import { Metadata } from 'next';
import { normalizeImageUrl } from './imageUrl';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';
export const SITE_NAME = 'Bespokewala';

export interface SEOFields {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  image?: string;
}

/**
 * Generate Next.js Metadata based on provided SEO overrides or fallbacks.
 */
export function generatePageMetadata(
  fallbackTitle: string,
  fallbackDescription: string,
  path: string,
  seoOverrides?: SEOFields,
  fallbackImage?: string
): Metadata {
  const title = seoOverrides?.title || fallbackTitle;
  const description = seoOverrides?.description || fallbackDescription;
  
  // Handle absolute URL paths correctly
  const pathWithSlash = path.startsWith('/') ? path : `/${path}`;
  const url = seoOverrides?.canonicalUrl || `${SITE_URL}${pathWithSlash}`;
  
  const rawImage = seoOverrides?.image || fallbackImage;
  const imageUrl = rawImage ? normalizeImageUrl(rawImage) : undefined;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };

  if (seoOverrides?.keywords) {
    metadata.keywords = seoOverrides.keywords;
  }

  if (seoOverrides?.noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}

// ─── Schema Generators (JSON-LD) ─────────────────────────────────────────────

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
  };
}

export function generateProductSchema(product: any, allImages: { url: string }[]) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": allImages.map(img => img.url),
    "description": product.seo?.description || product.description,
    "sku": product.slug,
    "brand": {
      "@type": "Brand",
      "name": SITE_NAME
    },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.inventoryCount ?? 1) > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock"
    }
  };
}

export function generateBreadcrumbSchema(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => {
      // Ensure href forms a complete absolute URL
      const itemUrl = item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href.startsWith('/') ? '' : '/'}${item.href}`;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        "item": itemUrl
      };
    })
  };
}

export function generateItemListSchema(products: any[], listUrl: string) {
  const url = listUrl.startsWith('http') ? listUrl : `${SITE_URL}${listUrl.startsWith('/') ? '' : '/'}${listUrl}`;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "url": url,
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "url": `${SITE_URL}/products/${product.slug}`,
        "image": product.images?.[0] ? normalizeImageUrl(product.images[0]) : undefined
      }
    }))
  };
}
