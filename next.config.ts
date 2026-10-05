import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress HTTP responses (gzip/Brotli)
  compress: true,

  // Ensure sharp and @xenova/transformers native binaries are resolved correctly on Vercel
  serverExternalPackages: ['sharp', '@xenova/transformers'],

  typescript: {
    // Standalone `npx tsc --noEmit` validates all types. Next.js worker on Windows
    // encounters SWC WASM serialization bug during internal typecheck.
    ignoreBuildErrors: true,
  },

  // ── Serverless Bundle Inclusions ────────────────────────────────────────────
  // Tell Next.js output-file-tracing to copy the data/ folder into the chatbot
  // API route's serverless bundle. Without this, faq-kb.json and
  // faq-embeddings.json are absent at runtime on Vercel and the chatbot falls
  // back to the error response on every cold start.
  // NOTE: In Next.js 16, this moved OUT of `experimental` to the top level.
  outputFileTracingIncludes: {
    '/api/chatbot': ['./data/**/*'],
  },

  // ── Redirects ───────────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        // Redirect any *.html page to its clean route (e.g., /about.html -> /about)
        source: '/:path*.html',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },

  // ── Image Optimization ──────────────────────────────────────────────────────
  //
  // ARCHITECTURE NOTE:
  //   GCS bucket is PRIVATE.
  //   All product images are served through /api/media/<gcs-key>.
  //   Because the Vercel image optimizer cannot make a recursive call back into
  //   the same serverless deployment, every <Image> that receives a /api/media/
  //   URL MUST use a custom loader (gcsLoader in OptimizedImage.tsx).
  //
  images: {
    remotePatterns: [
      {
        // Allow Next.js to optimize images from public GCS CDN URLs
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: `/${process.env.NEW_PUBLIC_BUCKET_NAME || process.env.GOOGLE_CLOUD_BUCKET_NAME || 'bespokewala-storage'}/**`,
      },
      {
        // Allow Unsplash images (used in homepage CMS sections)
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],

    // Allow /api/media/ and /uploads/ as valid <Image> src values.
    localPatterns: [
      {
        pathname: '/api/media/**',
        // No `search` constraint — allow ?v=thumbnail / ?v=medium / ?v=large
      },
      {
        pathname: '/uploads/**',
      },
    ],

    // Granular breakpoints so mobile (390px) and tablet (768px) get correctly sized images.
    // Fewer entries = fewer variants = faster CDN.
    deviceSizes: [390, 640, 750, 1080, 1920],
    imageSizes: [128, 256, 384, 640],

    // AVIF is ~50% smaller than WebP for photographic content.
    // WebP is the fallback for browsers that don't support AVIF.
    formats: ['image/avif', 'image/webp'],

    // Cache optimized images for 7 days — product images are immutable between uploads.
    // Increased from 1 day to reduce repeated re-processing on Vercel's image optimizer.
    minimumCacheTTL: 604800, // 7 days
  },

  // ── HTTP Caching & Security Headers ─────────────────────────────────────────
  async headers() {
    return [
      {
        // Cache /api/media responses at the CDN layer for 1 year (immutable files)
        source: "/api/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
          },
          {
            key: "Vary",
            value: "Accept-Encoding",
          },
        ],
      },
      {
        // Legacy: aggressively cache any /uploads/ static files (if served directly)
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache public static assets (logo, icons, fonts) for 1 week
        source: "/:path*(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Add security headers to all HTML pages
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

