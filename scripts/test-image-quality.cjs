/**
 * Image quality before/after test suite.
 * Drives REAL tool pages through the REAL UI (Playwright + Chromium),
 * captures output blobs, measures fidelity metrics in-page.
 *
 * OLD algorithm = verbatim re-implementation of the pre-fix code paths
 * (git commit 75bc8b0) run in the same browser on the same sources.
 * NEW = the deployed processors, driven through the live UI.
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT_JSON = process.env.RESULTS_JSON || "/tmp/img-quality-results.json";

/* ---------- in-page: generate deterministic test sources ---------- */
const GEN = `
window.__makeTestImages = async function () {
  async function mk(canvas, mime, quality) {
    const blob = await new Promise(r => canvas.toBlob(r, mime, quality));
    const arr = new Uint8Array(await blob.arrayBuffer());
    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    return new File([arr], "test." + ext, { type: mime });
  }
  // PHOTO-LANDSCAPE 1600x1000 JPEG q95
  const c1 = document.createElement("canvas"); c1.width = 1600; c1.height = 1000;
  let g = c1.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 1600, 1000);
  grad.addColorStop(0, "#2b6cb0"); grad.addColorStop(0.5, "#63b3ed"); grad.addColorStop(1, "#f6ad55");
  g.fillStyle = grad; g.fillRect(0, 0, 1600, 1000);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255," + (0.04 + (i % 5) * 0.03) + ")";
    g.beginPath(); g.arc(200 + (i * 173) % 1400, 150 + (i * 97) % 700, 30 + (i % 7) * 18, 0, 7); g.fill(); }
  g.fillStyle = "#1a202c"; g.font = "bold 64px Arial"; g.fillText("Sharpness Test 2026", 60, 120);
  g.font = "bold 28px Arial"; g.fillText("fine detail line 0123456789", 60, 950);
  g.strokeStyle = "#000"; g.lineWidth = 2;
  for (let x = 60; x < 760; x += 14) { g.beginPath(); g.moveTo(x, 860); g.lineTo(x + 7, 900); g.stroke(); }
  // PNG GRAPHIC + TRANSPARENCY 800x600
  const c2 = document.createElement("canvas"); c2.width = 800; c2.height = 600;
  let g2 = c2.getContext("2d");
  g2.clearRect(0, 0, 800, 600);
  g2.fillStyle = "#e53e3e"; g2.fillRect(60, 60, 300, 200);
  g2.fillStyle = "#2f855a"; g2.beginPath(); g2.arc(560, 300, 140, 0, 7); g2.fill();
  g2.fillStyle = "#000"; g2.font = "bold 56px Arial"; g2.fillText("PIXKIT", 70, 560);
  g2.font = "bold 22px Arial"; g2.fillText("crisp text on transparency", 70, 520);
  // PORTRAIT 900x1400 JPEG q95
  const c3 = document.createElement("canvas"); c3.width = 900; c3.height = 1400;
  let g3 = c3.getContext("2d");
  const grad3 = g3.createLinearGradient(0, 1400, 900, 0);
  grad3.addColorStop(0, "#6b46c1"); grad3.addColorStop(1, "#faf089");
  g3.fillStyle = grad3; g3.fillRect(0, 0, 900, 1400);
  g3.fillStyle = "rgba(0,0,0,0.35)";
  for (let i = 0; i < 30; i++) { g3.fillRect((i * 137) % 820, (i * 211) % 1300, 60, 60); }
  g3.fillStyle = "#111"; g3.font = "bold 72px Arial"; g3.fillText("PORTRAIT", 60, 200);
  // WEBP 1000x700
  const c4 = document.createElement("canvas"); c4.width = 1000; c4.height = 700;
  let g4 = c4.getContext("2d");
  const grad4 = g4.createLinearGradient(0, 0, 1000, 700);
  grad4.addColorStop(0, "#38a169"); grad4.addColorStop(1, "#ecc94b");
  g4.fillStyle = grad4; g4.fillRect(0, 0, 1000, 700);
  g4.fillStyle = "#111"; g4.font = "bold 60px Arial"; g4.fillText("WEBP SRC", 80, 120);
  // BIG PHOTO 3000x2000 JPEG q95
  const c5 = document.createElement("canvas"); c5.width = 3000; c5.height = 2000;
  let g5 = c5.getContext("2d");
  const grad5 = g5.createLinearGradient(0, 0, 3000, 2000);
  grad5.addColorStop(0, "#4299e1"); grad5.addColorStop(0.4, "#9f7aea"); grad5.addColorStop(1, "#f56565");
  g5.fillStyle = grad5; g5.fillRect(0, 0, 3000, 2000);
  for (let i = 0; i < 120; i++) { g5.fillStyle = "rgba(255,255,255," + (0.03 + (i % 6) * 0.025) + ")";
    g5.beginPath(); g5.arc((i * 431) % 3000, (i * 277) % 2000, 40 + (i % 9) * 22, 0, 7); g5.fill(); }
  g5.fillStyle = "#111"; g5.font = "bold 120px Arial"; g5.fillText("HI-RES 3000x2000", 100, 300);

  const defs = [
    { name: "photo-landscape.jpg", canvas: c1, file: await mk(c1, "image/jpeg", 0.95) },
    { name: "logo-transparent.png", canvas: c2, file: await mk(c2, "image/png") },
    { name: "portrait.jpg", canvas: c3, file: await mk(c3, "image/jpeg", 0.95) },
    { name: "source.webp", canvas: c4, file: await mk(c4, "image/webp", 0.95) },
    { name: "big-photo.jpg", canvas: c5, file: await mk(c5, "image/jpeg", 0.95) },
  ];
  window.__testImages = defs;
  window.__refs = {};
  for (const d of defs) {
    const bmp = await createImageBitmap(d.file);
    const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
    c.getContext("2d").drawImage(bmp, 0, 0);
    window.__refs[d.name] = c;
  }
  return defs.map(d => ({ name: d.name, size: d.file.size, type: d.file.type }));
};
`;

