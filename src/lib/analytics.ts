/**
 * Google Analytics 4 — single source of truth for the measurement ID and
 * the tracking snippets installed once, globally, in src/app/layout.tsx.
 *
 * A GA measurement ID is a public identifier (it ships in every page's
 * HTML), not a secret, so hardcoding it here is safe and deterministic.
 */

export const GA_MEASUREMENT_ID = "G-VXJMF2PERB";

/**
 * Client-side navigation tracker (inline, server-rendered — deliberately
 * NOT a React client component, so it can never interfere with hydration
 * or next/script injection).
 *
 * App Router navigations never reload the page, so the initial
 * gtag('config', …) page_view alone would undercount. This snippet hooks
 * history.pushState (which Next.js uses for every client-side navigation)
 * and popstate (back/forward), and fires exactly one page_view per URL
 * change. replaceState is ignored — Next.js calls it for scroll restoration
 * and state syncing, which are not page views.
 */
export const GA_SPA_TRACKER_SNIPPET = `
(function () {
  try {
    var push = history.pushState;
    if (typeof push === "function" && !history.__gaPatched) {
      history.__gaPatched = true;
      history.pushState = function () {
        var r = push.apply(this, arguments);
        if (typeof window.gtag === "function") {
          window.gtag("event", "page_view", {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname + window.location.search,
          });
        }
        return r;
      };
    }
    window.addEventListener("popstate", function () {
      if (typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname + window.location.search,
        });
      }
    });
  } catch (e) {}
})();
`;
