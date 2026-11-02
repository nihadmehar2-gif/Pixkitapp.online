/** Deep diagnostic: capture T3/T4 UI outputs, dump to disk, read result notes from DOM. */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE_URL || "http://localhost:3110";

const GEN = fs.readFileSync("/home/z/my-project/scripts/.gen-snippet.js", "utf8");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2400 } });
  await page.addInitScript(GEN);

  async function runTool(slug, imageName) {
    await page.goto(`${BASE}/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.evaluate(async () => {
      if (!window.__testImages) await window.__makeTestImages();
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
    await page.evaluate(() => { window.__captured = []; });
    await page.locator("button:has-text('Compress')").first().click();
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.some((b) => /^Compress/.test(b.textContent.trim()) && !b.disabled);
    }, { timeout: 90000 });
    await page.waitForTimeout(700);
    const notes = await page.evaluate(() =>
      Array.from(document.querySelectorAll("body *"))
        .filter((el) => el.children.length === 0 && /Quality|KB|target/.test(el.textContent))
        .map((el) => el.textContent.trim()).slice(0, 8)
    );
    const outs = await page.evaluate(async () => {
      const r = [];
      for (const c of window.__captured) {
        if (!c.blob.type.startsWith("image/")) continue;
        const buf = new Uint8Array(await c.blob.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192));
        r.push({ mime: c.blob.type, size: c.blob.size, b64: btoa(bin) });
      }
      return r;
    });
    return { notes, outs };
  }

  const t3 = await runTool("compress-image-to-100kb", "logo-transparent.png");
  console.log("T3 notes:", JSON.stringify(t3.notes));
  for (const o of t3.outs) {
    fs.writeFileSync(`/tmp/t3-output.${o.mime.split("/")[1]}`, Buffer.from(o.b64, "base64"));
    console.log(`T3 output: ${o.mime} ${(o.size / 1024).toFixed(1)}KB saved`);
  }

  const t4 = await runTool("compress-image-to-500kb", "big-photo.jpg");
  console.log("T4 notes:", JSON.stringify(t4.notes));
  for (const o of t4.outs) {
    fs.writeFileSync(`/tmp/t4-output.${o.mime.split("/")[1]}`, Buffer.from(o.b64, "base64"));
    console.log(`T4 output: ${o.mime} ${(o.size / 1024).toFixed(1)}KB saved`);
  }

  await browser.close();
})();
