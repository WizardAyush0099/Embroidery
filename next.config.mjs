/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  // Cloud previews proxy the dev server from another origin; set NEXT_DEV_ORIGIN
  // to that hostname locally so hot reload resources are allowed.
  allowedDevOrigins: process.env.NEXT_DEV_ORIGIN ? [process.env.NEXT_DEV_ORIGIN] : [],
  experimental: {
    serverActions: {
      // Custom embroidery requests and product galleries can carry several images.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
