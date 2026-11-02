/**
 * Canvas creation, encoding and download helpers.
 */

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp" | "auto";

export interface EncodeOptions {
  format: OutputFormat;
  quality?: number; // 0..1 for jpeg/webp
  background?: string; // flatten background for formats without alpha
  /** MIME type of the ORIGINAL source file. When format is 'auto' the source
   *  format is preserved (JPEG stays JPEG, PNG stays PNG, WebP stays WebP)
   *  instead of lossy-converting opaque images to JPEG. */
  sourceType?: string | null;
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function ctx2d(canvas: HTMLCanvasElement, alpha = true): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: false, alpha });
  if (!ctx) throw new Error("Canvas 2D context is not supported in this browser.");
  return ctx;
}

export function ctxForRead(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context is not supported in this browser.");
  return ctx;
}

/** Flatten an image onto a background color (for converting to JPEG etc). */
export function drawFlattened(
  source: CanvasImageSource,
  width: number,
  height: number,
  background: string = "#ffffff"
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const ctx = ctx2d(canvas, false);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Pick the actual encode mime for 'auto'.
 *  Preserves the original file's format when it is a common web format
 *  (JPEG/PNG/WebP) so auto never performs a hidden lossy conversion.
 *  Only falls back to alpha detection for exotic/unknown sources. */
export async function resolveAutoFormat(
  canvas: HTMLCanvasElement,
  preferred: OutputFormat,
  sourceType?: string | null
): Promise<Exclude<OutputFormat, "auto">> {
  if (preferred !== "auto") return preferred;
  if (sourceType === "image/jpeg" || sourceType === "image/png" || sourceType === "image/webp") {
    return sourceType;
  }
  // Unknown source (e.g. some SVG/bitmap rasters): keep alpha safe in PNG,
  // otherwise encode JPEG (smaller).
  if (await canvasHasAlpha(canvas)) return "image/png";
  return "image/jpeg";
}

export async function canvasHasAlpha(canvas: HTMLCanvasElement): Promise<boolean> {
  const ctx = ctxForRead(canvas);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  // Sample every 4th pixel alpha channel for speed on large images
  const step = 4 * 4;
  for (let i = 3; i < data.length; i += step) {
    if (data[i] < 255) return true;
  }
  return false;
}

/** Encode a canvas to a Blob. */
export function canvasToBlob(canvas: HTMLCanvasElement, format: Exclude<OutputFormat, "auto">, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`This browser could not encode ${format}.`));
      },
      format,
      quality
    );
  });
}

export interface EncodedResult {
  blob: Blob;
  mime: string;
  width: number;
  height: number;
}

/** Encode canvas with auto format resolution + alpha flattening. */
export async function encodeCanvas(canvas: HTMLCanvasElement, opts: EncodeOptions): Promise<EncodedResult> {
  const format = await resolveAutoFormat(canvas, opts.format, opts.sourceType);
  const target = await flattenForJpeg(canvas, format, opts.background ?? "#ffffff");
  const blob = await canvasToBlob(target, format, opts.quality);
  return { blob, mime: format, width: target.width, height: target.height };
}

/** For JPEG output, composite transparency over the background color once.
 *  Encoding a transparent canvas straight to JPEG turns transparent pixels
 *  BLACK in most browsers — this prevents that. Other formats pass through. */
export async function flattenForJpeg(
  canvas: HTMLCanvasElement,
  format: "image/jpeg" | "image/png" | "image/webp",
  background: string = "#ffffff"
): Promise<HTMLCanvasElement> {
  if (format !== "image/jpeg") return canvas;
  if (await canvasHasAlpha(canvas)) {
    return drawFlattened(canvas, canvas.width, canvas.height, background);
  }
  return canvas;
}

/** Convenience: alpha-safe encode to a fixed format/quality (target-KB tools). */
export async function encodeWithAlphaHandling(
  canvas: HTMLCanvasElement,
  format: Exclude<OutputFormat, "auto">,
  quality: number,
  background: string = "#ffffff"
): Promise<Blob> {
  const target = await flattenForJpeg(canvas, format, background);
  return canvasToBlob(target, format, quality);
}

