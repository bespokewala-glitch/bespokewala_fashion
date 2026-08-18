import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress HTTP responses
  compress: true,

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
  //   URL MUST use:
  //
  //     unoptimized={shouldBypassOptimizer(src)}   // from @/lib/imageUrl
  //
  //   This is enforced component-by-component — NOT globally — so that external
  //   images (Unsplash, public CDN) still benefit from Next.js optimization.
  //
  images: {
    remotePatterns: [
      {
        // Allow Next.js to optimize images from public GCS CDN URLs
        // (these only appear as fallbacks — primary images go via /api/media/)
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: `/${process.env.GOOGLE_CLOUD_BUCKET_NAME || 'bespokewala-storage'}/**`,
      },
      {
        // Allow Unsplash images (used in homepage CMS sections)
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],

    // Allow /api/media/ and /uploads/ as valid <Image> src values.
    // NOTE: We intentionally DO NOT set `search: ''` here — that would block
    //       URLs with query params like /api/media/uploads/file.png?v=thumbnail.
    //       Since we already use unoptimized={true} for all /api/media/ URLs,
    //       Next.js will never actually try to optimize these paths.
    localPatterns: [
      {
        pathname: '/api/media/**',
        // No `search` constraint — allow ?v=thumbnail / ?v=medium / ?v=large
      },
      {
        pathname: '/uploads/**',
      },
    ],

    // Serve images at these breakpoints only (fewer variants = faster CDN processing)
    deviceSizes: [640, 1080, 1920],
    imageSizes: [320, 480, 640],

    // WebP has ~30% better compression than JPEG/PNG
    formats: ['image/webp'],

    // Cache optimized images for 60 seconds minimum
    minimumCacheTTL: 60,
  },

  // ── HTTP Caching Headers ────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Cache /api/media responses at the CDN layer.
        // Individual responses also set Cache-Control: public, max-age=31536000, immutable
        // so Vercel's Edge Network caches them aggressively.
        source: "/api/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
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
        // Cache public static assets (logo, icons, fonts) for 1 day
        source: "/:path*(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
