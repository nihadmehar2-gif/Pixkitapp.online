/**
 * PixKitApp image-quality test suite v2 (post quality-repair).
 *
 * Drives the REAL production build through the REAL UI with Playwright +
 * headless Chromium: uploads files into each tool page, clicks the real
 * action button, captures the real output blobs via a createObjectURL hook,
 * and measures fidelity in-page (SSIM, alpha, dimensions).
 *
 * SOURCES ARE SYNTHETIC (deterministic, generated in-browser). No real-photo
 * assets exist in the repo (no /test-assets), so ALL numbers reported by this
 * suite are synthetic-image results and must be labeled as such.
 *
 * Usage:  BASE_URL=http://localhost:3200 node scripts/test-image-quality-v2.cjs
 * Output: JSON report + /tmp/pixkit-pdf-tests/*.pdf for independent parsing.
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3200";
const OUT_JSON = process.env.RESULTS_JSON || "/tmp/img-quality-results-v2.json";
const PDF_DIR = "/tmp/pixkit-pdf-tests";
const CHROME = process.env.CHROME_PATH || `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

/* ---------- in-page: deterministic synthetic sources ---------- */
const GEN = `
window.__makeTestImages = async function () {
  async function mk(canvas, mime, quality, name) {
    const blob = await new Promise(r => canvas.toBlob(r, mime, quality));
    const arr = new Uint8Array(await blob.arrayBuffer());
    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    return new File([arr], name + "." + ext, { type: mime });
  }
  function noise(g, w, h, n, alpha) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = "rgba(255,255,255," + (alpha + (i % 5) * 0.02) + ")";
      g.beginPath(); g.arc((i * 733) % w, (i * 397) % h, 8 + (i % 9) * 14, 0, 7); g.fill();
    }
  }
  // 1) LARGE LANDSCAPE PHOTO 4000x2500 JPEG (synthetic)
  const c1 = document.createElement("canvas"); c1.width = 4000; c1.height = 2500;
  let g1 = c1.getContext("2d");
  const gr1 = g1.createLinearGradient(0, 0, 4000, 2500);
  gr1.addColorStop(0, "#1a365d"); gr1.addColorStop(0.45, "#2b6cb0"); gr1.addColorStop(0.8, "#f6ad55"); gr1.addColorStop(1, "#9b2c2c");
  g1.fillStyle = gr1; g1.fillRect(0, 0, 4000, 2500);
  noise(g1, 4000, 2500, 160, 0.03);
  g1.fillStyle = "#1a202c"; g1.font = "bold 150px Arial"; g1.fillText("LANDSCAPE 4000px", 120, 320);
  g1.strokeStyle = "#000"; g1.lineWidth = 3;
  for (let x = 120; x < 1900; x += 16) { g1.beginPath(); g1.moveTo(x, 2200); g1.lineTo(x + 8, 2380); g1.stroke(); }
  // 2) PORTRAIT PHOTO 1200x1800 JPEG (synthetic)
  const c2 = document.createElement("canvas"); c2.width = 1200; c2.height = 1800;
  let g2 = c2.getContext("2d");
  const gr2 = g2.createLinearGradient(0, 1800, 1200, 0);
  gr2.addColorStop(0, "#6b46c1"); gr2.addColorStop(1, "#faf089");
  g2.fillStyle = gr2; g2.fillRect(0, 0, 1200, 1800);
  noise(g2, 1200, 1800, 60, 0.04);
  g2.fillStyle = "#111"; g2.font = "bold 96px Arial"; g2.fillText("PORTRAIT", 80, 260);
  // 3) TRANSPARENT LOGO PNG 800x600 (large transparent areas)
  const c3 = document.createElement("canvas"); c3.width = 800; c3.height = 600;
  let g3 = c3.getContext("2d");
  g3.clearRect(0, 0, 800, 600);
  g3.fillStyle = "#e53e3e"; g3.fillRect(60, 60, 300, 200);
  g3.fillStyle = "#2f855a"; g3.beginPath(); g3.arc(560, 300, 140, 0, 7); g3.fill();
  g3.fillStyle = "#000"; g3.font = "bold 56px Arial"; g3.fillText("PIXKIT", 70, 560);
  // 4) WEBP PHOTO 1000x700
  const c4 = document.createElement("canvas"); c4.width = 1000; c4.height = 700;
  let g4 = c4.getContext("2d");
  const gr4 = g4.createLinearGradient(0, 0, 1000, 700);
  gr4.addColorStop(0, "#38a169"); gr4.addColorStop(1, "#ecc94b");
  g4.fillStyle = gr4; g4.fillRect(0, 0, 1000, 700);
  noise(g4, 1000, 700, 40, 0.05);
  g4.fillStyle = "#111"; g4.font = "bold 60px Arial"; g4.fillText("WEBP SRC", 80, 120);
  // 5) TEXT-HEAVY SCREENSHOT 1280x800 PNG
  const c5 = document.createElement("canvas"); c5.width = 1280; c5.height = 800;
  let g5 = c5.getContext("2d");
  g5.fillStyle = "#ffffff"; g5.fillRect(0, 0, 1280, 800);
  g5.fillStyle = "#2d3748"; g5.fillRect(0, 0, 1280, 48);
  g5.fillStyle = "#fff"; g5.font = "bold 24px Arial"; g5.fillText("PixKitApp — Settings", 20, 32);
  g5.fillStyle = "#1a202c"; g5.font = "28px Arial";
  for (let i = 0; i < 16; i++) g5.fillText("Line " + (i + 1) + ": The quick brown fox jumps over the lazy dog 0123456789.", 40, 110 + i * 40);
  g5.strokeStyle = "#cbd5e0"; g5.strokeRect(10.5, 70.5, 1260, 700);
  // 6) SMALL IMAGE WITH TINY TRANSPARENT REGIONS 240x180 PNG
  const c6 = document.createElement("canvas"); c6.width = 240; c6.height = 180;
  let g6 = c6.getContext("2d");
  g6.fillStyle = "#4299e1"; g6.fillRect(0, 0, 240, 180);
  g6.fillStyle = "#fff"; g6.font = "bold 28px Arial"; g6.fillText("TINY", 20, 40);
  g6.clearRect(40, 80, 2, 2);          // 2x2 fully-transparent hole
  g6.clearRect(150, 120, 3, 1);        // 3x1 fully-transparent hole
  g6.fillStyle = "rgba(0,0,0,0.5)";    // partially transparent pixel band
  g6.fillRect(90, 150, 6, 2);
  const defs = [
    { name: "photo-landscape", canvas: c1, file: await mk(c1, "image/jpeg", 0.92, "photo-landscape") },
    { name: "portrait",        canvas: c2, file: await mk(c2, "image/jpeg", 0.92, "portrait") },
    { name: "logo-transparent",canvas: c3, file: await mk(c3, "image/png", undefined, "logo-transparent") },
    { name: "source-webp",     canvas: c4, file: await mk(c4, "image/webp", 0.9, "source-webp") },
    { name: "screenshot-text", canvas: c5, file: await mk(c5, "image/png", undefined, "screenshot-text") },
    { name: "tiny-alpha",      canvas: c6, file: await mk(c6, "image/png", undefined, "tiny-alpha") },
  ];
  window.__testImages = defs;
  window.__refs = {};
  for (const d of defs) {
    const bmp = await createImageBitmap(d.file);
    const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
    c.getContext("2d").drawImage(bmp, 0, 0);
    window.__refs[d.name] = c;
  }
  return defs.map(d => ({ name: d.file.name, size: d.file.size, type: d.file.type }));
};
`;

