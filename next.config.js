/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['crypto'],
  },
};

module.exports = nextConfig;