/* ---------- in-page: OLD (pre-fix) algorithm implementations ---------- */
const OLD = `
window.__oldDrawScaled = function (source, srcW, srcH, dstW, dstH) {
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  let current = source, cw = srcW, ch = srcH;
  while (cw / 2 >= dstW && ch / 2 >= dstH && cw > 2 && ch > 2) {
    const half = mk(Math.floor(cw / 2), Math.floor(ch / 2));
    const hctx = half.getContext("2d"); hctx.imageSmoothingEnabled = true; hctx.imageSmoothingQuality = "high";
    hctx.drawImage(current, 0, 0, half.width, half.height);
    current = half; cw = half.width; ch = half.height;
  }
  const out = mk(dstW, dstH); const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = "high";
  octx.drawImage(current, 0, 0, dstW, dstH);
  return out;
};
window.__toB = (canvas, mime, q) => new Promise(r => canvas.toBlob(r, mime, q));
window.__hasAlpha = function (canvas) {
  const d = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < d.length; i += 16) if (d[i] < 255) return true;
  return false;
};
// OLD auto-format (opaque -> JPEG) — verbatim behavior of pre-fix resolveAutoFormat
window.__oldAutoMime = async function (canvas) {
  if (await window.__hasAlpha(canvas)) return "image/png";
  return "image/jpeg";
};
// OLD compressToSize core — verbatim from pre-fix basic.ts
window.__oldCompressToSize = async function (canvas, targetBytes, format) {
  let bestBlob = null, bestQuality = 0, work = canvas;
  let lo = 0.05, hi = 0.95;
  for (let attempt = 0; attempt < 8; attempt++) {
    const q = (lo + hi) / 2;
    const blob = await window.__toB(work, format, q);
    if (blob.size <= targetBytes) { bestBlob = blob; bestQuality = q; lo = q; } else hi = q;
  }
  while (!bestBlob && work.width > 24) {
    const w = Math.max(24, Math.round(canvas.width * 0.8));
    const h = Math.max(24, Math.round(canvas.height * 0.8));
    work = window.__oldDrawScaled(canvas, canvas.width, canvas.height, w, h);
    for (const q of [0.85, 0.5, 0.25, 0.05]) {
      const blob = await window.__toB(work, format, q);
      if (blob.size <= targetBytes) { bestBlob = blob; bestQuality = q; break; }
    }
  }
  if (!bestBlob) { bestBlob = await window.__toB(work, format, 0.05); bestQuality = 0.05; }
  return { blob: bestBlob, quality: bestQuality, width: work.width, height: work.height };
};
// OLD thumbnail cover — verbatim single-pass from pre-fix basic.ts
window.__oldThumbCover = function (canvas, size) {
  const thumb = document.createElement("canvas"); thumb.width = size; thumb.height = size;
  const t = thumb.getContext("2d");
  const r = Math.max(size / canvas.width, size / canvas.height);
  const w = canvas.width * r, h = canvas.height * r;
  t.imageSmoothingQuality = "high";
  t.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h);
  return thumb;
};
`;

