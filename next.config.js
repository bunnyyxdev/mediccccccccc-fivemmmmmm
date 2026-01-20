/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'mediccccccccc-fivemmmmmm.vercel.app',
      },
    ],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'administrator',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'exampleadminpassword',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    DISCORD_FEEDBACK_URL: process.env.DISCORD_FEEDBACK_URL,
    DISCORD_WEBHOOK_WITHDRAWALS: process.env.DISCORD_WEBHOOK_WITHDRAWALS,
    DISCORD_WEBHOOK_BLACKLIST: process.env.DISCORD_WEBHOOK_BLACKLIST,
  },
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