/* ---------- in-page: metrics (SSIM + alpha) ---------- */
const METRICS = `
window.__metrics = async function (blob, refCanvas, opts) {
  opts = opts || {};
  const bmp = await createImageBitmap(blob);
  const out = document.createElement("canvas");
  out.width = bmp.width; out.height = bmp.height;
  const octx = out.getContext("2d", { willReadFrequently: true });
  octx.drawImage(bmp, 0, 0);
  bmp.close && bmp.close();
  let ref = refCanvas;
  if (ref.width !== out.width || ref.height !== out.height) {
    if (!opts.refResize) return { width: out.width, height: out.height, error: "dim mismatch ref=" + ref.width + "x" + ref.height };
    const rb = await createImageBitmap(refCanvas, { resizeWidth: out.width, resizeHeight: out.height, resizeQuality: "high" });
    const rc = document.createElement("canvas"); rc.width = out.width; rc.height = out.height;
    rc.getContext("2d").drawImage(rb, 0, 0);
    rb.close && rb.close();
    ref = rc;
  }
  if (opts.flattenRef) {
    // JPEG outputs of transparent sources are composited on white — compare
    // against the reference composited the SAME way, otherwise transparent
    // (black-RGB) reference pixels fake a low score.
    const fc = document.createElement("canvas"); fc.width = ref.width; fc.height = ref.height;
    const fcx = fc.getContext("2d");
    fcx.fillStyle = "#ffffff"; fcx.fillRect(0, 0, fc.width, fc.height);
    fcx.drawImage(ref, 0, 0);
    ref = fc;
  }
  const S = 512; // SSIM computed at <=512px long side for tractability
  const scale = Math.min(1, S / Math.max(out.width, out.height));
  const sw = Math.max(8, Math.round(out.width * scale)), sh = Math.max(8, Math.round(out.height * scale));
  function gray(canvas) {
    const t = document.createElement("canvas"); t.width = sw; t.height = sh;
    const tc = t.getContext("2d", { willReadFrequently: true });
    tc.imageSmoothingQuality = "high";
    tc.drawImage(canvas, 0, 0, sw, sh);
    const d = tc.getImageData(0, 0, sw, sh).data;
    const g = new Float32Array(sw * sh);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) g[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    return g;
  }
  const ga = gray(out), gb = gray(ref);
  const C1 = (0.01 * 255) * (0.01 * 255), C2 = (0.03 * 255) * (0.03 * 255), W = 8;
  let ssimSum = 0, windows = 0, minRef = 0;
  for (let y = 0; y + W <= sh; y += W) {
    for (let x = 0; x + W <= sw; x += W) {
      let ma = 0, mb = 0;
      for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { ma += ga[(y + j) * sw + x + i]; mb += gb[(y + j) * sw + x + i]; }
      const n = W * W; ma /= n; mb /= n;
      let va = 0, vb = 0, cov = 0;
      for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
        const da = ga[(y + j) * sw + x + i] - ma, db = gb[(y + j) * sw + x + i] - mb;
        va += da * da; vb += db * db; cov += da * db;
      }
      va /= n - 1; vb /= n - 1; cov /= n - 1;
      ssimSum += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
      windows++;
    }
  }
  // alpha stats on the FULL-res output
  const od = octx.getImageData(0, 0, out.width, out.height).data;
  let minA = 255, transCount = 0;
  for (let i = 3; i < od.length; i += 4) { if (od[i] < minA) minA = od[i]; if (od[i] < 250) transCount++; }
  const corner = [od[0], od[1], od[2], od[3]];
  // probe points (normalized coords) evaluated on the FULL-res output
  const probePoints = opts.probePoints || [];
  const probes = probePoints.map(([nx, ny]) => {
    const px = Math.min(out.width - 1, Math.round(nx * out.width)), py = Math.min(out.height - 1, Math.round(ny * out.height));
    const o = (py * out.width + px) * 4;
    return [od[o], od[o + 1], od[o + 2], od[o + 3]];
  });
  return {
    width: out.width, height: out.height,
    ssim: windows ? +(ssimSum / windows).toFixed(4) : null,
    minAlpha: minA, transparentPx: transCount, corner,
    probes
  };
};
`;