/* ---------- in-page: metrics ---------- */
const METRICS = `
window.__metrics = async function (blob, refCanvas, opts) {
  opts = opts || {};
  const bmp = await createImageBitmap(blob);
  const out = document.createElement("canvas");
  out.width = bmp.width; out.height = bmp.height;
  const octx = out.getContext("2d", { willReadFrequently: true });
  octx.drawImage(bmp, 0, 0);
  let ref = refCanvas;
  if (opts.refResize && (ref.width !== out.width || ref.height !== out.height)) {
    const rb = await createImageBitmap(refCanvas, { resizeWidth: out.width, resizeHeight: out.height, resizeQuality: "high" });
    const rc = document.createElement("canvas"); rc.width = out.width; rc.height = out.height;
    rc.getContext("2d").drawImage(rb, 0, 0);
    ref = rc;
  }
  if (ref.width !== out.width || ref.height !== out.height) {
    return { width: out.width, height: out.height, psnr: null, note: "dim mismatch ref=" + ref.width + "x" + ref.height };
  }
  const a = octx.getImageData(0, 0, out.width, out.height).data;
  const b = ref.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, ref.width, ref.height).data;
  let se = 0, count = 0, alphaDiff = 0, maxErr = 0;
  const stride = 4 * Math.max(1, Math.floor((out.width * out.height) / 250000));
  for (let i = 0; i < a.length; i += stride) {
    for (let c = 0; c < 3; c++) {
      const d = a[i + c] - b[i + c];
      se += d * d; count++;
      const ad = Math.abs(d); if (ad > maxErr) maxErr = ad;
    }
    alphaDiff += Math.abs(a[i + 3] - b[i + 3]);
  }
  const mse = se / count;
  const psnr = mse === 0 ? 99 : 10 * Math.log10(255 * 255 / mse);
  const px = octx.getImageData(0, 0, 1, 1).data;
  return { width: out.width, height: out.height, psnr: +psnr.toFixed(2), maxErr,
    alphaAvgDiff: +(alphaDiff / (out.width * out.height)).toFixed(2),
    corner: [px[0], px[1], px[2], px[3]] };
};
`;

/* ---------- runner ---------- */
async function captureOutputs(page, timeout = 90000) {
  // wait until processing finished: Compress/Resize/Process button visible again
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.some((b) => /^(Compress|Resize|Process)/.test(b.textContent.trim()) && !b.disabled);
  }, { timeout });
  await page.waitForTimeout(700);
  return page.evaluate(async () => {
    const results = [];
    for (const c of window.__captured || []) {
      if (!c.blob.type.startsWith("image/")) continue;
      const buf = await c.blob.arrayBuffer();
      results.push({ mime: c.blob.type, size: c.blob.size, bytes: Array.from(new Uint8Array(buf)) });
    }
    window.__captured = [];
    return results;
  });
}

