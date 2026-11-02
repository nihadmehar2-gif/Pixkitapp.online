import type { Metadata } from "next";
import { SITE_URL } from "@/lib/tools";

/**
 * Indexing mode switch — preview/staging detection is automatic.
 *
 * Two independent triggers, so a staging host can never become indexable:
 *
 * 1. NEXT_PUBLIC_INDEXING_MODE=preview — explicit opt-in used by the local
 *    dev daemon (.env.preview) on the temporary ChatZ preview environment.
 *
 * 2. VERCEL_ENV — Vercel injects this on every deployment: "production" for
 *    production, "preview" for branch/PR deployments, "development" for
 *    `vercel dev`. Any Vercel deployment that is not production is staging.
 *    This requires zero Vercel dashboard configuration and production
 *    deployments keep full index,follow directives (they cannot inherit
 *    noindex because their VERCEL_ENV is exactly "production").
 *
 * When IS_PREVIEW is true: every page emits `noindex, nofollow`, robots.txt
 * disallows all crawlers, the sitemap route returns an empty document, and
 * next.config adds an X-Robots-Tag header on every response — the temporary
 * preview domain must never become indexable and must not publish production
 * SEO signals.
 *
 * Production (vars unset, or VERCEL_ENV=production) → indexable config.
 */
const VERCEL_STAGING =
  typeof process.env.VERCEL_ENV === "string" &&
  process.env.VERCEL_ENV.length > 0 &&
  process.env.VERCEL_ENV !== "production";

export const IS_PREVIEW =
  process.env.NEXT_PUBLIC_INDEXING_MODE === "preview" || VERCEL_STAGING;

/** Robots directive applied site-wide (inherited by every page). */
export const ROBOTS_DIRECTIVES: Metadata["robots"] = IS_PREVIEW
  ? { index: false, follow: false, googleBot: { index: false, follow: false } }
  : { index: true, follow: true };

/**
 * Stable, publicly served social sharing image — 1200×630 PNG in /public
 * (professional branded card, <300 KB). Resolves to the absolute production
 * URL https://www.pixkitapp.online/og-default.png via metadataBase, so scrapers
 * always see a production asset that will exist once the site is deployed
 * (it ships in /public).
 */
export const OG_IMAGE = "/og-default.png";
export const OG_IMAGE_ALT =
  "PixKitApp — 127 free online image tools that run privately in your browser";

/** Shared Open Graph image entries (absolute URLs resolved via metadataBase). */
export const OG_IMAGES = [
  { url: OG_IMAGE, width: 1200, height: 630, alt: OG_IMAGE_ALT },
];

/**
 * Complete, consistent Open Graph + Twitter card metadata for a page.
 * Every indexable page spreads this in, so social tags are never missing
 * and never conflict (exactly one og:title/og:image/... per page).
 */
export function socialMeta(opts: {
  title: string;
  description: string;
  /** Path beginning with "/" — canonical + og:url are built from SITE_URL. */
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const url = `${SITE_URL}${opts.path}`;
  return {
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "PixKitApp",
      type: "website",
      locale: "en_US",
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: OG_IMAGES,
    },
  };
}
