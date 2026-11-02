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
  canvasHasAlpha,
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

/* ---------- Target size compressor (quality-first, then scale search) ----------
 *  Algorithm (fidelity-first, fixed iteration counts, no infinite loops):
 *  A. At the ORIGINAL dimensions binary-search quality in [floor, 0.95]
 *     (floor = 0.80 JPEG / 0.75 WebP). If a candidate fits, keep the original
 *     dimensions and use the highest quality that fits.
 *  B. Otherwise pin quality at the floor and binary-search the SCALE (≥9
 *     iterations), always re-deriving every candidate from the ORIGINAL
 *     canvas (never from an already-resized one) and preserving aspect.
 *  C. At the chosen scale binary-search quality again in [floor, 0.95] to
 *     spend the leftover size budget on fidelity.
 *  Minimum output size: never below 25% of the original dimensions nor below
 *  320px on the short side (whichever is larger). If the target is still
 *  unreachable the processor throws an honest error instead of degrading
 *  quality below the floor or shrinking further. The final output is encoded
 *  exactly once from the original bitmap; search candidates are discarded.
 *  Transparency is composited onto white ONCE for JPEG output (never black)
 *  and the result carries an explicit note — it is never silent. */
const KB_QUALITY_FLOOR: Record<string, number> = { "image/jpeg": 0.8, "image/webp": 0.75 };
const KB_QUALITY_MAX = 0.95;
const KB_MIN_DIM_RATIO = 0.25; // never below 25% of the original dimensions
const KB_MIN_SHORT_SIDE = 320; // never below 320px on the short side
const KB_SCALE_ITERATIONS = 10; // spec requires ≥9
const KB_QUALITY_ITERATIONS = 9; // spec requires ≥9

interface TargetSizeOutcome {
  blob: Blob;
  width: number;
  height: number;
  scale: number;
  /** Encoded quality (0..1); undefined for PNG, which is always lossless. */
  quality?: number;
}

/** Smallest allowed uniform scale for a W×H source under the minimum-size rule. */
function kbMinScale(width: number, height: number): number {
  const byRatio = KB_MIN_DIM_RATIO;
  const byShortSide = KB_MIN_SHORT_SIDE / Math.min(width, height);
  return Math.min(1, Math.max(byRatio, byShortSide));
}

function kbScaledDims(width: number, height: number, scale: number): { w: number; h: number } {
  return {
    w: Math.max(1, Math.round(width * scale)),
    h: Math.max(1, Math.round(height * scale)),
  };
}

/** Run the A/B/C target-size search for one image.
 *  Returns null when the target cannot be reached within the quality floor
 *  and the minimum-size constraints (the caller turns this into an error). */
