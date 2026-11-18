/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

/**
 * Security headers applied to every response.
 *
 * Notes on the CSP:
 * - `script-src` still allows 'unsafe-inline' because Next.js injects inline
 *   bootstrap scripts and layout.tsx sets the theme before first paint. A
 *   nonce-based policy is the stronger end state; it is deferred until the
 *   Next.js upgrade (see SECURITY-REVIEW.md) because nonce handling in this
 *   Next version is affected by GHSA-ffhc-5mcf-pf4q.
 * - `frame-ancestors 'none'` + X-Frame-Options blocks clickjacking.
 * - `object-src 'none'` and `base-uri 'self'` remove plugin and base-tag abuse.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "manifest-src 'self'",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  // Google profile pictures come from lh3.googleusercontent.com (and older
  // lh4-lh6 hosts). Without these, OAuth avatars are blocked and render as a
  // broken-image icon.
  "img-src 'self' data: blob: https://ik.imagekit.io https://*.supabase.co https://lh3.googleusercontent.com https://*.googleusercontent.com https://avatars.githubusercontent.com",
  "media-src 'self' blob: https://*.supabase.co",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://upload.imagekit.io https://api.imagekit.io",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // No remote image patterns are declared. The image optimizer therefore only
  // ever processes same-origin, repository-owned assets, which removes the
  // remote-fetch surface behind the Image Optimization advisories.
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // The signed Android release. Chrome must receive the APK MIME type
        // and an attachment disposition so it downloads the file instead of
        // trying to render it.
        source: "/luminest.apk",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="luminest.apk"',
          },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // The manifest is fetched same-origin, so it needs no CORS headers —
        // same-origin responses bypass the ACAO check entirely. Only the MIME
        // type is worth correcting: the spec recommends
        // application/manifest+json over the default application/json.
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
