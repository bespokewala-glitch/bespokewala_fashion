import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress HTTP responses
  compress: true,

  // Enable Next.js Image Optimization for all GCS objects
  // Images are always served directly from the public GCS bucket CDN.
  // The /api/media proxy is only used for streaming (videos, private files)
  // and is NOT used as an image source for next/image anymore.
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
