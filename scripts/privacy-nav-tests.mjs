/** Privacy + navigation verification:
 *  1. Monitor ALL network traffic during a full tool run — assert no request
 *     carries image bytes (no POST, no large bodies, only localhost assets).
 *  2. Direct URL open, hard refresh, back/forward navigation.
 *  Run: node scripts/privacy-nav-tests.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const EXEC = "/home/z/.agent-browser/browsers/chrome-155.0.8059.39/chrome";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

let log = [];
const reqs = [];
page.on("request", (r) => reqs.push({ url: r.url(), method: r.method(), post: r.postData()?.length ?? 0 }));
page.on("pageerror", (e) => log.push("PAGEERROR " + String(e).slice(0, 120)));

/* 1. Full compress run with network capture */
await page.goto(`${BASE}/image-compressor`, { waitUntil: "load" });
await page.locator('input[type=file]').first().setInputFiles([{ name: "photo.jpg", mimeType: "image/jpeg", buffer: readFileSync("/tmp/pxtest/photo.jpg") }]);
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Compress", exact: true }).click();
await page.waitForSelector("text=Download", { timeout: 20000 });
const dlBtn = page.getByRole("button", { name: "Download", exact: true }).first();
const [download] = await Promise.all([page.waitForEvent("download"), dlBtn.click()]);
await download.saveAs("/tmp/pxtest/privacy-check.jpg");

const postReqs = reqs.filter((r) => r.method !== "GET");
// blob: URLs are in-browser object references (previews), not network traffic
const externalReqs = reqs.filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith("blob:"));
const bigPosts = reqs.filter((r) => r.post > 10000);
console.log(`network requests during full run: ${reqs.length}`);
console.log(`non-GET requests: ${postReqs.length}`, postReqs.slice(0, 3));
console.log(`external (non-localhost:3000) requests: ${externalReqs.length}`, externalReqs.slice(0, 3).map(r => r.url.slice(0, 80)));
console.log(`requests with >10KB bodies: ${bigPosts.length}`);
console.log(`PRIVACY VERDICT: ${postReqs.length === 0 && externalReqs.length === 0 && bigPosts.length === 0 ? "PASS — zero uploads, zero third-party calls" : "FAIL"}`);

/* 2. Direct URL + refresh + back/forward */
await page.goto(`${BASE}/webp-to-jpg`, { waitUntil: "load" });
const t1 = await page.title();
await page.reload({ waitUntil: "load" });
const t2 = await page.title();
console.log(`direct URL + refresh: ${t1 === t2 && t1.includes("WebP to JPG") ? "PASS" : "FAIL"} ("${t2}")`);

await page.goto(`${BASE}/tools`, { waitUntil: "load" });
// click an internal link, then go back/forward
await page.locator('a[href="/image-compressor"]').first().click();
await page.waitForURL("**/image-compressor", { timeout: 15000 });
const backUrl = await page.evaluate(() => { history.back(); return location.pathname; });
await page.waitForTimeout(800);
const backPath = new URL(page.url()).pathname;
await page.evaluate(() => history.forward());
await page.waitForTimeout(800);
const fwdPath = new URL(page.url()).pathname;
console.log(`back/forward: ${backPath === "/tools" && fwdPath === "/image-compressor" ? "PASS" : "FAIL"} (back→${backPath}, fwd→${fwdPath})`);

/* 3. 404 handling */
const resp = await page.goto(`${BASE}/not-a-real-tool`, { waitUntil: "load" });
const status = resp.status();
const hasHelp = (await page.locator("body").textContent()).match(/not found|doesn't exist|404/i);
console.log(`404 handling: ${status === 404 && hasHelp ? "PASS" : "FAIL"} (status=${status}, helpful=${!!hasHelp})`);

/* 4. Sitemap & robots on prod */
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
const rb = await (await fetch(`${BASE}/robots.txt`)).text();
console.log(`sitemap.xml: ${sm.includes("<urlset") && sm.includes("https://www.pixkitapp.online/image-compressor") ? "PASS" : "FAIL"} (${(sm.match(/<loc>/g) || []).length} URLs)`);
console.log(`robots.txt: ${rb.includes("Allow: /") && rb.includes("Sitemap: https://www.pixkitapp.online/sitemap.xml") && !rb.includes("Disallow") ? "PASS" : "FAIL"}`);

console.log(`page errors overall: ${log.length}`);
await browser.close();
