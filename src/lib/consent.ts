/**
 * Google Consent Mode v2 — regional consent defaults.
 *
 * WHAT THIS IS
 *   A single inline script that must execute BEFORE any Google tag
 *   (the AdSense loader and the GA4 gtag.js) runs on the page. It declares
 *   the DEFAULT consent state so tags never send data using an assumed
 *   "granted" state, and so any Google-certified CMP (AdSense → Privacy &
 *   messaging) can update the state later through the standard
 *   gtag('consent', 'update', …) mechanism.
 *
 * WHAT THIS IS NOT
 *   Not a consent banner and not a CMP. Google requires a Google-certified,
 *   IAB TCF-integrated CMP for personalized ads in the EEA, UK and
 *   Switzerland (support.google.com/adsense/answer/13554116). The banner UI
 *   itself comes from Google's certified CMP ("Privacy & messaging" in the
 *   AdSense account) — enabling it is an account/dashboard step, not code.
 *   This snippet only sets the code-side defaults correctly.
 *
 * BEHAVIOR (matches Google's documented region-specific pattern,
 * developers.google.com/tag-platform/security/guides/consent):
 *   - EEA + UK + Switzerland (ISO 3166-1 alpha-2 region list): all four
 *     consent types default to DENIED. Until a CMP (or the user) updates
 *     the state, ad_storage stays denied, so ad cookies are not set and
 *     AdSense serves non-personalized ads; GA4 runs without analytics
 *     cookies.
 *   - All other regions: consent types default to GRANTED (no consent
 *     banner is legally required there; no CMP message is shown).
 *   - wait_for_update: 500 ms — Google's documented integration window so
 *     an asynchronously-loading CMP can update consent before tags fire.
 *
 * ORDERING GUARANTEE: rendered as a plain inline <script> as the FIRST
 * element of <body> in src/app/layout.tsx, so the browser executes it
 * synchronously during HTML parsing, before the deferred AdSense loader
 * and the hydration-injected GA4 gtag.js (verified against the built
 * HTML during the recovery verification).
 */

export const CONSENT_REGION_EEA_UK_CH: string[] = [
  // EU-27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA non-EU members
  "IS", "LI", "NO",
  // United Kingdom, Switzerland
  "GB", "CH",
];

const DENIED_REGIONS = JSON.stringify(CONSENT_REGION_EEA_UK_CH);

/** Inline Consent Mode v2 defaults — executes before every Google tag. */
export const CONSENT_DEFAULT_SNIPPET = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
/* Region-specific defaults FIRST (EEA + UK + Switzerland): denied. */
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500,
  'region': ${DENIED_REGIONS}
});
/* Global default LAST (every other region): granted. */
gtag('consent', 'default', {
  'ad_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted',
  'analytics_storage': 'granted'
});
`;
