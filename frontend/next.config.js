/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure client‑side routes work on Vercel/Render refreshes.
  async rewrites() {
    return [
      {
        source: '/((?!api).*)',
        destination: '/',
      },
    ];
  },
};

module.exports = nextConfig;
