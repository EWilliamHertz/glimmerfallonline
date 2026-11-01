/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wqnuijtdmorxprhl.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'v3b.fal.media',
      },
    ],
  },
};

export default nextConfig;
