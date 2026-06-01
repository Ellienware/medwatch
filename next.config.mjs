/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
images: {
  unoptimized: true,
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'fra.cloud.appwrite.io',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
    },
  ],
},
  poweredByHeader: false,
}

export default nextConfig
