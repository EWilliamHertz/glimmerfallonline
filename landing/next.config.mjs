/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/landing',
  assetPrefix: '/landing',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wqnuijtdmorxprhl.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'v3b.fal.media',
      },
      {
        protocol: 'https',
        hostname: 'o20ql1pn6r6cwj04.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
