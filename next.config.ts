import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // Disable caching for development
  poweredByHeader: false,
  
  // Disable ESLint during builds for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during builds for now
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Headers configuration to prevent aggressive caching and fix cross-site issues
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          // Cross-site問題を解決するためのヘッダー
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // 認証コールバックページ用の特別設定
      {
        source: '/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          // SameSite Cookieを許可
          {
            key: 'Set-Cookie',
            value: 'SameSite=Lax; Secure=false',
          },
        ],
      },
    ];
  },
  
  // Experimental features to improve development experience
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  
  // cross-site問題を解決するためのリライト設定
  async rewrites() {
    return [
      // Supabaseコールバックのproxy
      {
        source: '/auth/v1/callback',
        destination: '/auth/supabase-callback',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
