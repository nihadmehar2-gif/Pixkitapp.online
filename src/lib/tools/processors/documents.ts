/** Document & export processors: PDF, ICO, Base64, favicon, contact sheets. */

import type { LoadedImage } from "@/lib/image/loader";
import type { ProcessedResult, ProcessContext, ToolOptionValues } from "../types";
import { createCanvas, ctx2d, drawFlattened, outputName, downloadBlob } from "@/lib/image/canvas";
import { canvasToIcoBlob, buildPdf } from "@/lib/image/encoders";
import { num, str, bool, canvasFromImage, formatKB, encodeImageResult } from "./helpers";

/* ---------- Image(s) → PDF ---------- */
export async function imagesToPdf(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const pageSize = str(o, "pageSize", "a4");
  const orientation = str(o, "orientation", "auto");
  const marginPt = num(o, "margin", 20);
  const quality = num(o, "quality", 88) / 100;

  const PAGE_SIZES: Record<string, [number, number]> = {
    a4: [595, 842], letter: [612, 792], a3: [842, 1191], a5: [420, 595],
  };

  const pages: { jpegData: Uint8Array; width: number; height: number }[] = [];
  for (const img of images) {
    const src = canvasFromImage(img);
    const flat = drawFlattened(src, src.width, src.height, "#ffffff");
    const jpegBlob = await new Promise<Blob>((res, rej) =>
      flat.toBlob((b) => (b ? res(b) : rej(new Error("JPEG encode failed"))), "image/jpeg", quality)
    );
    const jpegData = new Uint8Array(await jpegBlob.arrayBuffer());

    let [pw, ph] = PAGE_SIZES[pageSize] ?? PAGE_SIZES.a4;
    if (orientation === "landscape" || (orientation === "auto" && src.width > src.height)) {
      [pw, ph] = [ph, pw];
    }
    // Fit image inside page with margins, keeping aspect
    const availW = pw - marginPt * 2;
    const availH = ph - marginPt * 2;
    const ratio = Math.min(availW / src.width, availH / src.height);
    const w = src.width * ratio;
    const h = src.height * ratio;
    pages.push({
      jpegData,
      width: w,
      height: h,
    });
  }
  ctx.onProgress?.(images.length, images.length);

  // Rebuild PDF with images centered: adjust buildPdf usage — build custom placement
  const pdfBlob = buildCenteredPdf(pages, PAGE_SIZES[pageSize] ?? PAGE_SIZES.a4, orientation);
  const name = images.length === 1 ? `${images[0].name.replace(/\.[^.]+$/, "")}.pdf` : `pixkitapp-${images.length}-images.pdf`;
  return [
    {
      id: `pdf-${Date.now()}`,
      sourceId: images[0]?.id ?? "pdf",
      sourceName: images.map((i) => i.name).join(", ").slice(0, 80),
      name,
      blob: pdfBlob,
      width: 0,
      height: 0,
      originalSize: images.reduce((s, i) => s + i.size, 0),
      previewUrl: "",
      note: `${images.length} page${images.length > 1 ? "s" : ""} · ${pageSize.toUpperCase()} · ${formatKB(pdfBlob.size)}`,
    },
  ];
}

