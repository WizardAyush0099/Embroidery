/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Private surfaces must never be cached by a shared proxy.
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
  // Cloud previews proxy the dev server from another origin; set NEXT_DEV_ORIGIN
  // to that hostname locally so hot reload resources are allowed.
  allowedDevOrigins: process.env.NEXT_DEV_ORIGIN ? [process.env.NEXT_DEV_ORIGIN] : [],
  experimental: {
    serverActions: {
      // Custom embroidery requests and product galleries can carry several images.
      bodySizeLimit: "25mb",
    },
    // Keep recently visited pages in the client router cache so moving back and
    // forth through the storefront is instant instead of a fresh server round trip.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
