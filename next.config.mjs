/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['undici', 'cheerio', 'frames.js'],
  serverRuntimeConfig: {
    maxDuration: 60
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: '/api/well-known/farcaster'
      }
    ];
  }
};

export default nextConfig;
