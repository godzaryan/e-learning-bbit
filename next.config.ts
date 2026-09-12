import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers for all pages
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://drive.google.com https://*.googleusercontent.com",
              "frame-src https://drive.google.com https://docs.google.com",
              "connect-src 'self'",
              "media-src 'self' https://drive.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Stricter headers for API routes
        source: "/api/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },

  // Redirect double-slash and malicious URL patterns to prevent open redirects
  async redirects() {
    return [
      {
        // Block //anything (open redirect via double slash)
        source: "/explore//:path*",
        destination: "/explore",
        permanent: false,
      },
    ];
  },

  // Prevent source maps in production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