/** Cheap sampled PSNR between a canvas and an encoded candidate of the same
 *  dimensions (returns -1 when dimensions differ).
 *  Used by target-size searches to pick the highest-fidelity candidate:
 *  browser encoders are NOT strictly monotonic in the 0.95-1.0 quality range
 *  (measured: q=0.97 can produce a larger yet LESS faithful file than q=0.95),
 *  so fidelity must be measured, not assumed from the quality label. */
/** Cache of reference pixel data per canvas — avoids re-reading a possibly
 *  huge ImageData on every scored candidate during target-size searches. */
const psnrRefCache = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();

export async function quickPsnr(source: HTMLCanvasElement, candidate: Blob): Promise<number> {
  try {
    const bmp = await createImageBitmap(candidate);
    if (bmp.width !== source.width || bmp.height !== source.height) return -1;
    const c = createCanvas(bmp.width, bmp.height);
    const cctx = ctxForRead(c);
    cctx.drawImage(bmp, 0, 0);
    bmp.close();
    const a = cctx.getImageData(0, 0, c.width, c.height).data;
    let b = psnrRefCache.get(source);
    if (!b) {
      b = ctxForRead(source).getImageData(0, 0, source.width, source.height).data;
      psnrRefCache.set(source, b);
    }
    let se = 0;
    let n = 0;
    const stride = 4 * Math.max(1, Math.floor((c.width * c.height) / 200000));
    for (let i = 0; i < a.length; i += stride) {
      for (let k = 0; k < 3; k++) {
        const d = a[i + k] - b[i + k];
        se += d * d;
        n++;
      }
    }
    const mse = se / n;
    return mse === 0 ? 99 : 10 * Math.log10(255 * 255 / mse);
  } catch {
    return -1;
  }
}

/** High-quality multi-step rescale for BOTH directions (avoids aliasing on
 *  large reductions and harsh single-pass enlargements). */
export function drawScaled(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): HTMLCanvasElement {
  // Upscaling: a single high-quality draw is correct (stepping up in halves
  // adds no information and can soften edges further).
  if (dstW >= srcW && dstH >= srcH) {
    const up = createCanvas(dstW, dstH);
    const uctx = ctx2d(up);
    uctx.imageSmoothingEnabled = true;
    uctx.imageSmoothingQuality = "high";
    uctx.drawImage(source, 0, 0, dstW, dstH);
    return up;
  }
  let current = source;
  let cw = srcW;
  let ch = srcH;
  // Step down in halves until within 2x of target
  while (cw / 2 >= dstW && ch / 2 >= dstH && cw > 2 && ch > 2) {
    const half = createCanvas(Math.max(1, Math.floor(cw / 2)), Math.max(1, Math.floor(ch / 2)));
    const hctx = ctx2d(half);
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(current, 0, 0, half.width, half.height);
    current = half;
    cw = half.width;
    ch = half.height;
  }
  const out = createCanvas(dstW, dstH);
  const octx = ctx2d(out);
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(current, 0, 0, dstW, dstH);
  return out;
}

export function baseName(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

export function outputName(name: string, ext: string, suffix?: string): string {
  const s = suffix ? `-${suffix}` : "";
  return `${baseName(name)}${s}.${ext}`;
}

export const EXT_FOR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/x-icon": "ico",
  "application/pdf": "pdf",
};

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Get a drawable canvas from any loaded image. */
export function imageToCanvas(img: HTMLImageElement | ImageBitmap, w?: number, h?: number): HTMLCanvasElement {
  const width = w ?? img.width;
  const height = h ?? img.height;
  const canvas = createCanvas(width, height);
  const ctx = ctx2d(canvas);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = createCanvas(src.width, src.height);
  ctx2d(out).drawImage(src, 0, 0);
  return out;
}
