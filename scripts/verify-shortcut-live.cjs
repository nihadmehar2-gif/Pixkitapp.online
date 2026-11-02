/** Live verification: platform-aware shortcut badge on www.pixkitapp.online. */
const { chromium } = require("playwright");

const CASES = [
  { name: "Windows Chrome (fine pointer)", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", platform: "Win32", touch: false },
  { name: "macOS Safari (fine pointer)", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15", platform: "MacIntel", touch: false },
  { name: "Android phone (coarse touch)", ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36", platform: "Linux armv8l", touch: true },
];

(async () => {
  const browser = await chromium.launch();
  for (const c of CASES) {
    const ctx = await browser.newContext({
      userAgent: c.ua,
      viewport: c.touch ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      hasTouch: c.touch,
      isMobile: c.touch,
    });
    // Force (pointer: coarse) to match real touch devices where needed.
    await ctx.addInitScript(`
      if (${c.touch}) {
        const q = window.matchMedia.bind(window);
        window.matchMedia = (s) => s.includes("pointer: coarse")
          ? { matches: true, media: s, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }
          : q(s);
      }`);
    const page = await ctx.newPage();
    await page.goto("https://www.pixkitapp.online/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const k = document.querySelector("header kbd");
      return k ? { text: k.textContent, visible: getComputedStyle(k).display !== "none" } : null;
    });
    console.log(`${c.name}: kbd =`, r ? JSON.stringify(r) : "NOT RENDERED");
    await ctx.close();
  }
  await browser.close();
})();