/* ---------- harness ---------- */
let consoleIssues = [];

async function newPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 2400 } });
  page.on("pageerror", (e) => consoleIssues.push({ kind: "pageerror", msg: String(e.message).slice(0, 300) }));
  page.on("console", (m) => { if (m.type() === "error") consoleIssues.push({ kind: "console", msg: m.text().slice(0, 300) }); });
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (/fonts\.|analytics|googletagmanager|_rsc/.test(u)) return; // prefetch aborts & 3rd-party noise
    consoleIssues.push({ kind: "requestfailed", msg: `${r.method()} ${u} :: ${r.failure()?.errorText}`.slice(0, 300) });
  });
  page.on("response", (r) => { if (r.status() >= 400) consoleIssues.push({ kind: "http" + r.status(), msg: r.url().slice(0, 200) }); });
  await page.addInitScript(GEN);
  await page.addInitScript(METRICS);
  return page;
}

async function hookCaptures(page) {
  await page.evaluate(() => {
    window.__captured = [];
    const _ocu = window.URL.createObjectURL.bind(window.URL);
    window.URL.createObjectURL = (obj) => {
      const url = _ocu(obj);
      if (obj instanceof Blob) window.__captured.push({ blob: obj });
      return url;
    };
  });
}

async function upload(page, names) {
  await page.evaluate((names2) => {
    const dt = new DataTransfer();
    for (const n of names2) {
      const im = window.__testImages.find((t) => t.file.name === n);
      dt.items.add(im.file);
    }
    const input = document.querySelector('input[type="file"]');
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, names);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__captured = []; }); // drop SOURCE preview URLs
}

