/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['undici', 'cheerio', 'frames.js'],
  serverRuntimeConfig: {
    maxDuration: 60
  }
};

export default nextConfig;
