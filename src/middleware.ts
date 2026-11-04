import { NextRequest, NextResponse } from "next/server";

/**
 * Runtime URL-integrity + staging-protection layer.
 *
 * 1) Canonical host enforcement (single-hop permanent redirects).
 *
 *    The one canonical host is the apex, https://pixkitapp.com:
 *      - www.pixkitapp.com  → https://pixkitapp.com  (308, any scheme)
 *      - http://pixkitapp.com (X-Forwarded-Proto: http) → https (308)
 *      - http://www.pixkitapp.com → https://pixkitapp.com (one hop only)
 *
 *    Redirects are 308 (permanent, method/path/query preserved) and single
 *    hop: the redirect target (apex + https) never triggers another redirect.
 *    Only the two production hosts are redirected — localhost, the temporary
 *    preview (*.space-z.ai), Vercel preview URLs and any future staging host
 *    are never redirected, so local testing and previews keep working.
 *
 *    Hosting note (inspected): the site is not on a host that terminates
 *    these redirects today — production will be served by Vercel, which
 *    redirects HTTP→HTTPS at the edge automatically, and redirects
 *    www↔apex depending on which domain is PRIMARY. Setting pixkitapp.com
 *    as the primary domain in the Vercel dashboard makes the edge behave
 *    exactly like this middleware (www→apex 308); the middleware is the
 *    app-level guarantee that holds regardless of dashboard config, and
 *    Vercel's edge redirect (if it fires first) never conflicts because it
 *    converges to the same apex target.
 *
 * 2) Hostname-based staging protection (defense-in-depth from Part 2).
 *
 *    Every response served from ANY host other than the production domains
 *    gets `X-Robots-Tag: noindex, nofollow` — regardless of build-time
 *    environment variables. This complements (does not replace) the
 *    build-time switches in src/lib/seo.ts:
 *      - NEXT_PUBLIC_INDEXING_MODE=preview  (.env.preview, dev daemon only)
 *      - VERCEL_ENV != "production"         (Vercel-injected per deployment)
 *    A layout-level inline script additionally flips the robots <meta> to
 *    noindex at runtime on non-production hostnames.
 *
 *    robots.txt is deliberately NOT Disallow-ed on staging: crawlers blocked
 *    from crawling can still index a URL if they never see its noindex
 *    directive. Leaving staging crawlable lets them fetch the page and
 *    honor noindex.
 */

const APEX = "pixkitapp.com";
const PRODUCTION_HOSTS = new Set([APEX, `www.${APEX}`]);

function clientScheme(request: NextRequest): string {
  // X-Forwarded-Proto can be a chain ("https,http") — the first hop is the
  // client-facing scheme. Absent header (plain local run) counts as https so
  // we never loop; production proxies (Vercel) always send it.
  const proto = request.headers.get("x-forwarded-proto");
  return proto ? proto.split(",")[0].trim().toLowerCase() : "https";
}

export function middleware(request: NextRequest) {
  // Lowercase and strip any port ("localhost:3000" -> "localhost").
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];

  // --- 1) Canonical host redirects (production hosts only) ---------------
  const redirectToCanonical = () => {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    target.host = APEX;
    target.port = ""; // strip the local/inherited port from the redirect
    // pathname + search are preserved by clone() -> single-hop 308.
    return NextResponse.redirect(target, 308);
  };
  if (host === `www.${APEX}`) {
    return redirectToCanonical();
  }
  if (host === APEX && clientScheme(request) === "http") {
    return redirectToCanonical();
  }

  // --- 2) Staging protection header (non-production hosts) ---------------
  const response = NextResponse.next();
  if (host && !PRODUCTION_HOSTS.has(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  // Skip only immutable build assets (content-hashed) and the image
  // optimizer for performance; every page, data route and public asset
  // still receives the host-based header.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