async function clickAction(page) {
  // Exact accessible-name match: the Radix select trigger ALSO matches
  // :has-text('Compress') (its label says "best compression"), so we must
  // match the action button's exact name instead.
  const btn = page.getByRole("button", {
    name: /^(Compress|Compress All|Resize|Resize All|Convert|Convert All|Process Image|Process \d+ Images)$/,
  }).first();
  await btn.click();
  // done when result cards render OR the honest-error alert appears
  await page.waitForFunction(() => {
    const li = Array.from(document.querySelectorAll("li")).some((l) => (l.innerText || "").includes("Download"));
    const err = /Could not bring|Something went wrong|failed to process/i.test(document.body.innerText);
    return li || err;
  }, undefined, { timeout: 180000 });
  await page.waitForTimeout(800);
}

async function setNumber(page, key, value) {
  await page.fill(`#opt-${key}`, String(value));
  await page.waitForTimeout(200);
}

async function setSelect(page, key, labelPart) {
  await page.click(`#opt-${key}`);
  await page.waitForSelector("[role='option']", { timeout: 5000 });
  await page.locator(`[role='option']:has-text("${labelPart}")`).first().click();
  await page.waitForTimeout(300);
}

async function scrapeCards(page) {
  return page.evaluate(() => {
    const cards = [];
    for (const li of Array.from(document.querySelectorAll("li"))) {
      const t = li.innerText || "";
      if ((t.includes("Download") && li.querySelector("button")) && t.length < 600) cards.push(t.replace(/\n+/g, " | ").slice(0, 300));
    }
    return cards;
  });
}

async function captureOutputs(page) {
  return page.evaluate(async () => {
    const results = [];
    for (const c of window.__captured || []) {
      const buf = await c.blob.arrayBuffer();
      results.push({ mime: c.blob.type, size: c.blob.size, bytes: Array.from(new Uint8Array(buf)) });
    }
    window.__captured = [];
    return results;
  });
}