async function runTool(page, slug, imageName) {
  await page.goto(`${BASE}/${slug}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  // Each navigation creates a fresh document — regenerate the deterministic
  // sources if this document doesn't have them yet.
  await page.evaluate(async () => {
    if (!window.__testImages) await window.__makeTestImages();
  });
  await page.evaluate(() => {
    window.__captured = [];
    const _ocu = window.URL.createObjectURL.bind(window.URL);
    window.URL.createObjectURL = (obj) => {
      const url = _ocu(obj);
      if (obj instanceof Blob) window.__captured.push({ blob: obj });
      return url;
    };
  });
  await page.evaluate((name) => {
    const im = window.__testImages.find((t) => t.name === name);
    const dt = new DataTransfer();
    dt.items.add(im.file);
    const input = document.querySelector('input[type="file"]');
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, imageName);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__captured = []; }); // drop the SOURCE preview URL
  const btn = page.locator("button:has-text('Compress'), button:has-text('Resize'), button:has-text('Process')").first();
  await btn.click();
  return captureOutputs(page);
}

function blobArg(r) {
  return { bytesArr: r.bytes, mime: r.mime };
}

async function ensureFixtures(page) {
  await page.evaluate(async () => {
    if (!window.__testImages) await window.__makeTestImages();
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2400 } });
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message.slice(0, 200)));
  await page.addInitScript(GEN);
  await page.addInitScript(OLD);
  await page.addInitScript(METRICS);

  const report = { generatedOn: new Date().toISOString(), base: BASE, tests: [] };
  const log = (t) => { console.log(JSON.stringify(t)); report.tests.push(t); };

  await page.goto(`${BASE}/image-resizer`, { waitUntil: "domcontentloaded" });
  const sources = await page.evaluate(() => window.__makeTestImages());
  console.log("SOURCES:", JSON.stringify(sources));

  /* ---- TEST 1: PNG graphic -> Image Compressor (auto): format preservation ---- */
  {
    console.log("\n== T1 PNG graphic -> compressor auto ==");
    await ensureFixtures(page);
    const oldMime = await page.evaluate(async (name) => {
      return window.__oldAutoMime(window.__refs[name]);
    }, "logo-transparent.png");
    const outputs = await runTool(page, "image-compressor", "logo-transparent.png");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        return window.__metrics(blob, window.__refs["logo-transparent.png"]);
      }, blobArg(r));
      log({
        test: "T1 PNG->compressor(auto)", oldMime,
        newMime: r.mime, newSize: r.size, newExt: ".png?",
        psnrVsSource: m.psnr, note: m.psnr >= 60 ? "lossless roundtrip — text stays crisp" : "",
      });
    }
  }

  /* ---- TEST 2: landscape photo 1600x1000 -> resizer 800 wide ---- */
  {
    console.log("\n== T2 photo -> resizer 800w ==");
    const outputs = await runTool(page, "image-resizer", "photo-landscape.jpg");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        return window.__metrics(blob, window.__refs["photo-landscape.jpg"], { refResize: true });
      }, blobArg(r));
      log({ test: "T2 resize 1600->800 landscape", newMime: r.mime, newSize: r.size,
        dims: `${m.width}x${m.height}`, psnrVsHiRef: m.psnr, aspectKept: Math.abs(m.height / m.width - 1000 / 1600) < 0.02 });
    }
  }

  /* ---- TEST 3: transparent logo -> 100KB target: white bg (not black) ---- */
  {
    console.log("\n== T3 transparent PNG -> 100KB target ==");
    await ensureFixtures(page);
    const oldRun = await page.evaluate(async (name) => {
      const r = await window.__oldCompressToSize(window.__refs[name], 100 * 1024, "image/jpeg");
      const bmp = await createImageBitmap(r.blob);
      const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
      c.getContext("2d").drawImage(bmp, 0, 0);
      const px = c.getContext("2d").getImageData(0, 0, 1, 1).data;
      return { sizeKB: +(r.blob.size / 1024).toFixed(1), quality: +r.quality.toFixed(3), corner: [px[0], px[1], px[2], px[3]] };
    }, "logo-transparent.png");
    const outputs = await runTool(page, "compress-image-to-100kb", "logo-transparent.png");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        return window.__metrics(blob, window.__refs["logo-transparent.png"]);
      }, blobArg(r));
      log({ test: "T3 logo->100KB", old: oldRun,
        new: { mime: r.mime, sizeKB: +(r.size / 1024).toFixed(1), corner: m.corner,
          whiteBg: m.corner[0] > 240 && m.corner[1] > 240 && m.corner[2] > 240, dims: `${m.width}x${m.height}` } });
    }
  }

  /* ---- TEST 4: 3000x2000 -> 500KB: quality search old vs new ---- */
  {
    console.log("\n== T4 big photo -> 500KB target ==");
    await ensureFixtures(page);
    const oldRun = await page.evaluate(async (name) => {
      const r = await window.__oldCompressToSize(window.__refs[name], 500 * 1024, "image/jpeg");
      const metrics = await window.__metrics(r.blob, window.__refs[name], { refResize: true });
      return { sizeKB: +(r.blob.size / 1024).toFixed(1), quality: +r.quality.toFixed(3), dims: `${r.width}x${r.height}`, psnr: metrics.psnr };
    }, "big-photo.jpg");
    const outputs = await runTool(page, "compress-image-to-500kb", "big-photo.jpg");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        return window.__metrics(blob, window.__refs["big-photo.jpg"], { refResize: true });
      }, blobArg(r));
      log({ test: "T4 3000x2000->500KB", old: oldRun,
        new: { mime: r.mime, sizeKB: +(r.size / 1024).toFixed(1), dims: `${m.width}x${m.height}`, psnr: m.psnr },
        verdict: m.psnr >= oldRun.psnr - 0.3 && r.size <= 500 * 1024 ? "within target + quality >= old" : "CHECK" });
    }
  }

  /* ---- TEST 5: WebP -> WebP format preservation ---- */
  {
    console.log("\n== T5 webp -> compressor auto ==");
    await ensureFixtures(page);
    const oldMime = await page.evaluate(async (name) => window.__oldAutoMime(window.__refs[name]), "source.webp");
    const outputs = await runTool(page, "image-compressor", "source.webp");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        return window.__metrics(blob, window.__refs["source.webp"]);
      }, blobArg(r));
      log({ test: "T5 webp->compressor(auto)", oldMime, newMime: r.mime, newSize: r.size, psnrVsSource: m.psnr });
    }
  }

  /* ---- TEST 6: 50KB / 200KB targets size compliance ---- */
  for (const [slug, kb] of [["compress-image-to-50kb", 50], ["compress-image-to-200kb", 200]]) {
    console.log(`\n== T6 target ${kb}KB ==`);
    const outputs = await runTool(page, slug, "photo-landscape.jpg");
    for (const r of outputs) {
      log({ test: `T6 ${kb}KB target`, newMime: r.mime, sizeKB: +(r.size / 1024).toFixed(1), withinTarget: r.size <= kb * 1024 });
    }
  }

  /* ---- TEST 7: portrait 900x1400 -> width 450 (aspect) ---- */
  {
    console.log("\n== T7 portrait resize ==");
    const outputs = await runTool(page, "resize-image-to-width", "portrait.jpg");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        const bmp = await createImageBitmap(blob);
        return { w: bmp.width, h: bmp.height };
      }, blobArg(r));
      log({ test: "T7 portrait->width450", newMime: r.mime, dims: `${m.w}x${m.h}`,
        aspectOk: Math.abs(m.h / m.w - 1400 / 900) < 0.02 });
    }
  }

  /* ---- TEST 8: PNG resize keeps alpha + PNG format ---- */
  {
    console.log("\n== T8 logo -> resize-png-image ==");
    const outputs = await runTool(page, "resize-png-image", "logo-transparent.png");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        const bmp = await createImageBitmap(blob);
        const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
        const px = c.getContext("2d").drawImage(bmp, 0, 0) || c.getContext("2d").getImageData(0, 0, 1, 1).data;
        return { w: bmp.width, h: bmp.height, cornerAlpha: px[3] };
      }, blobArg(r));
      log({ test: "T8 PNG resize alpha", newMime: r.mime, dims: `${m.w}x${m.h}`,
        cornerAlpha: m.cornerAlpha, alphaPreserved: m.cornerAlpha < 250 });
    }
  }

  /* ---- TEST 9: thumbnail 256px cover — multi-step vs old single-pass sharpness ---- */
  {
    console.log("\n== T9 thumbnail 256 cover ==");
    await ensureFixtures(page);
    const oldRun = await page.evaluate(async (name) => {
      const thumb = window.__oldThumbCover(window.__refs[name], 256);
      const blob = await window.__toB(thumb, "image/webp", 0.8);
      const metrics = await window.__metrics(blob, window.__refs[name], { refResize: true });
      return { psnr: metrics.psnr };
    }, "photo-landscape.jpg");
    const outputs = await runTool(page, "thumbnail-maker", "photo-landscape.jpg");
    for (const r of outputs) {
      const m = await page.evaluate(async ({ bytesArr, mime }) => {
        const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
        return window.__metrics(blob, window.__refs["photo-landscape.jpg"], { refResize: true });
      }, blobArg(r));
      log({ test: "T9 thumb256 cover", oldPsnr: oldRun.psnr,
        new: { mime: r.mime, size: r.size, dims: `${m.width}x${m.height}`, psnr: m.psnr } });
    }
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 1));
  console.log(`\nSaved -> ${OUT_JSON}`);
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
