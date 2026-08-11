import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress HTTP responses
  compress: true,

  // Enable Next.js Image Optimization for local uploads
  // This auto-converts images to WebP and serves them at the right size
  images: {
    // Allow optimization for Google Cloud Storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: `/${process.env.GOOGLE_CLOUD_BUCKET_NAME || 'bespokewala-webapp-prod'}/**`,
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      }
    ],
    // Allow local API routes with query parameters for next/image
    localPatterns: [
      {
        pathname: '/api/media/**',
        search: '',
      },
      {
        pathname: '/uploads/**',
        search: '',
      }
    ],
    // Serve images at these breakpoints only (fewer variants = faster processing)
    deviceSizes: [640, 1080, 1920],
    imageSizes: [320, 480, 640],
    // WebP has ~30% better compression than JPEG/PNG
    formats: ['image/webp'],
    // Cache optimized images for 60 seconds (dev) — use longer in prod
    minimumCacheTTL: 60,
  },

  // HTTP caching headers for static assets
  async headers() {
    return [
      {
        // Aggressively cache product images — they never change once uploaded
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache public static files (logo, icons) for 1 day
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