async function searchTargetSize(
  original: HTMLCanvasElement,
  format: "image/jpeg" | "image/webp" | "image/png",
  targetBytes: number
): Promise<TargetSizeOutcome | null> {
  const srcW = original.width;
  const srcH = original.height;
  // JPEG output: composite transparency onto white ONCE up front — linear
  // resampling commutes with alpha-over-white, so every candidate (and the
  // final encode) can be derived from this flattened ORIGINAL. This also
  // keeps candidate encodes alpha-safe without re-scanning per candidate.
  const source =
    format === "image/jpeg" ? await flattenForJpeg(original, "image/jpeg", "#ffffff") : original;

  const encodeAt = async (scale: number, quality?: number): Promise<Blob> => {
    const { w, h } = kbScaledDims(srcW, srcH, scale);
    const work = scale === 1 ? source : drawScaled(source, srcW, srcH, w, h);
    return canvasToBlob(work, format, quality);
  };

  if (format === "image/png") {
    // PNG has no quality dial — never degrade it to hit a target. If the
    // full-size encode does not fit, find the LARGEST scale that does
    // (the smallest reduction), within the minimum-size constraints.
    const fullBlob = await encodeAt(1);
    if (fullBlob.size <= targetBytes) {
      return { blob: fullBlob, width: srcW, height: srcH, scale: 1, quality: undefined };
    }
    const minScale = kbMinScale(srcW, srcH);
    const minBlob = await encodeAt(minScale);
    if (minBlob.size > targetBytes) return null;
    let lo = minScale;
    let hi = 1;
    let bestScale = minScale;
    for (let i = 0; i < KB_SCALE_ITERATIONS; i++) {
      const mid = (lo + hi) / 2;
      const blob = await encodeAt(mid);
      if (blob.size <= targetBytes) {
        bestScale = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const { w, h } = kbScaledDims(srcW, srcH, bestScale);
    const finalCanvas = bestScale === 1 ? source : drawScaled(source, srcW, srcH, w, h);
    const finalBlob = await canvasToBlob(finalCanvas, format);
    if (finalBlob.size > targetBytes) return null; // never report success over target
    return { blob: finalBlob, width: w, height: h, scale: bestScale, quality: undefined };
  }

  const floor = KB_QUALITY_FLOOR[format] ?? 0.8;

  // ---- Stage A: original dimensions, quality in [floor, 0.95] ----
  const topBlob = await encodeAt(1, KB_QUALITY_MAX);
  if (topBlob.size <= targetBytes) {
    return { blob: topBlob, width: srcW, height: srcH, scale: 1, quality: KB_QUALITY_MAX };
  }
  const floorBlob = await encodeAt(1, floor);
  if (floorBlob.size <= targetBytes) {
    let lo = floor;
    let hi = KB_QUALITY_MAX;
    let bestQuality = floor;
    let bestBlob = floorBlob;
    for (let i = 0; i < KB_QUALITY_ITERATIONS; i++) {
      const mid = (lo + hi) / 2;
      const blob = await encodeAt(1, mid);
      if (blob.size <= targetBytes) {
        bestQuality = mid;
        bestBlob = blob;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return { blob: bestBlob, width: srcW, height: srcH, scale: 1, quality: bestQuality };
  }

  // ---- Stage B: quality pinned at the floor, binary-search the scale ----
  const minScale = kbMinScale(srcW, srcH);
  const minBlob = await encodeAt(minScale, floor);
  if (minBlob.size > targetBytes) return null; // honest error upstream
  let lo = minScale;
  let hi = 1;
  let bestScale = minScale;
  for (let i = 0; i < KB_SCALE_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const blob = await encodeAt(mid, floor);
    if (blob.size <= targetBytes) {
      bestScale = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  // ---- Stage C: at the chosen scale, spend the leftover budget on quality ----
  const { w, h } = kbScaledDims(srcW, srcH, bestScale);
  const scaledCanvas = bestScale === 1 ? source : drawScaled(source, srcW, srcH, w, h);
  const topAtScale = await canvasToBlob(scaledCanvas, format, KB_QUALITY_MAX);
  let bestQuality = floor;
  let bestBlob = await encodeAt(bestScale, floor);
  if (topAtScale.size <= targetBytes) {
    bestQuality = KB_QUALITY_MAX;
    bestBlob = topAtScale;
  } else {
    let qLo = floor;
    let qHi = KB_QUALITY_MAX;
    for (let i = 0; i < KB_QUALITY_ITERATIONS; i++) {
      const mid = (qLo + qHi) / 2;
      const blob = await canvasToBlob(scaledCanvas, format, mid);
      if (blob.size <= targetBytes) {
        bestQuality = mid;
        bestBlob = blob;
        qLo = mid;
      } else {
        qHi = mid;
      }
    }
  }

  // ---- Final output: encoded once from the original bitmap ----
  const finalCanvas = bestScale === 1 ? source : drawScaled(source, srcW, srcH, w, h);
  const finalBlob = await canvasToBlob(finalCanvas, format, bestQuality);
  if (finalBlob.size > targetBytes) return null; // never report success over target
  return { blob: finalBlob, width: w, height: h, scale: bestScale, quality: bestQuality };
}

async function compressToSize(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const targetBytes = num(o, "__targetKB", 100) * 1024;
  const format = str(o, "format", "image/jpeg") as "image/jpeg" | "image/webp" | "image/png";
  const out: ProcessedResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const canvas = canvasFromImage(img);
    const result = await searchTargetSize(canvas, format, targetBytes);
    if (!result) {
      throw new Error(
        `Could not bring "${img.name}" under ${Math.round(targetBytes / 1024)}KB while keeping quality ≥ ` +
        `${Math.round((KB_QUALITY_FLOOR[format] ?? 0.8) * 100)}% and dimensions ≥ 25% of the original (short side ≥ ${KB_MIN_SHORT_SIDE}px). ` +
        `Try a higher target, a smaller source image, or WebP output.`
      );
    }
    // JPEG output of a transparent source flattens onto white — say so and
    // point at the alpha-capable alternative instead of staying silent.
    let alphaNote = "";
    if (format === "image/jpeg" && img.type !== "image/jpeg" && (await canvasHasAlpha(canvas))) {
      alphaNote = " · transparency flattened onto white (WebP keeps transparency)";
    }
    const ext = MIME_EXT[format] ?? "jpg";
    const { outputName } = await import("@/lib/image/canvas");
    const qualityLabel =
      result.quality === undefined ? "PNG (lossless)" : `Quality ${Math.round(result.quality * 100)}%`;
    const dimsLabel = result.scale < 1 ? ` · ${result.width}×${result.height}` : "";
    out.push({
      id: `${img.id}-ts${i}`,
      sourceId: img.id,
      sourceName: img.name,
      name: outputName(img.name, ext, `${Math.round(targetBytes / 1024)}kb`),
      blob: result.blob,
      width: result.width,
      height: result.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(result.blob),
      note: `${qualityLabel}${dimsLabel} · ${formatKB(result.blob.size)} (target ${Math.round(targetBytes / 1024)} KB)${alphaNote}`,
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
  const format = str(o, "format", "image/jpeg") as "image/jpeg" | "image/webp" | "image/png";
  // Optimizer presets (Image Optimizer / Optimize for Web / Email Resizer)
  // pass a huge sentinel target and an explicit quality slider — they want
  // dimension capping + ONE encode at the user's quality, not a KB search.
  // The displayed quality must equal the real encoder quality.
  const sentinel = targetBytes >= 100000 * 1024;
  const out: ProcessedResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const original = canvasFromImage(img);
    // Optional user-requested dimension cap (kept: an explicit user choice).
    const canvas =
      maxDim > 0 && Math.max(original.width, original.height) > maxDim
        ? fitWithin(original, maxDim, maxDim)
        : original;

    let result: TargetSizeOutcome;
    let qualityLabel: string;
    let note: string;
    if (sentinel) {
      const q = Math.min(1, Math.max(0.05, num(o, "quality", 85) / 100));
      const source =
        format === "image/jpeg" ? await flattenForJpeg(canvas, "image/jpeg", "#ffffff") : canvas;
      const blob = await canvasToBlob(source, format, format === "image/png" ? undefined : q);
      result = { blob, width: canvas.width, height: canvas.height, scale: 1, quality: format === "image/png" ? undefined : q };
      qualityLabel = format === "image/png" ? "PNG (lossless)" : `Quality ${Math.round(q * 100)}%`;
      const alphaNote =
        format === "image/jpeg" && img.type !== "image/jpeg" && (await canvasHasAlpha(original))
          ? " · transparency flattened onto white (WebP keeps transparency)"
          : "";
      note = `${qualityLabel} · ${formatKB(blob.size)} · ${canvas.width}×${canvas.height}${alphaNote}`;
    } else {
      const searched = await searchTargetSize(canvas, format, targetBytes);
      if (!searched) {
        throw new Error(
          `Could not bring "${img.name}" under ${Math.round(targetBytes / 1024)}KB while keeping quality ≥ ` +
          `${Math.round((KB_QUALITY_FLOOR[format] ?? 0.8) * 100)}% and dimensions ≥ 25% of the original (short side ≥ ${KB_MIN_SHORT_SIDE}px). ` +
          `Try a higher target, a smaller source image, or WebP output.`
        );
      }
      result = searched;
      qualityLabel = searched.quality === undefined ? "PNG (lossless)" : `Quality ${Math.round(searched.quality * 100)}%`;
      let alphaNote = "";
      if (format === "image/jpeg" && img.type !== "image/jpeg" && (await canvasHasAlpha(original))) {
        alphaNote = " · transparency flattened onto white (WebP keeps transparency)";
      }
      note = `${formatKB(result.blob.size)} · ${qualityLabel} · ${result.width}×${result.height}${alphaNote}`;
    }

    const { outputName } = await import("@/lib/image/canvas");
    // A huge sentinel target (used by optimizer presets that only cap
    // dimensions) must not leak into the download filename.
    const sizeTag = sentinel ? "optimized" : `${Math.round(targetBytes / 1024)}kb`;
    out.push({
      id: `${img.id}-rkb${i}`,
      sourceId: img.id,
      sourceName: img.name,
      name: outputName(img.name, MIME_EXT[format] ?? "jpg", sizeTag),
      blob: result.blob,
      width: result.width,
      height: result.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(result.blob),
      note,
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
