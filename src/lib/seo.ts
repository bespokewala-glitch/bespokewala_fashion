import { Metadata } from 'next';
import { normalizeImageUrl } from './imageUrl';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';
export const SITE_NAME = 'Bespokewala';

// Default OG image — shown when no product/category image is available
export const DEFAULT_OG_IMAGE = `${SITE_URL}/about-hero.png`;

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
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';

  // Force production domain for canonicals if baseUrl is localhost, ngrok, or vercel preview
  if (
    baseUrl.includes('localhost') ||
    baseUrl.includes('ngrok') ||
    baseUrl.includes('vercel.app')
  ) {
    baseUrl = 'https://www.bespokewala.com';
  }

  // Remove trailing slash from base url if present
  baseUrl = baseUrl.replace(/\/+$/, '');

  // Strip query string and remove trailing slashes from path
  let cleanPath = path.split('?')[0].replace(/\/+$/, '');

  // Handle root vs nested paths
  if (cleanPath === '') {
    return `${baseUrl}/`; // Root domain canonical usually has trailing slash
  }

  const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${baseUrl}${pathWithSlash}`;
}

/**
 * Generate Next.js Metadata based on provided SEO overrides or fallbacks.
 * Automatically includes canonical URL, OpenGraph, and Twitter metadata.
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
  let imageUrl = rawImage ? normalizeImageUrl(rawImage) : undefined;

  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${SITE_URL}${imageUrl}`;
  }

  // Fall back to the site default OG image if no specific image is available
  const finalImageUrl = imageUrl || DEFAULT_OG_IMAGE;

  const twitterImageUrl = finalImageUrl
    ? `${finalImageUrl}${finalImageUrl.includes('?') ? '&' : '?'}twitter=1`
    : undefined;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: finalImageUrl, width: 1200, height: 630, alt: `${title} | ${SITE_NAME}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: twitterImageUrl ? [twitterImageUrl] : undefined,
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

/**
 * Generate metadata for static informational pages (About, Contact, FAQ, etc.)
 * This is a convenience wrapper that ensures OG, Twitter, and canonical are always set.
 */
export function generateStaticPageMetadata(
  title: string,
  description: string,
  path: string,
  opts?: { keywords?: string; image?: string; noIndex?: boolean }
): Metadata {
  return generatePageMetadata(title, description, path, opts);
}

export function generateCategoryHeading(
  productType?: string,
  category?: string,
  subcategory?: string,
  collectionName?: string,
  contextName?: string
): string {
  const capitalize = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const ctx = contextName ? `${capitalize(contextName)} ` : '';

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
    return `Luxury ${gender} ${ctx}${pluralSub}`;
  } else if (category && productType) {
    const cat = capitalize(category);
    const isGender = cat.toLowerCase() === 'womens' || cat.toLowerCase() === 'mens';
    const gender = cat.toLowerCase() === 'womens' ? "Women's" : cat.toLowerCase() === 'mens' ? "Men's" : cat;

    if (isGender) {
      return `Luxury ${gender} ${ctx}${pt}`;
    } else {
      return `Luxury ${cat} – ${ctx}${pt}`;
    }
  } else if (productType) {
    return `Luxury ${ctx}${pt} Collection`;
  }

  return contextName ? `${capitalize(contextName)} Collection` : 'All Products';
}

/**
 * Dynamically generate title and metadata for category pages.
 */
export function generateCategoryMetadata(
  productType: string,
  category?: string,
  subcategory?: string,
  seoOverrides?: SEOFields,
  fallbackImage?: string
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
    description = `Explore our exclusive collection of luxury designer ${pluralSub.toLowerCase()} for ${gender.toLowerCase()} at ${SITE_NAME}. Shop handcrafted Indian fashion with timeless elegance.`;
    path = `${path}/${category}/${subcategory}`;
  } else if (category) {
    const cat = capitalize(category);
    const isGender = cat.toLowerCase() === 'womens' || cat.toLowerCase() === 'mens';
    const gender = cat.toLowerCase() === 'womens' ? "Women's" : cat.toLowerCase() === 'mens' ? "Men's" : cat;

    if (isGender) {
      title = `Luxury ${gender} ${pt}`;
      description = `Discover luxury ${gender.toLowerCase()} ${pt.toLowerCase()} at ${SITE_NAME}. Handcrafted Indian fashion for every occasion.`;
    } else {
      title = `Luxury ${cat} – ${pt}`;
      description = `Explore the ${cat} collection from our ${pt.toLowerCase()} range at ${SITE_NAME}. Timeless Indian luxury fashion.`;
    }
    path = `${path}/${category}`;
  } else {
    title = `Luxury ${pt} Collection`;
    description = `Shop our luxury ${pt.toLowerCase()} collection at ${SITE_NAME}. Discover handcrafted Indian fashion with exceptional design and quality.`;
  }

  return generatePageMetadata(title, description, path, seoOverrides, fallbackImage);
}

/**
 * Dynamically generate product metadata using actual product data from MongoDB.
 * Builds a rich, unique title and description from the product's attributes.
 */
export function generateProductMetadata(
  product: any,
  seoOverrides?: SEOFields,
  fallbackImage?: string
): Metadata {
  const path = `/products/${product.slug}`;
  const capitalize = (str: string) =>
    str ? str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

  // ── Build a rich, unique SEO title ──────────────────────────────────────────
  // Pattern: {Product Name} | Designer {Category} | Bespokewala
  // (the root layout template appends "| Bespokewala" so we just provide the first two parts)
  let formattedTitle: string;
  if (product.category) {
    formattedTitle = `${product.name} | Designer ${capitalize(product.category)}`;
  } else if (product.productType) {
    formattedTitle = `${product.name} | Designer ${capitalize(product.productType)}`;
  } else {
    formattedTitle = product.name;
  }

  // ── Build a rich, unique meta description from real product attributes ──────
  // Only use attributes that actually exist — never invent data.
  let fallbackDesc = '';
  if (!seoOverrides?.description && !product.seo?.description) {
    const parts: string[] = [];

    // Lead with the product name + category context
    const categoryLabel = product.category ? capitalize(product.category) : capitalize(product.productType);
    parts.push(`Shop the ${product.name}${categoryLabel ? ` — a luxury designer ${categoryLabel.toLowerCase()}` : ''} from Bespokewala.`);

    // Colour
    if (product.colors && product.colors.length > 0) {
      parts.push(`Available in ${product.colors.join(', ')}.`);
    }

    // Fabric / Composition — check both top-level (legacy) and details sub-object
    const fabric = product.fabric || product.details?.composition || product.details?.commodityName;
    if (fabric) {
      parts.push(`Crafted in ${fabric}.`);
    }

    // Occasion
    if (product.occasion) {
      parts.push(`Perfect for ${capitalize(product.occasion)}.`);
    }

    // Subcategory / Collection context (e.g. "Bridal Lehenga", "Wedding Collection")
    if (product.subcategory && product.subcategory !== product.category) {
      parts.push(`Part of our ${capitalize(product.subcategory)} range.`);
    } else if (product.collectionName) {
      parts.push(`From the ${capitalize(product.collectionName)} collection.`);
    }

    // Fallback: use the first 140 chars of the product description if we have nothing else
    if (parts.length === 1 && product.description) {
      parts.push(product.description.slice(0, 140).trimEnd());
    }

    fallbackDesc = parts.join(' ');
  } else {
    // Use the custom description from DB or seoOverrides, but trim to avoid >160 chars in SERP
    fallbackDesc = seoOverrides?.description || product.seo?.description || product.description?.slice(0, 160) || `Buy ${product.name} at ${SITE_NAME}.`;
  }

  return generatePageMetadata(
    formattedTitle,
    fallbackDesc,
    path,
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
    // Uses the correct public-facing logo file (PNG, available in /public)
    "logo": `${SITE_URL}/bespoken-transparent.png`,
    "sameAs": [
      "https://www.instagram.com/bespokewala",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English"
    }
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    // SearchAction enables Google Sitelinks Search Box in SERP
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/products?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateProductSchema(product: any, allImages: { url: string; alt?: string }[]) {
  // Prefer a real style code as SKU; fall back to the URL slug
  const sku = product.details?.styleCode || product.slug;

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": allImages.map(img => img.url),
    "description": product.seo?.description || product.description,
    "sku": sku,
    "brand": {
      "@type": "Brand",
      "name": SITE_NAME
    },
    "offers": {
      "@type": "Offer",
      "url": getCanonicalUrl(`/products/${product.slug}`),
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.inventoryCount ?? 1) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    }
  };

  // Only add aggregateRating if there are real reviews — never fabricate ratings
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
        "url": getCanonicalUrl(`/products/${product.slug}`),
        "image": product.images?.[0] ? normalizeImageUrl(product.images[0]) : undefined
      }
    }))
  };
}

/**
 * Generate FAQPage structured data for the FAQ page.
 * Enables FAQ rich results (accordion) in Google SERP.
 * Pass an array of { question, answer } objects derived from your FAQ content.
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