function buildCenteredPdf(
  pages: { jpegData: Uint8Array; width: number; height: number }[],
  pageSize: [number, number],
  orientation: string
): Blob {
  // Build PDF manually with centered image placement
  const objects: string[] = [];
  const binaryChunks: (Uint8Array | null)[] = [];
  let nextId = 1;
  const catalogId = nextId++;
  const pagesId = nextId++;
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  const imageIds: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    pageIds.push(nextId++);
    contentIds.push(nextId++);
    imageIds.push(nextId++);
  }
  const infoId = nextId++;
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    let [pw, ph] = pageSize;
    if (orientation === "landscape" || (orientation === "auto" && p.width > p.height)) [pw, ph] = [ph, pw];
    const x = (pw - p.width) / 2;
    const y = (ph - p.height) / 2;

    objects[pageIds[i]] =
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im${i} ${imageIds[i]} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentIds[i]} 0 R >>`;
    const content = `q\n${p.width.toFixed(2)} 0 0 ${p.height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${i} Do\nQ\n`;
    objects[contentIds[i]] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
    binaryChunks[imageIds[i]] = p.jpegData;
    // read actual jpeg dims from canvas ratio: store separately — use aspect to derive
    const jpeg = p.jpegData;
    let jw = 1000, jh = 1000;
    // parse JPEG SOF for dims
    for (let off = 2; off < jpeg.length - 9;) {
      if (jpeg[off] !== 0xff) { off++; continue; }
      const marker = jpeg[off + 1];
      const len = (jpeg[off + 2] << 8) | jpeg[off + 3];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        jh = (jpeg[off + 5] << 8) | jpeg[off + 6];
        jw = (jpeg[off + 7] << 8) | jpeg[off + 8];
        break;
      }
      off += 2 + len;
    }
    objects[imageIds[i]] =
      `<< /Type /XObject /Subtype /Image /Width ${jw} /Height ${jh} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`;
  }
  objects[infoId] = `<< /Title (PixKitApp PDF) /Producer (PixKitApp - www.pixkitapp.online) >>`;

  let pdfLen = 0;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  const push = (s: string) => { chunks.push(encoder.encode(s)); pdfLen += encoder.encode(s).length; };

  push("%PDF-1.4\n");
  for (let id = 1; id < nextId; id++) {
    offsets[id] = pdfLen;
    push(`${id} 0 obj\n${objects[id]}\n`);
    if (binaryChunks[id]) {
      push("stream\n");
      chunks.push(binaryChunks[id]!);
      pdfLen += binaryChunks[id]!.length;
      push("\nendstream\n");
    }
    push("endobj\n");
  }
  const xrefStart = pdfLen;
  let xref = `xref\n0 ${nextId}\n0000000000 65535 f \n`;
  for (let id = 1; id < nextId; id++) xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${nextId} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  push(xref);
  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

/* ---------- Image → ICO (multi-size) ---------- */
export async function imageToIco(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const sizeStr = str(o, "sizes", "16,32,48,64,128,256");
  const sizes = sizeStr.split(",").map((s) => parseInt(s.trim())).filter((n) => n > 0 && n <= 256);
  for (const img of images) {
    const src = canvasFromImage(img);
    const blob = await canvasToIcoBlob(sizes, async (size) => {
      const ratio = Math.min(size / src.width, size / src.height);
      const w = Math.round(src.width * ratio), h = Math.round(src.height * ratio);
      const c = createCanvas(size, size);
      const cx = ctx2d(c);
      cx.imageSmoothingQuality = "high";
      cx.drawImage(src, (size - w) / 2, (size - h) / 2, w, h);
      return c;
    });
    out.push({
      id: `${img.id}-ico${Math.random().toString(36).slice(2, 6)}`,
      sourceId: img.id,
      sourceName: img.name,
      name: `${img.name.replace(/\.[^.]+$/, "")}.ico`,
      blob,
      width: 0,
      height: 0,
      originalSize: img.size,
      previewUrl: "",
      note: `ICO with ${sizes.length} sizes: ${sizes.join(", ")}px`,
    });
  }
  ctx.onProgress?.(images.length, images.length);
  return out;
}

/* ---------- Favicon pack (PNG previews + ICO) ---------- */
export async function faviconPack(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const padPct = num(o, "padding", 8);
  const bgMode = str(o, "background", "transparent");
  const bgColor = str(o, "bgColor", "#4f46e5");
  const round = bool(o, "rounded", true);
  const img = images[0];
  if (!img) return out;
  const src = canvasFromImage(img);

  const sizes = [16, 32, 48, 96, 180];
  for (const size of sizes) {
    const c = createCanvas(size, size);
    const cx = ctx2d(c);
    if (bgMode === "color" || bgMode === "rounded") {
      if (round && bgMode === "rounded") {
        cx.beginPath();
        cx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        cx.clip();
      }
      cx.fillStyle = bgColor;
      cx.fillRect(0, 0, size, size);
    }
    const pad = (size * padPct) / 100;
    const avail = size - pad * 2;
    const ratio = Math.min(avail / src.width, avail / src.height);
    const w = src.width * ratio, h = src.height * ratio;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(src, (size - w) / 2, (size - h) / 2, w, h);
    const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
    out.push({
      id: `${img.id}-fav${size}`,
      sourceId: img.id,
      sourceName: img.name,
      name: `favicon-${size}x${size}.png`,
      blob,
      width: size,
      height: size,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(blob),
      note: `${size}×${size}px favicon`,
    });
  }
  // ICO file
  const icoBlob = await canvasToIcoBlob([16, 32, 48], async (size) => {
    const c = createCanvas(size, size);
    const cx = ctx2d(c);
    const ratio = Math.min(size / src.width, size / src.height);
    const w = src.width * ratio, h = src.height * ratio;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(src, (size - w) / 2, (size - h) / 2, w, h);
    return c;
  });
  out.push({
    id: `${img.id}-favico`,
    sourceId: img.id,
    sourceName: img.name,
    name: "favicon.ico",
    blob: icoBlob,
    width: 0,
    height: 0,
    originalSize: img.size,
    previewUrl: "",
    note: "Classic favicon.ico (16+32+48px)",
  });
  ctx.onProgress?.(1, 1);
  return out;
}

/* ---------- Base64 encode ---------- */
export async function base64Encode(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const dataUri = bool(o, "dataUri", true);
  for (const img of images) {
    const buffer = await img.file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const b64 = btoa(binary);
    const result = dataUri ? `data:${img.type};base64,${b64}` : b64;
    const blob = new Blob([result], { type: "text/plain" });
    out.push({
      id: `${img.id}-b64`,
      sourceId: img.id,
      sourceName: img.name,
      name: `${img.name.replace(/\.[^.]+$/, "")}-base64.txt`,
      blob,
      width: img.width,
      height: img.height,
      originalSize: img.size,
      previewUrl: "",
      note: `${formatKB(blob.size)} of Base64 text (${dataUri ? "data URI" : "raw"} mode)`,
    });
  }
  ctx.onProgress?.(images.length, images.length);
  return out;
}

/* ---------- Base64 decode ---------- */
export async function base64Decode(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const text = str(o, "input", "").trim();
  const out: ProcessedResult[] = [];
  if (!text && images.length === 0) {
    throw new Error("Paste a Base64 string or drop a .txt file first.");
  }
  const raw = text || (await images[0].file.text()).trim();
  const cleaned = raw.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // sniff type
  let mime = "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) mime = "image/jpeg";
  else if (bytes[0] === 0x89 && bytes[1] === 0x50) mime = "image/png";
  else if (bytes[0] === 0x52 && bytes[1] === 0x49) mime = "image/webp";
  else if (bytes[0] === 0x47 && bytes[1] === 0x49) mime = "image/gif";

  const blob = new Blob([bytes], { type: mime });
  const bitmap = await createImageBitmap(blob);
  out.push({
    id: `b64dec-${Date.now()}`,
    sourceId: "base64",
    sourceName: "base64-input",
    name: `decoded-image.${mime.split("/")[1]}`,
    blob,
    width: bitmap.width,
    height: bitmap.height,
    originalSize: cleaned.length,
    previewUrl: URL.createObjectURL(blob),
    note: `${bitmap.width}×${bitmap.height} · ${formatKB(blob.size)} decoded`,
  });
  ctx.onProgress?.(1, 1);
  return out;
}

/* ---------- Metadata viewer (report output) ---------- */
export async function metadataReport(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const { readImageMetadata } = await import("@/lib/image/metadata");
  const out: ProcessedResult[] = [];
  for (const img of images) {
    const meta = await readImageMetadata(img.file);
    const lines: string[] = [
      `PixKitApp Metadata Report`,
      `File: ${img.name}`,
      `Format: ${meta.format}`,
      `Dimensions: ${img.width}×${img.height}`,
      `File size: ${formatKB(img.size)}`,
      ``,
    ];
    if (meta.pngChunks) {
      lines.push(`PNG chunks:`);
      for (const ch of meta.pngChunks) {
        lines.push(`  ${ch.type}${ch.size ? ` (${ch.size} bytes)` : ""}${ch.text ? ` → ${ch.text}` : ""}`);
      }
      lines.push("");
    }
    if (meta.exif.length === 0) {
      lines.push(`No EXIF metadata found. ✓`);
    } else {
      lines.push(`EXIF fields: ${meta.exif.length}`);
      for (const e of meta.exif) lines.push(`  ${e.name}: ${e.value}`);
    }
    lines.push("");
    lines.push(meta.hasGps ? `⚠ GPS LOCATION DATA FOUND${meta.gps ? `: ${meta.gps.lat.toFixed(5)}, ${meta.gps.lng.toFixed(5)}` : ""}` : `No GPS location data.`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    out.push({
      id: `${img.id}-meta`,
      sourceId: img.id,
      sourceName: img.name,
      name: `${img.name.replace(/\.[^.]+$/, "")}-metadata.txt`,
      blob,
      width: img.width,
      height: img.height,
      originalSize: img.size,
      previewUrl: "",
      note: `${meta.format} · ${meta.exif.length} EXIF fields${meta.hasGps ? " · GPS FOUND" : " · no GPS"}`,
      note2: lines.join("\n") as never,
    } as ProcessedResult & { note2: string });
  }
  ctx.onProgress?.(images.length, images.length);
  return out;
}

/* ---------- Metadata stripper (re-encode clean) ---------- */
export async function stripMetadata(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const { readImageMetadata } = await import("@/lib/image/metadata");
  const out: ProcessedResult[] = [];
  const keepFormat = bool(o, "keepFormat", true);
  const quality = num(o, "quality", 92) / 100;
  for (const img of images) {
    const before = await readImageMetadata(img.file);
    const src = canvasFromImage(img);
    const format = keepFormat && img.type !== "image/webp" && src && img.type
      ? (["image/jpeg", "image/png"].includes(img.type) ? img.type as "image/jpeg" | "image/png" : "image/png" as const)
      : "image/png" as const;
    const blob = await new Promise<Blob>((res, rej) => {
      src.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), format, format === "image/jpeg" ? quality : undefined);
    });
    out.push({
      id: `${img.id}-clean${Math.random().toString(36).slice(2, 5)}`,
      sourceId: img.id,
      sourceName: img.name,
      name: outputName(img.name, format === "image/jpeg" ? "jpg" : "png", "clean"),
      blob,
      width: src.width,
      height: src.height,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(blob),
      note: `Stripped ${before.exif.length} EXIF fields${before.hasGps ? " incl. GPS location" : ""} · ${formatKB(blob.size)}`,
    });
  }
  ctx.onProgress?.(images.length, images.length);
  return out;
}

/* ---------- Passport print sheet ---------- */
export async function printSheet(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const sheetW = 1200; // 4x6 inch at 300dpi = 1200x1800
  const sheetH = 1800;
  const photoW = Math.round(num(o, "photoWidthPx", 413));
  const photoH = Math.round(num(o, "photoHeightPx", 531));
  const border = bool(o, "cutLines", true);

  for (const img of images) {
    const src = canvasFromImage(img);
    const sheet = createCanvas(sheetW, sheetH);
    const c = ctx2d(sheet);
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, sheetW, sheetH);

    const cols = Math.max(1, Math.floor(sheetW / photoW));
    const rows = Math.max(1, Math.floor(sheetH / photoH));
    const totalW = cols * photoW;
    const totalH = rows * photoH;
    const offX = (sheetW - totalW) / 2;
    const offY = (sheetH - totalH) / 2;

    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        c.drawImage(src, offX + col * photoW, offY + r * photoH, photoW, photoH);
        if (border) {
          c.strokeStyle = "#cccccc";
          c.lineWidth = 1;
          c.strokeRect(offX + col * photoW + 0.5, offY + r * photoH + 0.5, photoW - 1, photoH - 1);
        }
      }
    }
    const blob = await new Promise<Blob>((res) => sheet.toBlob((b) => res(b!), "image/jpeg", 0.92));
    out.push({
      id: `${img.id}-sheet`,
      sourceId: img.id,
      sourceName: img.name,
      name: outputName(img.name, "jpg", "print-sheet"),
      blob,
      width: sheetW,
      height: sheetH,
      originalSize: img.size,
      previewUrl: URL.createObjectURL(blob),
      note: `${cols}×${rows} = ${cols * rows} photos (${photoW}×${photoH}px each) on 4×6" @300DPI`,
    });
  }
  ctx.onProgress?.(images.length, images.length);
  return out;
}

