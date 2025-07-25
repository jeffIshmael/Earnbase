/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },
  images: {
    domains: ['cdn-production-opera-website.operacdn.com', 'ipfs.io', 'gateway.pinata.cloud'],
  },
  transpilePackages: ["@0xsquid/widget", "@0xsquid/react-hooks"],
};

module.exports = nextConfig;