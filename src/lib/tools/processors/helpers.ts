/** Shared processor helpers. */

import type { LoadedImage } from "@/lib/image/loader";
import type { ProcessedResult, ToolOptionValues } from "../types";
import {
  createCanvas,
  ctx2d,
  encodeCanvas,
  imageToCanvas,
  canvasToBlob,
  drawScaled,
  outputName,
  type OutputFormat,
  type EncodeOptions,
} from "@/lib/image/canvas";
import { extensionOf } from "@/lib/image/loader";

export function num(o: ToolOptionValues, key: string, fallback: number): number {
  const v = o[key];
  return typeof v === "number" ? v : typeof v === "string" && v !== "" ? parseFloat(v) : fallback;
}
export function str(o: ToolOptionValues, key: string, fallback: string): string {
  const v = o[key];
  return typeof v === "string" && v !== "" ? v : fallback;
}
export function bool(o: ToolOptionValues, key: string, fallback = false): boolean {
  const v = o[key];
  return typeof v === "boolean" ? v : fallback;
}

export const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/x-icon": "ico",
};

export function sourceExt(img: LoadedImage): string {
  return extensionOf(img.name) || "jpg";
}

/** Encode a canvas into a ProcessedResult. */
export async function buildResult(
  img: LoadedImage,
  canvas: HTMLCanvasElement,
  enc: EncodeOptions,
  filename: string,
  note?: string
): Promise<ProcessedResult> {
  // 'auto' must preserve the original file's format (no hidden PNG→JPEG etc.)
  const encoded = await encodeCanvas(canvas, { ...enc, sourceType: img.type });
  return {
    id: `${img.id}-${Math.random().toString(36).slice(2, 7)}`,
    sourceId: img.id,
    sourceName: img.name,
    name: filename,
    blob: encoded.blob,
    width: encoded.width,
    height: encoded.height,
    originalSize: img.size,
    previewUrl: URL.createObjectURL(encoded.blob),
    note,
  };
}

export async function encodeImageResult(
  img: LoadedImage,
  canvas: HTMLCanvasElement,
  enc: EncodeOptions,
  suffix?: string,
  note?: string
): Promise<ProcessedResult> {
  const format = enc.format === "auto" ? "auto" : (enc.format as OutputFormat);
  // determine extension (auto resolves to the SOURCE format first)
  let ext: string;
  if (format === "auto") {
    const resolved = await import("@/lib/image/canvas").then((m) => m.resolveAutoFormat(canvas, "auto", img.type));
    ext = MIME_EXT[resolved] ?? "png";
  } else {
    ext = MIME_EXT[format] ?? "png";
  }
  return buildResult(img, canvas, enc, outputName(img.name, ext, suffix), note);
}

export function canvasFromImage(img: LoadedImage): HTMLCanvasElement {
  if (!img.bitmap) {
    throw new Error("This tool needs a decodable image file (JPG, PNG or WebP).");
  }
  return imageToCanvas(img.bitmap, img.width, img.height);
}

/** Scale canvas by factor. */
export function scaleCanvas(canvas: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const w = Math.max(1, Math.round(canvas.width * factor));
  const h = Math.max(1, Math.round(canvas.height * factor));
  return drawScaled(canvas, canvas.width, canvas.height, w, h);
}

/** Fit canvas into max dimensions keeping aspect. */
export function fitWithin(canvas: HTMLCanvasElement, maxW: number, maxH: number): HTMLCanvasElement {
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
  if (ratio >= 1) return canvas;
  return scaleCanvas(canvas, ratio);
}

/** Format a quality note for results. */
export function savingsNote(original: number, result: number): string {
  const diff = original - result;
  const pct = original > 0 ? Math.round((diff / original) * 100) : 0;
  if (diff > 0) return `Saved ${pct}% (${formatKB(result)} from ${formatKB(original)})`;
  if (diff < 0) return `+${Math.abs(pct)}% larger — try lower quality`;
  return "Same size";
}

export function formatKB(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Encode with a specific format string from options ('auto' allowed). */
export function encodeOpts(o: ToolOptionValues, qualityKey = "quality"): EncodeOptions {
  const q = num(o, qualityKey, 85) / 100;
  const format = str(o, "format", "auto") as OutputFormat;
  return { format, quality: q };
}

export { createCanvas, ctx2d, canvasToBlob };
