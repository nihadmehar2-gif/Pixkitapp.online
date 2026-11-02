/** T1b: OPAQUE PNG (screenshot-like) through Image Compressor — old vs new format behavior. */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE_URL || "http://localhost:3120";
const GEN = fs.readFileSync("/home/z/my-project/scripts/.gen-snippet.js", "utf8");

const OLD = `
window.__oldAutoMime = async function (canvas) {
  const d = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
  let hasAlpha = false;
  for (let i = 3; i < d.length; i += 16) if (d[i] < 255) { hasAlpha = true; break; }
  return hasAlpha ? "image/png" : "image/jpeg";
};`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2400 } });
  await page.addInitScript(GEN);
  await page.addInitScript(OLD);

  await page.goto(`${BASE}/image-compressor`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  // Build an OPAQUE screenshot-like PNG (white bg + fine black text) and register it
  const srcInfo = await page.evaluate(async () => {
    const c = document.createElement("canvas"); c.width = 1000; c.height = 700;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 1000, 700);
    g.fillStyle = "#111"; g.font = "bold 40px Arial"; g.fillText("Screenshot heading — Q3 report", 40, 80);
    g.font = "16px Arial";
    for (let i = 0; i < 18; i++) g.fillText("Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor " + i, 40, 140 + i * 26);
    g.strokeStyle = "#999"; g.strokeRect(40, 560, 920, 100);
    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    const file = new File([blob], "screenshot.png", { type: "image/png" });
    const bmp = await createImageBitmap(file);
    const ref = document.createElement("canvas"); ref.width = bmp.width; ref.height = bmp.height;
    ref.getContext("2d").drawImage(bmp, 0, 0);
    window.__screenshotPng = file;
    window.__screenshotRef = ref;
    return { size: file.size, oldMime: await window.__oldAutoMime(ref) };
  });
  console.log("SOURCE opaque PNG:", JSON.stringify(srcInfo));

  // run through the real UI
  await page.evaluate(() => {
    window.__captured = [];
    const _ocu = window.URL.createObjectURL.bind(window.URL);
    window.URL.createObjectURL = (obj) => {
      const url = _ocu(obj);
      if (obj instanceof Blob) window.__captured.push({ blob: obj });
      return url;
    };
  });
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(window.__screenshotPng);
    const input = document.querySelector('input[type="file"]');
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__captured = []; });
  const t0 = Date.now();
  await page.locator("button:has-text('Compress')").first().click();
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.some((b) => /^Compress/.test(b.textContent.trim()) && !b.disabled);
  }, { timeout: 90000 });
  const elapsed = Date.now() - t0;
  const result = await page.evaluate(async () => {
    const out = [];
    for (const c of window.__captured) {
      if (!c.blob.type.startsWith("image/")) continue;
      const metrics = await window.__psnrWrap ? null : null;
      // compute PSNR vs the screenshot ref
      const bmp = await createImageBitmap(c.blob);
      const cv = document.createElement("canvas"); cv.width = bmp.width; cv.height = bmp.height;
      cv.getContext("2d").drawImage(bmp, 0, 0);
      const a = cv.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height).data;
      const b = window.__screenshotRef.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height).data;
      let se = 0, n = 0;
      for (let i = 0; i < a.length; i += 8) for (let k = 0; k < 3; k++) { const d = a[i + k] - b[i + k]; se += d * d; n++; }
      const mse = se / n;
      out.push({ mime: c.blob.type, size: c.blob.size, psnr: mse === 0 ? 99 : +(10 * Math.log10(255 * 255 / mse)).toFixed(2) });
    }
    return out;
  });
  console.log(`processing time: ${elapsed}ms`);
  for (const r of result) {
    console.log(`NEW: mime=${r.mime} size=${(r.size / 1024).toFixed(1)}KB psnrVsSource=${r.psnr} ${r.psnr >= 60 ? "<< lossless — text perfectly crisp" : ""}`);
  }
  await browser.close();
})();