/* ---------- runner ---------- */
(async () => {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await newPage(browser);
  const report = { generatedOn: new Date().toISOString(), base: BASE, sourcesSynthetic: true, ssimMethod: "grayscale (0.299/0.587/0.114), downscaled to <=512px long side with high-quality resample, 8x8 uniform windows, global mean SSIM; reference = original resampled to the OUTPUT dimensions", tests: [] };
  const log = (t) => { console.log(JSON.stringify(t)); report.tests.push(t); };

  await page.goto(`${BASE}/image-compressor`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const sources = await page.evaluate(() => window.__makeTestImages());
  log({ test: "SOURCES (synthetic)", sources });

  const runTool = async (slug, names, prep) => {
    consoleIssues = [];
    await page.goto(`${BASE}/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.evaluate(async () => { if (!window.__testImages) await window.__makeTestImages(); });
    await hookCaptures(page);
    await upload(page, names);
    if (prep) await prep(); // options render only after a file is uploaded
    await clickAction(page);
    const outputs = await captureOutputs(page);
    const cards = await scrapeCards(page);
    return { outputs, cards, issues: consoleIssues };
  };

  const analyze = async (r, refName, opts) => {
    return page.evaluate(async ({ bytesArr, mime, refName: rn, opts }) => {
      const blob = new Blob([new Uint8Array(bytesArr)], { type: mime });
      return window.__metrics(blob, window.__refs[rn], opts || {});
    }, { bytesArr: r.bytes, mime: r.mime, refName, opts });
  };

  /* ---- T1: Image Compressor (auto) — format preservation, 4 sources ---- */
  for (const [src, expectMime] of [
    ["photo-landscape.jpg", "image/jpeg"],
    ["logo-transparent.png", "image/png"],
    ["source-webp.webp", "image/webp"],
    ["screenshot-text.png", "image/png"],
  ]) {
    const refName = src.replace(/\.[^.]+$/, "");
    const { outputs, cards, issues } = await runTool("image-compressor", [src]);
    for (const o of outputs) {
      const m = await analyze(o, refName, {});
      log({
        test: "T1 image-compressor auto", source: src, expectMime,
        outputMime: o.mime, sizeKB: +(o.size / 1024).toFixed(1),
        dims: `${m.width}x${m.height}`, ssim: m.ssim,
        formatPreserved: o.mime === expectMime,
        minAlpha: m.minAlpha, note: (cards[0] || "").slice(0, 160), issues,
      });
    }
  }

  /* ---- T2: Image Resizer (defaults 800x600 keepAspect) ---- */
  for (const src of ["photo-landscape.jpg", "portrait.jpg"]) {
    const refName = src.replace(/\.[^.]+$/, "");
    const { outputs, cards, issues } = await runTool("image-resizer", [src]);
    for (const o of outputs) {
      const m = await analyze(o, refName, { refResize: true });
      log({
        test: "T2 image-resizer", source: src, outputMime: o.mime, sizeKB: +(o.size / 1024).toFixed(1),
        dims: `${m.width}x${m.height}`, ssimVsResizedRef: m.ssim,
        note: (cards[0] || "").slice(0, 160), issues,
      });
    }
  }

  /* ---- T3: KB-target tools ---- */
  const kbCases = [
    ["compress-image-to-50kb", "screenshot-text.png", 50],
    ["compress-image-to-100kb", "logo-transparent.png", 100],
    ["compress-image-to-200kb", "portrait.jpg", 200],
    ["compress-image-to-500kb", "photo-landscape.jpg", 500],
    ["compress-image-to-specific-size", "source-webp.webp", 150],
    ["resize-image-to-kb", "photo-landscape.jpg", 200],
  ];
  for (const [slug, src, kb] of kbCases) {
    const refName = src.replace(/\.[^.]+$/, "");
    // flattenRef: transparent sources + JPEG output must be compared on white
    const flatten = src === "logo-transparent.png";
    const prep = slug === "compress-image-to-specific-size"
      ? async () => { await setNumber(page, "targetKB", 150); await setSelect(page, "format", "WebP"); }
      : null;
    const { outputs, cards, issues } = await runTool(slug, [src], prep);
    for (const o of outputs) {
      const m = await analyze(o, refName, { refResize: true, flattenRef: flatten && o.mime === "image/jpeg" });
      const withinTarget = o.size <= kb * 1024;
      const qMatch = /Quality (\d+)%/.exec(cards[0] || "");
      log({
        test: `T3 ${slug}`, source: src, targetKB: kb, outputMime: o.mime,
        sizeKB: +(o.size / 1024).toFixed(1), withinTarget,
        dims: `${m.width}x${m.height}`, ssimVsResizedRef: m.ssim,
        displayedQuality: qMatch ? +qMatch[1] : null,
        transparencyNote: /transparency flattened/.test(cards[0] || ""),
        note: (cards[0] || "").slice(0, 200), issues,
      });
    }
    if (outputs.length === 0) log({ test: `T3 ${slug}`, source: src, targetKB: kb, ERROR: "no output captured", cards, issues });
  }

  /* ---- T4: honest-error path — 50KB target on the huge noisy photo ---- */
  {
    const { outputs, cards, issues } = await runTool("compress-image-to-50kb", ["photo-landscape.jpg"]);
    const errorShown = cards.join(" ").toLowerCase().includes("could not") || issues.some((i) => /could not bring/i.test(i.msg));
    log({
      test: "T4 50KB on 4000px photo (may honestly fail)", source: "photo-landscape.jpg", targetKB: 50,
      outputs: outputs.length, withinTargetIfAny: outputs.every((o) => o.size <= 50 * 1024),
      errorShown, cards: cards.slice(0, 3), issues,
    });
  }

  /* ---- T5: Near-lossless — filename + high quality ---- */
  {
    const { outputs, cards, issues } = await runTool("near-lossless-image-compressor", ["photo-landscape.jpg"]);
    for (const o of outputs) {
      const m = await analyze(o, "photo-landscape", { refResize: false });
      log({
        test: "T5 near-lossless", source: "photo-landscape.jpg", outputMime: o.mime,
        sizeKB: +(o.size / 1024).toFixed(1), dims: `${m.width}x${m.height}`, ssim: m.ssim,
        filenameHasNearLossless: /near-lossless/.test(cards[0] || ""),
        note: (cards[0] || "").slice(0, 200), issues,
      });
    }
  }

  /* ---- T6: transparency behaviors ---- */
  {
    // 6a: transparent logo -> resize-png-image (PNG, alpha preserved)
    const { outputs, cards, issues } = await runTool("resize-png-image", ["logo-transparent.png"]);
    for (const o of outputs) {
      const m = await analyze(o, "logo-transparent", { refResize: true });
      log({ test: "T6a resize-png alpha", outputMime: o.mime, dims: `${m.width}x${m.height}`,
        minAlpha: m.minAlpha, alphaPreserved: m.minAlpha < 250, corner: m.corner,
        ssimVsResizedRef: m.ssim, issues });
    }
  }
  {
    // 6b: tiny-alpha -> image-compressor auto (PNG out): tiny hole survives
    const { outputs, issues } = await runTool("image-compressor", ["tiny-alpha.png"]);
    for (const o of outputs) {
      const m = await analyze(o, "tiny-alpha", {});
      log({ test: "T6b tiny-alpha compressor auto", outputMime: o.mime, dims: `${m.width}x${m.height}`,
        minAlpha: m.minAlpha, tinyHolePreserved: m.minAlpha < 250, issues });
    }
  }
  {
    // 6c: tiny-alpha -> 100KB KB-tool (JPEG out): hole becomes WHITE, not black
    const { outputs, cards, issues } = await runTool("compress-image-to-100kb", ["tiny-alpha.png"]);
    for (const o of outputs) {
      // holes at (41,81) and (151,120); probe their centers on the output
      const m = await analyze(o, "tiny-alpha", { refResize: false, flattenRef: true, probePoints: [[41 / 240, 81 / 180], [151 / 240, 120.5 / 180]] });
      log({ test: "T6c tiny-alpha -> 100KB jpeg", outputMime: o.mime, dims: `${m.width}x${m.height}`,
        corner: m.corner, holeProbes: m.probes,
        holesWhiteNotBlack: m.probes && m.probes.every((p) => p[0] > 200 && p[1] > 200 && p[2] > 200),
        flattenNote: /transparency flattened/.test(cards[0] || ""),
        blackBg: m.corner[0] < 40 && m.corner[1] < 40 && m.corner[2] < 40,
        note: (cards[0] || "").slice(0, 200), issues });
    }
  }

  /* ---- T7: Image to PDF — capture via Download click, save for parsing ---- */
  const pdfJobs = [
    ["pdf-single-portrait", ["portrait.jpg"]],
    ["pdf-single-landscape-large", ["photo-landscape.jpg"]],
    ["pdf-single-screenshot", ["screenshot-text.png"]],
    ["pdf-multi-3", ["photo-landscape.jpg", "portrait.jpg", "screenshot-text.png"]],
  ];
  for (const [tag, names] of pdfJobs) {
    const { issues } = await (async () => {
      consoleIssues = [];
      await page.goto(`${BASE}/image-to-pdf`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await page.evaluate(async () => { if (!window.__testImages) await window.__makeTestImages(); });
      await hookCaptures(page);
      await upload(page, names);
      await clickAction(page);
      // PDF result has no preview URL — the blob is captured when Download is clicked
      await page.locator("li button:has-text('Download')").first().click();
      await page.waitForTimeout(1500);
      const outputs = await captureOutputs(page);
      for (const o of outputs) {
        if (o.mime !== "application/pdf") continue;
        const file = path.join(PDF_DIR, `${tag}.pdf`);
        fs.writeFileSync(file, Buffer.from(o.bytes));
        log({ test: `T7 ${tag}`, files: names, pdfBytes: o.size, saved: file });
      }
      if (outputs.length === 0) log({ test: `T7 ${tag}`, files: names, ERROR: "no pdf captured" });
      return { issues: consoleIssues };
    })();
    log({ test: `T7 ${tag} console`, issues });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 1));
  console.log(`\nSaved -> ${OUT_JSON}`);
  console.log(`PDFs -> ${PDF_DIR}`);
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
