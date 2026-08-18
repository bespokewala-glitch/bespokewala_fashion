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
 * Strips query strings and trailing slashes for canonical URLs to prevent duplicate indexing
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.split('?')[0].replace(/\/+$/, '');
  const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${SITE_URL}${pathWithSlash}`;
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
  let title = seoOverrides?.title || fallbackTitle;
  
  // Strip ALL existing " | Bespokewala" occurrences from database overrides so the Next.js 
  // global template in layout.tsx can append it exactly once without duplication.
  title = title.replace(new RegExp(`(?:\\s*\\|\\s*${SITE_NAME})+`, 'gi'), '');

  const description = seoOverrides?.description || fallbackDescription;
  
  const url = seoOverrides?.canonicalUrl || getCanonicalUrl(path);
  
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

export function generateCategoryHeading(
  productType?: string,
  category?: string,
  subcategory?: string,
  collectionName?: string
): string {
  const capitalize = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  if (collectionName) {
    return `${capitalize(collectionName)} Collection`;
  }

  const pt = productType ? capitalize(productType) : 'Products';
  
  if (subcategory && category) {
    const sub = capitalize(subcategory);
    const cat = capitalize(category);
    const gender = cat.toLowerCase() === 'womens' ? "Women's" : cat.toLowerCase() === 'mens' ? "Men's" : cat;
    // Handle basic pluralization
    const pluralSub = sub.endsWith('s') ? sub : `${sub}s`;
    return `Luxury ${gender} ${pluralSub}`;
  } else if (category && productType) {
    const cat = capitalize(category);
    const isGender = cat.toLowerCase() === 'womens' || cat.toLowerCase() === 'mens';
    const gender = cat.toLowerCase() === 'womens' ? "Women's" : cat.toLowerCase() === 'mens' ? "Men's" : cat;
    
    if (isGender) {
      return `Luxury ${gender} ${pt}`;
    } else {
      return `Luxury ${cat} – ${pt}`;
    }
  } else if (productType) {
    return `Luxury ${pt} Collection`;
  }
  
  return 'All Products';
}

/**
 * Dynamically generate title and metadata for category pages.
 */
export function generateCategoryMetadata(
  productType: string,
  category?: string,
  subcategory?: string,
  seoOverrides?: SEOFields
): Metadata {
  const capitalize = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  let title = '';
  let description = '';
  let path = `/products/${productType}`;
  
  const pt = capitalize(productType);
  
  if (subcategory && category) {
    const sub = capitalize(subcategory);
    const cat = capitalize(category);
    const gender = cat.toLowerCase() === 'womens' ? 'Women' : cat.toLowerCase() === 'mens' ? 'Men' : cat;
    const pluralSub = sub.endsWith('s') ? sub : `${sub}s`;
    title = `Luxury Designer ${pluralSub} for ${gender}`;
    description = `Explore our exclusive collection of luxury designer ${pluralSub.toLowerCase()} for ${gender.toLowerCase()} at ${SITE_NAME}.`;
    path = `${path}/${category}/${subcategory}`;
  } else if (category) {
    const cat = capitalize(category);
    const isGender = cat.toLowerCase() === 'womens' || cat.toLowerCase() === 'mens';
    const gender = cat.toLowerCase() === 'womens' ? "Women's" : cat.toLowerCase() === 'mens' ? "Men's" : cat;
    
    if (isGender) {
      title = `Luxury ${gender} ${pt}`;
      description = `Discover luxury ${gender.toLowerCase()} ${pt.toLowerCase()} at ${SITE_NAME}.`;
    } else {
      title = `Luxury ${cat} – ${pt}`;
      description = `Explore the ${cat} collection from our ${pt.toLowerCase()} range at ${SITE_NAME}.`;
    }
    path = `${path}/${category}`;
  } else {
    title = `Luxury ${pt} Collection`;
    description = `Shop our luxury ${pt.toLowerCase()} collection at ${SITE_NAME}.`;
  }
  
  return generatePageMetadata(title, description, path, seoOverrides);
}

/**
 * Dynamically generate product metadata
 */
export function generateProductMetadata(
  product: any,
  seoOverrides?: SEOFields,
  fallbackImage?: string
): Metadata {
  return generatePageMetadata(
    product.name,
    product.description?.slice(0, 160) || `Buy ${product.name} at ${SITE_NAME}`,
    `/products/${product.slug}`,
    seoOverrides || product.seo,
    fallbackImage
  );
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
  const schema: any = {
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
  
  if (product.reviews && product.reviews.length > 0) {
    const sum = product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": (sum / product.reviews.length).toFixed(1),
      "reviewCount": product.reviews.length
    };
  }
  
  return schema;
}

export function generateBreadcrumbSchema(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => {
      const cleanHref = item.href.split('?')[0];
      const itemUrl = cleanHref.startsWith('http') ? cleanHref : `${SITE_URL}${cleanHref.startsWith('/') ? '' : '/'}${cleanHref}`;
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
  const cleanUrl = listUrl.split('?')[0];
  const url = cleanUrl.startsWith('http') ? cleanUrl : `${SITE_URL}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
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