/* ---------- SVG → PNG ---------- */
export async function svgToPng(images: LoadedImage[], o: ToolOptionValues, ctx: ProcessContext): Promise<ProcessedResult[]> {
  const out: ProcessedResult[] = [];
  const scale = num(o, "scale", 2);
  for (const img of images) {
    const svgUrl = img.objectUrl;
    const svgImg = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Invalid SVG file"));
      i.src = svgUrl;
    });
    const w = Math.min(12000, Math.max(1, Math.round((svgImg.naturalWidth || svgImg.width || 512) * scale)));
    const h = Math.min(12000, Math.max(1, Math.round((svgImg.naturalHeight || svgImg.height || 512) * scale)));
    const canvas = createCanvas(w, h);
    const c = ctx2d(canvas);
    c.imageSmoothingQuality = "high";
    c.drawImage(svgImg, 0, 0, w, h);
    const result = await encodeImageResult(img, canvas, { format: str(o, "format", "image/png") as never, quality: 0.95 }, "raster");
    result.note = `Rasterized at ${scale}x → ${w}×${h}`;
    out.push(result);
  }
  ctx.onProgress?.(images.length, images.length);
  return out;
}

export const documentProcessors = {
  imagesToPdf, imageToIco, faviconPack, base64Encode, base64Decode,
  metadataReport, stripMetadata, printSheet, svgToPng,
};

export { downloadBlob };
