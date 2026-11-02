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

/** Cached alpha-scan result per canvas — an accurate scan is not free on
 *  large images, and target-size searches inspect the same canvas many
 *  times. Only valid for canvases that are not redrawn after the check;
 *  processors scan freshly-derived canvases, so this holds in practice. */
const alphaScanCache = new WeakMap<HTMLCanvasElement, boolean>();

/** Accurate transparency detection: every pixel's alpha channel is checked
 *  (no sampling), read in row bands so peak memory stays bounded on large
 *  images and the scan can exit early. Fully-transparent AND partially
 *  transparent pixels both count, so tiny transparent regions are never
 *  missed (they used to turn black when flattened for JPEG). */
export async function canvasHasAlpha(canvas: HTMLCanvasElement): Promise<boolean> {
  const cached = alphaScanCache.get(canvas);
  if (cached !== undefined) return cached;
  const ctx = ctxForRead(canvas);
  let found = false;
  // ~4MB bands (width * rows * 4 bytes) balance getImageData call overhead
  // against peak memory on large images.
  const bandRows = Math.max(1, Math.floor(4000000 / Math.max(1, canvas.width * 4)));
  for (let y = 0; y < canvas.height && !found; y += bandRows) {
    const rows = Math.min(bandRows, canvas.height - y);
    const data = ctx.getImageData(0, y, canvas.width, rows).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        found = true;
        break;
      }
    }
  }
  alphaScanCache.set(canvas, found);
  return found;
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
  // JPEG sources cannot carry alpha — skip the scan entirely; for other
  // sources the accurate cached scan decides whether compositing is needed.
  const target = await flattenForJpeg(canvas, format, opts.background ?? "#ffffff", opts.sourceType);
  const blob = await canvasToBlob(target, format, opts.quality);
  return { blob, mime: format, width: target.width, height: target.height };
}

/** For JPEG output, composite transparency over the background color once.
 *  Encoding a transparent canvas straight to JPEG turns transparent pixels
 *  BLACK in most browsers — this prevents that. Other formats pass through.
 *  `sourceType` is the ORIGINAL file's MIME: JPEG sources can never carry
 *  alpha, so the scan is skipped entirely for them. */
export async function flattenForJpeg(
  canvas: HTMLCanvasElement,
  format: "image/jpeg" | "image/png" | "image/webp",
  background: string = "#ffffff",
  sourceType?: string | null
): Promise<HTMLCanvasElement> {
  if (format !== "image/jpeg") return canvas;
  if (sourceType === "image/jpeg") return canvas; // JPEG sources have no alpha
  if (await canvasHasAlpha(canvas)) {
    return drawFlattened(canvas, canvas.width, canvas.height, background);
  }
  return canvas;
}

/** Convenience: alpha-safe encode to a fixed format/quality (target-KB tools).
 *  `sourceType` (the original file's MIME) lets JPEG sources skip the
 *  alpha scan. */
export async function encodeWithAlphaHandling(
  canvas: HTMLCanvasElement,
  format: Exclude<OutputFormat, "auto">,
  quality: number,
  background: string = "#ffffff",
  sourceType?: string | null
): Promise<Blob> {
  const target = await flattenForJpeg(canvas, format, background, sourceType);
  return canvasToBlob(target, format, quality);
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
