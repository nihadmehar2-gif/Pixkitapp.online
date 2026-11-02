import { NextRequest, NextResponse } from "next/server";

/**
 * Runtime URL-integrity + staging-protection layer.
 *
 * Next.js 16 note: the middleware file convention was renamed to proxy
 * (src/proxy.ts, exported function `proxy`) — same runtime behavior, no
 * deprecation warning.
 *
 * 1) Canonical host enforcement (single-hop permanent redirects).
 *
 *    The one canonical host is https://www.pixkitapp.online:
 *      - pixkitapp.online            → https://www.pixkitapp.online (308, any scheme)
 *      - http://www.pixkitapp.online → https://www.pixkitapp.online (308)
 *      - pixkitapp.com / www.pixkitapp.com (legacy domain) → canonical (308)
 *
 *    Redirects are 308 (permanent, method/path/query preserved) and single
 *    hop: the redirect target (www + https) never triggers another redirect.
 *    The legacy domain also redirects — it must never serve content, so
 *    visitors and any residual link equity permanently follow to the new
 *    canonical host.
 *
 *    Only production + legacy hosts are redirected — localhost, the temporary
 *    preview (*.space-z.ai), Vercel preview URLs and any future staging host
 *    are never redirected, so local testing and previews keep working.
 *
 *    Hosting note: production is served by Vercel, which redirects
 *    HTTP→HTTPS at the edge automatically and redirects www↔apex depending
 *    on which domain is PRIMARY. Setting www.pixkitapp.online as the primary
 *    domain in the Vercel dashboard makes the edge behave exactly like this
 *    proxy (apex→www 308); the proxy is the app-level guarantee that holds
 *    regardless of dashboard config, and the edge redirect (if it fires
 *    first) never conflicts because it converges to the same target.
 *
 * 2) Hostname-based staging protection (defense-in-depth).
 *
 *    Every response served from ANY host other than the production hosts
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

const CANONICAL_HOST = "www.pixkitapp.online";
const APEX = "pixkitapp.online";
const LEGACY_HOSTS = new Set(["pixkitapp.com", "www.pixkitapp.com"]);
const PRODUCTION_HOSTS = new Set([CANONICAL_HOST, APEX]);

function clientScheme(request: NextRequest): string {
  // X-Forwarded-Proto can be a chain ("https,http") — the first hop is the
  // client-facing scheme. Absent header (plain local run) counts as https so
  // we never loop; production proxies (Vercel) always send it.
  const proto = request.headers.get("x-forwarded-proto");
  return proto ? proto.split(",")[0].trim().toLowerCase() : "https";
}

export function proxy(request: NextRequest) {
  // Lowercase and strip any port ("localhost:3000" -> "localhost").
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];

  // --- 1) Canonical host redirects (production + legacy hosts only) ------
  const redirectToCanonical = () => {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    target.host = CANONICAL_HOST;
    target.port = ""; // strip the local/inherited port from the redirect
    // pathname + search are preserved by clone() -> single-hop 308.
    return NextResponse.redirect(target, 308);
  };

  // Legacy domain must never serve content: 308 everything to the new
  // canonical host (scheme irrelevant — target is always https + www).
  if (LEGACY_HOSTS.has(host)) {
    return redirectToCanonical();
  }
  // Apex of the new domain → www (single hop, any scheme).
  if (host === APEX) {
    return redirectToCanonical();
  }
  // http://www.pixkitapp.online → https (single hop).
  if (host === CANONICAL_HOST && clientScheme(request) === "http") {
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
