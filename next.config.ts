import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration
  // Empty config to silence warning - Turbopack handles WalletConnect dependencies fine in dev mode
  turbopack: {
    root: process.cwd(),
  },

  // React strict mode for better development experience
  reactStrictMode: true,

  // Performance and security optimizations
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: false,
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-*"],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
