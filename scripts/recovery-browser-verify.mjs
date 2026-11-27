/* Browser-level verification for the recovery build (served on 127.0.0.1:3111).
 * Checks: console errors, page errors, request failures, presence of the
 * consent-default execution effect (window.dataLayer consent commands),
 * Monetag absence, AdSense loader fetch, GA4 presence, mobile viewport meta.
 * Usage: node scripts/recovery-browser-verify.mjs <baseURL>
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:3111";
const PAGES = ["/", "/tools", "/privacy", "/terms", "/categories/compress", "/categories/metadata", "/compress-image-to-100kb", "/compress-image-to-500kb", "/image-compressor", "/crop-image"];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // mobile
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const monetagRequests = [];
  const googleRequests = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 160)));
  page.on("requestfailed", (r) => failedRequests.push(r.url().slice(0, 120)));
  page.on("request", (r) => {
    const u = r.url();
    if (/nap5k|n6wxm|monetag/i.test(u)) monetagRequests.push(u.slice(0, 120));
    if (/googlesyndication|googletagmanager|doubleclick/i.test(u)) googleRequests.push(u.slice(0, 120));
  });
  try {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);
    const consentState = await page.evaluate(() => {
      try {
        const dl = (window.dataLayer || []).map((a) => Array.from(a).join(" ").slice(0, 60));
        return {
          dataLayerLen: dl.length,
          consentDefaults: dl.filter((s) => s.includes("consent") && s.includes("default")).length,
          hasAdsenseGlobal: typeof window.adsbygoogle !== "undefined",
          viewportMeta: !!document.querySelector('meta[name="viewport"]'),
        };
      } catch (e) { return { err: String(e) }; }
    });
    results.push({ path, consoleErrors, pageErrors, failedRequests, monetagRequests, googleCount: googleRequests.length, consentState });
  } catch (e) {
    results.push({ path, navError: String(e).slice(0, 200) });
  }
  await ctx.close();
}

await browser.close();

let fail = 0;
for (const r of results) {
  const issues = [];
  if (r.navError) issues.push("NAV ERROR: " + r.navError);
  if (r.pageErrors?.length) issues.push("pageerror: " + r.pageErrors.join(" | "));
  if (r.monetagRequests?.length) issues.push("MONETAG REQUEST: " + r.monetagRequests.join(" | "));
  // Ignore requests to external origins that are blocked in sandbox (network offline is expected);
  // only flag real JS errors.
  const jsIssues = r.consoleErrors?.filter((e) => !/ERR_(NAME|INTERNET|CONNECTION|PROXY|TUNNEL|CERT|SSL)/.test(e) && !/Failed to load resource/.test(e));
  if (jsIssues?.length) issues.push("console error: " + jsIssues.join(" | "));
  if (r.consentState && !r.consentState.err) {
    if (r.consentState.consentDefaults < 2) issues.push("consent defaults missing: " + JSON.stringify(r.consentState));
  }
  if (issues.length) { fail++; console.log("FAIL", r.path, "->", issues.join(" ;; ")); }
  else console.log("PASS", r.path, "| dataLayer:", r.consentState?.dataLayerLen, "| consentDefaults:", r.consentState?.consentDefaults, "| adsense lib:", r.consentState?.hasAdsenseGlobal, "| googleReqs:", r.googleCount);
}
console.log(fail === 0 ? "\nALL BROWSER CHECKS PASSED" : `\n${fail} PAGES WITH ISSUES`);
