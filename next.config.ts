import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/business-desk/documents/*": [
      "./public/fonts/manrope-400.ttf",
      "./public/fonts/manrope-700.ttf",
      "./public/brand/mega-stride-logo.jpg",
    ],
    "/api/business-desk/reports": ["./public/fonts/manrope-400.ttf"],
    "/api/internal/notifications": [
      "./public/fonts/manrope-400.ttf",
      "./public/fonts/manrope-700.ttf",
      "./public/brand/mega-stride-logo.jpg",
    ],
    "/api/academy/certificates/*": [
      "./public/fonts/manrope.ttf",
      "./public/brand/mega-stride-logo.jpg",
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};
export default config;
