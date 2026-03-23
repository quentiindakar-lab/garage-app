/** @type {import('next').NextConfig} */
const isTurbopack = process.env.TURBOPACK === "1" || process.env.NEXT_TURBOPACK === "1";

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  experimental: {
    ...(isTurbopack ? {} : { forceSwcTransforms: true }),
  },
};

export default nextConfig;
