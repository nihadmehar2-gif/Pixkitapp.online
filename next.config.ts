import type { NextConfig } from "next";

// Preview/staging protection with two automatic triggers:
// - NEXT_PUBLIC_INDEXING_MODE=preview (local dev daemon loads .env.preview)
// - VERCEL_ENV, injected by Vercel on every deployment: "preview" (branch/PR
//   deploys) and "development" (vercel dev) are staging; only "production"
//   is indexable. Vercel production deploys therefore need no dashboard
//   configuration and can never inherit noindex.
// Belt-and-braces: sends X-Robots-Tag on every response in preview so even
// non-HTML assets and mis-crawled URLs are excluded from indexes.
const IS_PREVIEW =
  process.env.NEXT_PUBLIC_INDEXING_MODE === "preview" ||
  (typeof process.env.VERCEL_ENV === "string" &&
    process.env.VERCEL_ENV.length > 0 &&
    process.env.VERCEL_ENV !== "production");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Framing: the sandbox preview embeds this site in a cross-origin iframe,
  // so frame-ancestors must allow any parent. X-Frame-Options:SAMEORIGIN was
  // removed because it made the preview show "refused to connect" and cannot
  // express per-origin allowlists. The site has no authenticated actions, so
  // embeddability is acceptable.
  { key: "Content-Security-Policy", value: "frame-ancestors *" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No camera/mic/geolocation needed — image processing is canvas-only.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(IS_PREVIEW ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async redirects() {
    return [
      // The near-lossless compressor was previously published at
      // /lossless-image-compressor. The slug implied mathematically lossless
      // output, which the page itself explicitly disclaims, so it was renamed
      // to match the tool name. Permanent 308 (method + query preserved) so
      // existing external links keep working and equity transfers.
      {
        source: "/lossless-image-compressor",
        destination: "/near-lossless-image-compressor",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
