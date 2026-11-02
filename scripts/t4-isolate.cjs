/** T4 isolation: old algo vs new bisect algo on the SAME canvas, same document. */
const { chromium } = require("playwright");

const GEN = `
window.__mk = async function () {
  const c5 = document.createElement("canvas"); c5.width = 3000; c5.height = 2000;
  let g5 = c5.getContext("2d");
  const grad5 = g5.createLinearGradient(0, 0, 3000, 2000);
  grad5.addColorStop(0, "#4299e1"); grad5.addColorStop(0.4, "#9f7aea"); grad5.addColorStop(1, "#f56565");
  g5.fillStyle = grad5; g5.fillRect(0, 0, 3000, 2000);
  for (let i = 0; i < 120; i++) { g5.fillStyle = "rgba(255,255,255," + (0.03 + (i % 6) * 0.025) + ")";
    g5.beginPath(); g5.arc((i * 431) % 3000, (i * 277) % 2000, 40 + (i % 9) * 22, 0, 7); g5.fill(); }
  g5.fillStyle = "#111"; g5.font = "bold 120px Arial"; g5.fillText("HI-RES 3000x2000", 100, 300);
  window.__srcFile = await new Promise(r => c5.toBlob(r, "image/jpeg", 0.95))
    .then(b => new File([b], "big.jpg", { type: "image/jpeg" }));
  const bmp = await createImageBitmap(window.__srcFile);
  const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
  c.getContext("2d").drawImage(bmp, 0, 0);
  window.__ref = c;
};
window.__psnr = async function (blob) {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
  c.getContext("2d").drawImage(bmp, 0, 0);
  const a = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
  const b = window.__ref.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
  let se = 0, n = 0;
  const stride = 4 * 24;
  for (let i = 0; i < a.length; i += stride)
    for (let k = 0; k < 3; k++) { const d = a[i + k] - b[i + k]; se += d * d; n++; }
  const mse = se / n;
  return { psnr: +(10 * Math.log10(255 * 255 / mse)).toFixed(2), sizeKB: +(blob.size / 1024).toFixed(1) };
};
window.__oldAlgo = async function (target) {
  const canvas = window.__ref;
  const toB = (cv, q) => new Promise(r => cv.toBlob(r, "image/jpeg", q));
  let bestBlob = null, bestQ = 0, work = canvas, lo = 0.05, hi = 0.95;
  for (let a = 0; a < 8; a++) {
    const q = (lo + hi) / 2;
    const blob = await toB(work, q);
    if (blob.size <= target) { bestBlob = blob; bestQ = q; lo = q; } else hi = q;
  }
  while (!bestBlob && work.width > 24) {
    work = document.createElement("canvas");
    work.width = Math.round(canvas.width * 0.8); work.height = Math.round(canvas.height * 0.8);
    const wctx = work.getContext("2d"); wctx.imageSmoothingEnabled = true; wctx.imageSmoothingQuality = "high";
    wctx.drawImage(canvas, 0, 0, work.width, work.height);
    for (const q of [0.85, 0.5, 0.25, 0.05]) {
      const blob = await toB(work, q);
      if (blob.size <= target) { bestBlob = blob; bestQ = q; break; }
    }
  }
  if (!bestBlob) { bestBlob = await toB(work, 0.05); bestQ = 0.05; }
  return { blob: bestBlob, q: bestQ };
};
window.__newAlgo = async function (target) {
  const canvas = window.__ref;
  const enc = (cv, q) => new Promise(r => cv.toBlob(r, "image/jpeg", q)); // same as encodeWithAlphaHandling for opaque
  const floor = await enc(canvas, 0.05);
  if (floor.size > target) return { q: -1, blob: null };
  let bestBlob = null, bestQ = 0, lo = 0.05, hi = 1.0;
  for (let a = 0; a < 9; a++) {
    const q = (lo + hi) / 2;
    const blob = await enc(canvas, q);
    if (blob.size <= target) { bestBlob = blob; bestQ = q; lo = q; } else hi = q;
  }
  if (!bestBlob) { bestBlob = floor; bestQ = 0.05; }
  return { blob: bestBlob, q: bestQ };
};
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript(GEN);
  await page.goto("about:blank");
  await page.evaluate(() => window.__mk());
  const target = 500 * 1024;

  const oldRun = await page.evaluate(async (t) => {
    const r = await window.__oldAlgo(t);
    return { q: +r.q.toFixed(4), ...(await window.__psnr(r.blob)) };
  }, target);
  const newRun = await page.evaluate(async (t) => {
    const r = await window.__newAlgo(t);
    return { q: +r.q.toFixed(4), ...(await window.__psnr(r.blob)) };
  }, target);

  console.log("OLD algo:", JSON.stringify(oldRun));
  console.log("NEW algo:", JSON.stringify(newRun));

  // explicit single-quality encodes for reference points
  const pts = await page.evaluate(async (t) => {
    const out = [];
    for (const q of [0.940625, 0.9465, 0.9703125, 0.95546875]) {
      const blob = await new Promise(r => window.__ref.toBlob(r, "image/jpeg", q));
      const m = await window.__psnr(blob);
      out.push({ q, ...m, fits: blob.size <= t });
    }
    return out;
  }, target);
  for (const p of pts) console.log(`  ref q=${p.q} size=${p.sizeKB}KB psnr=${p.psnr} fits=${p.fits}`);

  await browser.close();
})();
