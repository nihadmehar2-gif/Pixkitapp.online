/** Processor registry — maps processor keys to implementations. */

import type { LoadedImage } from "@/lib/image/loader";
import type { ProcessedResult, ProcessContext, ToolOptionValues, Processor } from "../types";
import { createCanvas, ctx2d, encodeCanvas, outputName, drawScaled } from "@/lib/image/canvas";
import { canvasFromImage, encodeOpts, num, str } from "./helpers";
import { basicProcessors } from "./basic";
import { geometryProcessors } from "./geometry";
import { effectsProcessors } from "./effects";
import { colorProcessors } from "./color";
import { annotateProcessors } from "./annotate";
import { documentProcessors } from "./documents";

/** Social preset resizer — cover or fit within preset dims. */
async function socialResize(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const targetW = num(o, "__w", 1080);
  const targetH = num(o, "__h", 1080);
  const fit = str(o, "fit", "cover"); // cover | contain | stretch
  const bg = str(o, "bgColor", "#ffffff");
  const enc = encodeOpts(o);

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = canvasFromImage(img);
    const canvas = createCanvas(targetW, targetH);
    const c = ctx2d(canvas);
    // Multi-step resampling (drawScaled) keeps big downscales free of aliasing
    // — a single full-size→target draw produces soft/ragged output.
    if (fit === "cover") {
      const r = Math.max(targetW / src.width, targetH / src.height);
      const w = Math.max(targetW, Math.round(src.width * r));
      const h = Math.max(targetH, Math.round(src.height * r));
      const scaled = drawScaled(src, src.width, src.height, w, h);
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "high";
      c.drawImage(scaled, Math.floor((targetW - w) / 2), Math.floor((targetH - h) / 2), w, h);
    } else if (fit === "contain") {
      c.fillStyle = bg;
      c.fillRect(0, 0, targetW, targetH);
      const r = Math.min(targetW / src.width, targetH / src.height);
      const w = Math.max(1, Math.round(src.width * r));
      const h = Math.max(1, Math.round(src.height * r));
      const scaled = drawScaled(src, src.width, src.height, w, h);
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "high";
      c.drawImage(scaled, Math.floor((targetW - w) / 2), Math.floor((targetH - h) / 2), w, h);
    } else {
      const scaled = drawScaled(src, src.width, src.height, targetW, targetH);
      c.drawImage(scaled, 0, 0);
    }
    const label = `${targetW}x${targetH}`;
    const result = await (async () => {
      // Pass the real source MIME so 'auto' preserves the original format.
      const encoded = await encodeCanvas(canvas, { ...enc, sourceType: img.type });
      const ext = encoded.mime.split("/")[1] === "jpeg" ? "jpg" : encoded.mime.split("/")[1];
      return {
        id: `${img.id}-social${i}`,
        sourceId: img.id,
        sourceName: img.name,
        name: outputName(img.name, ext, label),
        blob: encoded.blob,
        width: targetW,
        height: targetH,
        originalSize: img.size,
        previewUrl: URL.createObjectURL(encoded.blob),
        note: `${targetW}×${targetH} (${fit})`,
      } satisfies ProcessedResult;
    })();
    out.push(result);
    ctx.onProgress?.(i + 1, images.length);
  }
  return out;
}

const registry: Record<string, Processor> = {
  ...basicProcessors,
  ...geometryProcessors,
  ...effectsProcessors,
  ...colorProcessors,
  ...annotateProcessors,
  ...documentProcessors,
  socialResize,
};

export function getProcessor(name: string): Processor {
  const fn = registry[name];
  if (!fn) throw new Error(`Unknown processor: ${name}`);
  return fn;
}

export { canvasFromImage };
