/** Compression, resizing and format conversion processors. */

import type { LoadedImage } from "@/lib/image/loader";
import type { ProcessedResult, ProcessContext, ToolOptionValues } from "../types";
import {
  createCanvas,
  ctx2d,
  drawScaled,
  canvasToBlob,
  encodeWithAlphaHandling,
  flattenForJpeg,
  quickPsnr,
} from "@/lib/image/canvas";
import { canvasToBmpBlob, quantizeCanvas, applyPalette, getPixels, putPixels } from "@/lib/image/encoders";
import {
  num, str, bool, buildResult, encodeImageResult, canvasFromImage,
  scaleCanvas, fitWithin, savingsNote, formatKB, MIME_EXT, encodeOpts,
} from "./helpers";

/* ---------- Generic quality compressor ---------- */
async function compress(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const enc = encodeOpts(o);
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    const result = await encodeImageResult(img, canvas, enc, "compressed");
    result.note = savingsNote(img.size, result.blob.size);
    out.push(result);
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- Target size compressor (fidelity-first search, then downscale) ----------
 *  Strategy: keep the ORIGINAL dimensions and search for the candidate with
 *  the HIGHEST MEASURED fidelity (sampled PSNR) that fits the target — we do
 *  not assume a higher quality label is always better, because browser
 *  encoders are not monotonic near q=1.0 (measured: quality 97 can be a
 *  larger yet LESS faithful encode than quality 95). Besides the binary
 *  search we therefore also probe the known encoder switch points
 *  (0.95/0.9/0.85/0.8). Transparency is flattened onto white for JPEG
 *  (never black) and scoring uses the same flattened reference so alpha
 *  never skews the comparison. */
const PSNR_PROBES = [0.95, 0.9, 0.85, 0.8];

async function compressToSize(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const targetBytes = num(o, "__targetKB", 100) * 1024;
  const format = str(o, "format", "image/jpeg") as "image/jpeg" | "image/webp" | "image/png";
  const out: ProcessedResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    let bestBlob: Blob | null = null;
    let bestQuality = 0;
    let bestScore = -1;
    // Keep the highest-fidelity fitting candidate (ties → smaller file).
    const consider = async (blob: Blob, q: number, ref: HTMLCanvasElement) => {
      const score = await quickPsnr(ref, blob);
      if (score < 0) return;
      if (
        score > bestScore + 0.05 ||
        (Math.abs(score - bestScore) <= 0.05 && bestBlob !== null && blob.size < bestBlob.size)
      ) {
        bestBlob = blob;
        bestQuality = q;
        bestScore = score;
      }
    };
    let work = canvas;

    // JPEG output: composite transparency onto white ONCE and search on that
    // reference (also the scoring reference — keeps RGB comparisons valid).
    const fullRef = await flattenForJpeg(canvas, format, "#ffffff");
    // Fast floor check: if even the lowest quality busts the target at full
    // size, skip straight to downscaling instead of wasting encodes.
    const floorBlob = await canvasToBlob(fullRef, format, 0.05);
    if (floorBlob.size <= targetBytes) {
      await consider(floorBlob, 0.05, fullRef);
      // Binary search quality 0.05 -> 1.0, scoring every fitting candidate.
      let lo = 0.05, hi = 1.0;
      for (let attempt = 0; attempt < 9; attempt++) {
        const q = (lo + hi) / 2;
        const blob = await canvasToBlob(fullRef, format, q);
        if (blob.size <= targetBytes) {
          await consider(blob, q, fullRef);
          lo = q;
        } else {
          hi = q;
        }
      }
      // Probe fixed qualities around browser-encoder switch points — the
      // bisection grid alone can miss the best-fidelity pocket (e.g. q≈0.95).
      for (const pq of PSNR_PROBES) {
        const blob = await canvasToBlob(fullRef, format, pq);
        if (blob.size <= targetBytes) await consider(blob, pq, fullRef);
      }
    }
    // Still no candidate at full size? Downscale (re-deriving from the
    // ORIGINAL canvas each time — no cumulative generational loss) and run
    // the same scored search at each scale; the first fitting scale wins.
    let scale = 1;
    while (!bestBlob && work.width > 24) {
      scale *= 0.8;
      const w = Math.max(24, Math.round(canvas.width * scale));
      const h = Math.max(24, Math.round(canvas.height * scale));
      work = drawScaled(canvas, canvas.width, canvas.height, w, h);
      const refS = await flattenForJpeg(work, format, "#ffffff");
      const scaleFloor = await canvasToBlob(refS, format, 0.05);
      if (scaleFloor.size > targetBytes) continue;
      await consider(scaleFloor, 0.05, refS);
      let slo = 0.05, shi = 1.0;
      for (let attempt = 0; attempt < 7; attempt++) {
        const q = (slo + shi) / 2;
        const blob = await canvasToBlob(refS, format, q);
        if (blob.size <= targetBytes) { await consider(blob, q, refS); slo = q; } else shi = q;
      }
      for (const pq of PSNR_PROBES) {
        const blob = await canvasToBlob(refS, format, pq);
        if (blob.size <= targetBytes) await consider(blob, pq, refS);
      }
    }
    if (!bestBlob) {
      // Last resort at the smallest size. If even that exceeds the target,
      // fail honestly instead of silently delivering an oversized file.
      const blob = await encodeWithAlphaHandling(work, format, 0.05);
      if (blob.size > targetBytes) {
        throw new Error(
          `Could not get "${img.name}" under ${Math.round(targetBytes / 1024)}KB even at the smallest size — try a smaller or simpler image, or a higher target.`
        );
      }
      bestBlob = blob;
      bestQuality = 0.05;
    }
    const ext = MIME_EXT[format] ?? "jpg";
    const { outputName } = await import("@/lib/image/canvas");
    out.push({
      id: `${img.id}-ts${i}`,
      sourceId: img.id,
      sourceName: img.name,
      name: outputName(img.name, ext, `${Math.round(targetBytes / 1024)}kb`),
      blob: bestBlob,
      width: work.width,
      height: work.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(bestBlob),
      note: `Quality ${Math.round(bestQuality * 100)}% · ${formatKB(bestBlob.size)} (target ${Math.round(targetBytes / 1024)} KB)`,
    });
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- PNG compressor (palette reduction) ---------- */
async function compressPng(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const colors = num(o, "colors", 256);
  const gray = bool(o, "grayscale", false);
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let canvas = canvasFromImage(img);
    if (gray) {
      const px = getPixels(canvas);
      const d = px.data;
      for (let p = 0; p < d.length; p += 4) {
        const v = Math.round(0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]);
        d[p] = d[p + 1] = d[p + 2] = v;
      }
      putPixels(canvas, px);
    }
    if (colors < 256) {
      const palette = quantizeCanvas(canvas, colors);
      if (palette.length > 0) applyPalette(canvas, palette);
    }
    const blob = await canvasToBlob(canvas, "image/png");
    const result: ProcessedResult = {
      id: `${img.id}-png${i}`,
      sourceId: img.id,
      sourceName: img.name,
      name: `${img.name.replace(/\.[^.]+$/, "")}-min.png`,
      blob,
      width: canvas.width,
      height: canvas.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(blob),
      note: colors < 256 ? `Reduced to ${colors} colors` : "Re-encoded PNG",
    };
    result.note += " · " + savingsNote(img.size, blob.size);
    out.push(result);
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- Near-lossless compressor ---------- */
async function compressNearLossless(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    const format = str(o, "format", "image/jpeg") as "image/jpeg" | "image/webp" | "image/png";
    // Try highest qualities first, accept first that is smaller than original.
    // Alpha-safe encoding: transparent PNGs flattened to white for JPEG.
    let bestBlob: Blob | null = null;
    let usedQ = 100;
    for (const q of [0.95, 0.9, 0.85, 0.8]) {
      const blob = await encodeWithAlphaHandling(canvas, format, q);
      if (blob.size < img.size) { bestBlob = blob; usedQ = Math.round(q * 100); break; }
    }
    if (!bestBlob) {
      bestBlob = await encodeWithAlphaHandling(canvas, format, 0.92);
      usedQ = 92;
    }
    const ext = MIME_EXT[format] ?? "jpg";
    const { outputName } = await import("@/lib/image/canvas");
    out.push({
      id: `${img.id}-nl${i}`,
      sourceId: img.id,
      sourceName: img.name,
      name: outputName(img.name, ext, "lossless"),
      blob: bestBlob,
      width: canvas.width,
      height: canvas.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(bestBlob),
      note: `Near-lossless · quality ${usedQ} · ${savingsNote(img.size, bestBlob.size)}`,
    });
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- Resize processors ---------- */
async function resize(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const mode = str(o, "mode", "both");
  const enc = encodeOpts(o);
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    let w = canvas.width, h = canvas.height;
    const inW = num(o, "width", canvas.width);
    const inH = num(o, "height", canvas.height);
    const keep = bool(o, "keepAspect", true);

    if (mode === "width") { w = inW; h = Math.round((inW / canvas.width) * canvas.height); }
    else if (mode === "height") { h = inH; w = Math.round((inH / canvas.height) * canvas.width); }
    else if (mode === "percent") {
      const p = num(o, "percent", 50) / 100;
      w = Math.round(canvas.width * p); h = Math.round(canvas.height * p);
    } else {
      if (keep && inW > 0 && inH > 0) {
        const r = Math.min(inW / canvas.width, inH / canvas.height);
        w = Math.round(canvas.width * r); h = Math.round(canvas.height * r);
      } else { w = inW || canvas.width; h = inH || canvas.height; }
    }
    w = Math.max(1, Math.min(w, 12000)); h = Math.max(1, Math.min(h, 12000));
    const scaled = drawScaled(canvas, canvas.width, canvas.height, w, h);
    const result = await encodeImageResult(img, scaled, enc, "resized", `${w}×${h}`);
    result.note = `${canvas.width}×${canvas.height} → ${w}×${h}`;
    out.push(result);
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- Resize to KB ---------- */
async function resizeToKB(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const targetBytes = num(o, "__targetKB", 200) * 1024;
  const maxDim = num(o, "maxDimension", 0);
  const format = str(o, "format", "image/jpeg") as "image/jpeg" | "image/webp";
  const out: ProcessedResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let canvas = canvasFromImage(img);
    if (maxDim > 0 && Math.max(canvas.width, canvas.height) > maxDim) {
      canvas = fitWithin(canvas, maxDim, maxDim);
    }
    let bestBlob: Blob | null = null;
    let bestScale = 1;
    let q = 0.9;
    for (let s = 1; s >= 0.2; s = +(s - 0.1).toFixed(2)) {
      const w = Math.round(canvas.width * s);
      const h = Math.round(canvas.height * s);
      const work = s === 1 ? canvas : drawScaled(canvas, canvas.width, canvas.height, w, h);
      // JPEG: composite transparency onto white once per scale; scoring and
      // encoding both use this reference (valid RGB comparison).
      const refS = await flattenForJpeg(work, format, "#ffffff");
      // Floor check per scale: skip the search when this scale cannot fit
      // the target even at the lowest quality.
      const floorBlob = await canvasToBlob(refS, format, 0.05);
      if (floorBlob.size > targetBytes) continue;
      // Scored search at this scale: highest measured fidelity that fits.
      let bestScore = -1;
      let scaleBlob: Blob = floorBlob;
      let scaleQ = 0.05;
      const consider = async (blob: Blob, qq: number) => {
        const score = await quickPsnr(refS, blob);
        if (score < 0) return;
        if (
          score > bestScore + 0.05 ||
          (Math.abs(score - bestScore) <= 0.05 && blob.size < scaleBlob.size)
        ) {
          scaleBlob = blob;
          scaleQ = qq;
          bestScore = score;
        }
      };
      await consider(floorBlob, 0.05);
      let lo = 0.05, hi = 1.0;
      for (let a = 0; a < 8; a++) {
        const qq = (lo + hi) / 2;
        const blob = await canvasToBlob(refS, format, qq);
        if (blob.size <= targetBytes) { await consider(blob, qq); lo = qq; } else hi = qq;
      }
      for (const pq of PSNR_PROBES) {
        const blob = await canvasToBlob(refS, format, pq);
        if (blob.size <= targetBytes) await consider(blob, pq);
      }
      bestBlob = scaleBlob;
      q = scaleQ;
      bestScale = s;
      break;
    }
    if (!bestBlob) {
      // Last resort at the smallest scale. If even that exceeds the target,
      // fail honestly instead of silently delivering an oversized file.
      const s = 0.2;
      const w = Math.max(24, Math.round(canvas.width * s));
      const h = Math.max(24, Math.round(canvas.height * s));
      const work = drawScaled(canvas, canvas.width, canvas.height, w, h);
      const blob = await encodeWithAlphaHandling(work, format, 0.05);
      if (blob.size > targetBytes) {
        throw new Error(
          `Could not get "${img.name}" under ${Math.round(targetBytes / 1024)}KB even at the smallest size — try a smaller or simpler image, or a higher target.`
        );
      }
      bestBlob = blob;
      bestScale = s;
      q = 0.05;
    }
    const { outputName } = await import("@/lib/image/canvas");
    const finalCanvas = bestScale === 1 ? canvas : drawScaled(canvas, canvas.width, canvas.height, Math.round(canvas.width * bestScale), Math.round(canvas.height * bestScale));
    // A huge sentinel target (used by optimizer presets that only cap
    // dimensions) must not leak into the download filename.
    const sizeTag = targetBytes >= 100000 * 1024 ? "optimized" : `${Math.round(targetBytes / 1024)}kb`;
    out.push({
      id: `${img.id}-rkb${i}`,
      sourceId: img.id,
      sourceName: img.name,
      name: outputName(img.name, MIME_EXT[format] ?? "jpg", sizeTag),
      blob: bestBlob,
      width: finalCanvas.width,
      height: finalCanvas.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(bestBlob),
      note: `${formatKB(bestBlob.size)} · quality ${Math.round(q * 100)}% · ${finalCanvas.width}×${finalCanvas.height}`,
    });
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- Enlarge / upscale ---------- */
async function enlarge(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const factor = num(o, "factor", 2);
  const sharpen = bool(o, "sharpen", true);
  const enc = encodeOpts(o);
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    const w = Math.min(12000, Math.round(canvas.width * factor));
    const h = Math.min(12000, Math.round(canvas.height * factor));
    // Multi-step upscale for smoother results
    let cur = canvas;
    let cw = canvas.width, ch = canvas.height;
    while (cw * 2 <= w) {
      const next = createCanvas(cw * 2, ch * 2);
      const nctx = ctx2d(next);
      nctx.imageSmoothingEnabled = true;
      nctx.imageSmoothingQuality = "high";
      nctx.drawImage(cur, 0, 0, next.width, next.height);
      cur = next; cw = next.width; ch = next.height;
    }
    const up = createCanvas(w, h);
    ctx2d(up).drawImage(cur, 0, 0, w, h);
    if (sharpen) {
      // mild unsharp via filter
      const sctx = ctx2d(up);
      const data = sctx.getImageData(0, 0, w, h);
      sctx.putImageData(sharpenData(data, 40), 0, 0);
    }
    const result = await encodeImageResult(img, up, { ...enc, format: enc.format === "auto" ? "image/png" : enc.format }, `${factor}x`);
    result.note = `${canvas.width}×${canvas.height} → ${w}×${h}`;
    out.push(result);
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

function sharpenData(imageData: ImageData, amount: number): ImageData {
  const { data, width, height } = imageData;
  const copy = new Uint8ClampedArray(data);
  const k = amount / 100;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * width + x) * 4 + c;
        const center = copy[idx];
        const around = copy[idx - 4] + copy[idx + 4] + copy[idx - width * 4] + copy[idx + width * 4];
        data[idx] = center + k * (center * 4 - around) / 4;
      }
    }
  }
  return imageData;
}

/* ---------- Thumbnail maker ---------- */
async function thumbnail(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const size = num(o, "size", 256);
  const fit = str(o, "fit", "cover");
  const enc = encodeOpts(o);
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    let thumb: HTMLCanvasElement;
    if (fit === "cover") {
      // Two-step: high-quality resample to the cover size first, then
      // center-crop. A single full-size→square draw aliases on big inputs.
      const r = Math.max(size / canvas.width, size / canvas.height);
      const w = Math.max(1, Math.round(canvas.width * r));
      const h = Math.max(1, Math.round(canvas.height * r));
      const scaled = drawScaled(canvas, canvas.width, canvas.height, w, h);
      thumb = createCanvas(size, size);
      const tctx = ctx2d(thumb);
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = "high";
      tctx.drawImage(scaled, Math.floor((size - w) / 2), Math.floor((size - h) / 2), w, h);
    } else {
      const r = Math.min(size / canvas.width, size / canvas.height);
      const w = Math.max(1, Math.round(canvas.width * r)), h = Math.max(1, Math.round(canvas.height * r));
      thumb = drawScaled(canvas, canvas.width, canvas.height, w, h);
    }
    const result = await encodeImageResult(img, thumb, enc, `${size}px-thumb`);
    result.note = `${size}×${size} ${fit === "cover" ? "square" : "fit"} thumbnail`;
    out.push(result);
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- Format conversion ---------- */
async function convert(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const format = str(o, "format", "image/png") as "image/jpeg" | "image/png" | "image/webp";
  const quality = num(o, "quality", 90) / 100;
  const bg = str(o, "background", "#ffffff");
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    const result = await buildResult(img, canvas, { format, quality, background: bg }, `${img.name.replace(/\.[^.]+$/, "")}.${MIME_EXT[format] ?? "png"}`);
    result.note = `${img.type || "source"} → ${format.split("/")[1].toUpperCase()}${format === "image/jpeg" || format === "image/webp" ? ` · quality ${Math.round(quality * 100)}%` : ""}`;
    out.push(result);
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

/* ---------- BMP conversion ---------- */
async function convertBmp(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    const blob = canvasToBmpBlob(canvas);
    out.push({
      id: `${img.id}-bmp${i}`,
      sourceId: img.id,
      sourceName: img.name,
      name: `${img.name.replace(/\.[^.]+$/, "")}.bmp`,
      blob,
      width: canvas.width,
      height: canvas.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(blob),
      note: "24-bit BMP (Windows bitmap)",
    });
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

export const basicProcessors = {
  compress,
  compressToSize,
  compressPng,
  compressNearLossless,
  resize,
  resizeToKB,
  enlarge,
  thumbnail,
  convert,
  convertBmp,
};
