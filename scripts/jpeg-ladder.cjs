/** Measure Chrome canvas JPEG size/PSNR across a quality ladder (monotonicity check). */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("about:blank");
  const out = await page.evaluate(async () => {
    // Build the same style of content as the big-photo test source
    const c = document.createElement("canvas"); c.width = 3000; c.height = 2000;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 3000, 2000);
    grad.addColorStop(0, "#4299e1"); grad.addColorStop(0.4, "#9f7aea"); grad.addColorStop(1, "#f56565");
    g.fillStyle = grad; g.fillRect(0, 0, 3000, 2000);
    for (let i = 0; i < 120; i++) { g.fillStyle = "rgba(255,255,255," + (0.03 + (i % 6) * 0.025) + ")";
      g.beginPath(); g.arc((i * 431) % 3000, (i * 277) % 2000, 40 + (i % 9) * 22, 0, 7); g.fill(); }
    g.fillStyle = "#111"; g.font = "bold 120px Arial"; g.fillText("HI-RES 3000x2000", 100, 300);

    function psnr(a, b) {
      const da = a.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, a.width, a.height).data;
      const db = b.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, b.width, b.height).data;
      let se = 0, n = 0;
      const stride = 4 * 24;
      for (let i = 0; i < da.length; i += stride)
        for (let k = 0; k < 3; k++) { const d = da[i + k] - db[i + k]; se += d * d; n++; }
      const mse = se / n;
      return mse === 0 ? 99 : +(10 * Math.log10(255 * 255 / mse)).toFixed(2);
    }
    const rows = [];
    for (const q of [0.90, 0.92, 0.946, 0.95, 0.955, 0.96, 0.97, 0.98, 0.99, 1.0]) {
      const blob = await new Promise(r => c.toBlob(r, "image/jpeg", q));
      const bmp = await createImageBitmap(blob);
      const rc = document.createElement("canvas"); rc.width = bmp.width; rc.height = bmp.height;
      rc.getContext("2d").drawImage(bmp, 0, 0);
      rows.push({ q, sizeKB: +(blob.size / 1024).toFixed(1), psnr: psnr(rc, c) });
    }
    return rows;
  });
  console.log("quality ladder (3000x2000 synthetic photo):");
  for (const r of out) console.log(`  q=${r.q}  size=${r.sizeKB}KB  psnr=${r.psnr}`);
  await browser.close();
})();
