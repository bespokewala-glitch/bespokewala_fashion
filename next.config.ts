import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress HTTP responses
  compress: true,

  // Enable Next.js Image Optimization for external URLs (like Unsplash).
  // Private GCS images are served via the authenticated /api/media/ proxy.
  // We bypass Vercel's image optimizer for these proxy URLs using unoptimized={true}
  // to avoid recursive INVALID_IMAGE_OPTIMIZE_REQUEST errors.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        // Match ALL objects in ALL subfolders inside the bucket
        pathname: `/${process.env.GOOGLE_CLOUD_BUCKET_NAME || 'bespokewala-storage'}/**`,
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Allow /api/media/ proxy paths as valid next/image sources.
    // Images using this path get unoptimized={true} so the browser fetches the proxy directly.
    localPatterns: [
      {
        pathname: '/api/media/**',
        search: '',
      },
      {
        pathname: '/uploads/**',
        search: '',
      },
    ],
    // Serve images at these breakpoints only (fewer variants = faster processing)
    deviceSizes: [640, 1080, 1920],
    imageSizes: [320, 480, 640],
    // WebP has ~30% better compression than JPEG/PNG
    formats: ['image/webp'],
    // Cache optimized images for 60 seconds minimum
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
