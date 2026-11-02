"use client";

/** Interactive crop editor with draggable frame, aspect locks and guides. */

import { useCallback, useEffect, useRef, useState } from "react";
import { createCanvas, ctx2d, encodeCanvas, outputName } from "@/lib/image/canvas";

import { formatBytes } from "@/lib/image/loader";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, RotateCw, FlipHorizontal2, FlipVertical2 } from "lucide-react";
import type { ProcessedResult } from "@/lib/tools/types";
import { ResultsPanel } from "./results";
import { Dropzone } from "./dropzone";
import type { ToolDef } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  tool: ToolDef;
  mode: "crop" | "passport";
}

const RATIOS = [
  { value: "free", label: "Free" },
  { value: "1:1", label: "1:1 Square" },
  { value: "4:3", label: "4:3 Classic" },
  { value: "3:2", label: "3:2 Photo" },
  { value: "16:9", label: "16:9 Wide" },
  { value: "9:16", label: "9:16 Vertical" },
  { value: "custom", label: "Custom" },
];

export function CropWorkspace({ tool, mode }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 100, h: 100 });
  const [ratio, setRatio] = useState(mode === "passport" ? "custom" : "free");
  const [customRatioW, setCustomRatioW] = useState("35");
  const [customRatioH, setCustomRatioH] = useState("45");
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState(92);
  const [format, setFormat] = useState("image/jpeg");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [passportPreset, setPassportPreset] = useState("35x45mm");
  const [passportBg, setPassportBg] = useState("white");
  const [zoom, setZoom] = useState(1);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ handle: string; startX: number; startY: number; startCrop: CropRect } | null>(null);
  const srcUrlRef = useRef<string | null>(null);
  const resultsRef = useRef<ProcessedResult[]>([]);
  resultsRef.current = results;

  // Memory hygiene: revoke the source blob URL and any result preview URLs
  // when the editor unmounts.
  useEffect(() => {
    return () => {
      if (srcUrlRef.current) URL.revokeObjectURL(srcUrlRef.current);
    };
  }, []);

  // Passport preset → pixel dims (300 DPI)
  const passportDims = (preset: string): { w: number; h: number; mmW: number; mmH: number } => {
    switch (preset) {
      case "2x2in": return { w: 600, h: 600, mmW: 50.8, mmH: 50.8 };
      case "33x48mm": return { w: 390, h: 567, mmW: 33, mmH: 48 };
      case "35x35mm": return { w: 413, h: 413, mmW: 35, mmH: 35 };
      case "3.5x4.5cm": return { w: 413, h: 531, mmW: 35, mmH: 45 };
      default: return { w: 413, h: 531, mmW: 35, mmH: 45 };
    }
  };

  // Load image
  const loadFile = useCallback(async (f: File) => {
    setResults((prev) => {
      for (const r of prev) if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      return [];
    });
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      // The image is decoded in memory now — release the temporary URL.
      if (srcUrlRef.current && srcUrlRef.current !== url) URL.revokeObjectURL(srcUrlRef.current);
      srcUrlRef.current = url;
      setImgEl(img);
      setFile(f);
      // init crop: full image (or passport ratio)
      const pw = img.naturalWidth;
      const ph = img.naturalHeight;
      if (mode === "passport") {
        const d = passportDims(passportPreset);
        const target = d.w / d.h;
        let w = pw * 0.6;
        let h = w / target;
        if (h > ph * 0.7) { h = ph * 0.7; w = h * target; }
        setCrop({ x: (pw - w) / 2, y: (ph - h) / 3, w, h });
      } else {
        setCrop({ x: 0, y: 0, w: pw, h: ph });
      }
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
     
  }, [mode, passportPreset]);

  // Effective ratio for lock
  const ratioValue = (): number | null => {
    if (mode === "passport") {
      const d = passportDims(passportPreset);
      return d.w / d.h;
    }
    if (ratio === "free") return null;
    if (ratio === "custom") {
      const w = parseFloat(customRatioW) || 1;
      const h = parseFloat(customRatioH) || 1;
      return w / h;
    }
    const [a, b] = ratio.split(":").map(Number);
    return a / b;
  };

  // Draw display canvas
  useEffect(() => {
    if (!imgEl || !displayRef.current) return;
    const disp = displayRef.current;
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const maxW = Math.min(wrap.clientWidth, 640);
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    const rw = imgEl.naturalWidth * cos + imgEl.naturalHeight * sin;
    const rh = imgEl.naturalWidth * sin + imgEl.naturalHeight * cos;
    const scale = Math.min(maxW / rw, 480 / rh, 1) * zoom;
    disp.width = Math.round(rw * scale);
    disp.height = Math.round(rh * scale);
    const c = ctx2d(disp);
    c.clearRect(0, 0, disp.width, disp.height);
    c.save();
    c.translate(disp.width / 2, disp.height / 2);
    c.rotate(rad);
    c.scale(scale * (flipH ? -1 : 1), scale * (flipV ? -1 : 1));
    c.drawImage(imgEl, -imgEl.naturalWidth / 2, -imgEl.naturalHeight / 2);
    c.restore();

    // Draw crop overlay
    const cs = scale * zoom; // source→display scale (approx for rotation)
    const cx = crop.x * cs * cos + crop.y * cs * sin; // simplified overlay mapping
    // Overlay in display space: draw dark mask + handles using source coords mapped through transform
    c.save();
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.beginPath();
    c.rect(0, 0, disp.width, disp.height);
    const d = passportDims(passportPreset);
    const targetRatio = ratioValue();
    // Map crop (source px) to display px: same scale, centered transform
    const dispCropW = crop.w * cs;
    const dispCropH = crop.h * cs;
    const dispX = disp.width / 2 - (imgEl.naturalWidth / 2 - crop.x) * cs * (flipH ? -1 : 1);
    const dispY = disp.height / 2 - (imgEl.naturalHeight / 2 - crop.y) * cs;
    // For rotated views overlay approximates; crop export uses source coords
    c.rect(Math.max(0, Math.min(dispX, disp.width)), Math.max(0, Math.min(dispY, disp.height)), dispCropW, dispCropH);
    c.fill("evenodd");
    // border
    c.strokeStyle = "#fff";
    c.lineWidth = 2;
    c.strokeRect(dispX, dispY, dispCropW, dispCropH);
    // corner handles
    const hs = 7;
    c.fillStyle = "#a855f7";
    for (const [hx, hy] of [[dispX, dispY], [dispX + dispCropW, dispY], [dispX, dispY + dispCropH], [dispX + dispCropW, dispY + dispCropH]]) {
      c.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    // guides
    if (mode === "passport") {
      // head oval + eye line
      c.strokeStyle = "rgba(255,80,80,0.9)";
      c.lineWidth = 1.5;
      const ovW = dispCropW * 0.5, ovH = dispCropH * 0.72;
      c.beginPath();
      c.ellipse(dispX + dispCropW / 2, dispY + dispCropH * 0.52, ovW / 2, ovH / 2, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.setLineDash([4, 3]);
      c.moveTo(dispX + dispCropW * 0.08, dispY + dispCropH * 0.38);
      c.lineTo(dispX + dispCropW * 0.92, dispY + dispCropH * 0.38);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "rgba(255,255,255,0.95)";
      c.font = "10px system-ui";
      c.fillText(`${d.mmW}×${d.mmH} mm`, dispX + 4, dispY + dispCropH - 6);
    } else if (ratio === "1:1" || ratioValue() === 1) {
      // rule of thirds
      c.strokeStyle = "rgba(255,255,255,0.35)";
      c.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        c.beginPath(); c.moveTo(dispX + (dispCropW * i) / 3, dispY); c.lineTo(dispX + (dispCropW * i) / 3, dispY + dispCropH); c.stroke();
        c.beginPath(); c.moveTo(dispX, dispY + (dispCropH * i) / 3); c.lineTo(dispX + dispCropW, dispY + (dispCropH * i) / 3); c.stroke();
      }
    }
    c.restore();
  }, [imgEl, crop, rotation, flipH, flipV, zoom, ratio, mode, passportPreset, customRatioW, customRatioH]);

  // Drag interactions (map display delta → source delta)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!imgEl || !displayRef.current) return;
    const rect = displayRef.current.getBoundingClientRect();
    const disp = displayRef.current;
    const scaleX = disp.width / rect.width;
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    const rw = imgEl.naturalWidth * cos + imgEl.naturalHeight * sin;
    const rh = imgEl.naturalWidth * sin + imgEl.naturalHeight * cos;
    const cs = Math.min(Math.min(wrapMaxW() / rw, 480 / rh, 1)) * zoom;

    const dx = (e.clientX - rect.left) * scaleX;
    const dy = (e.clientY - rect.top) * scaleX;
    // inverse map to source space (approximation for 0/90/180/270 and small angles)
    const srcW = imgEl.naturalWidth, srcH = imgEl.naturalHeight;
    // invert the center transform
    let sx = (dx - disp.width / 2) / cs;
    let sy = (dy - disp.height / 2) / cs;
    if (flipH) sx = -sx;
    if (flipV) sy = -sy;
    const s = { x: 0, y: 0 };
    if (rotation === 90) { s.x = sy + srcW / 2 - (srcW - srcH) / 2 * 0; s.y = -sx + srcH / 2; }
    else if (rotation === 180) { s.x = -sx + srcW / 2; s.y = -sy + srcH / 2; }
    else if (rotation === 270) { s.x = -sy + srcW / 2; s.y = sx + srcH / 2; }
    else { s.x = sx + srcW / 2; s.y = sy + srcH / 2; }

    // Determine handle: corners or inside
    const tol = 14 / cs;
    const c0 = crop;
    let handle = "move";
    if (Math.abs(s.x - c0.x) < tol && Math.abs(s.y - c0.y) < tol) handle = "nw";
    else if (Math.abs(s.x - (c0.x + c0.w)) < tol && Math.abs(s.y - c0.y) < tol) handle = "ne";
    else if (Math.abs(s.x - c0.x) < tol && Math.abs(s.y - (c0.y + c0.h)) < tol) handle = "sw";
    else if (Math.abs(s.x - (c0.x + c0.w)) < tol && Math.abs(s.y - (c0.y + c0.h)) < tol) handle = "se";
    else if (s.x > c0.x && s.x < c0.x + c0.w && s.y > c0.y && s.y < c0.y + c0.h) handle = "move";

    dragRef.current = { handle, startX: s.x, startY: s.y, startCrop: { ...crop } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const wrapMaxW = () => Math.min(canvasWrapRef.current?.clientWidth ?? 640, 640);

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !imgEl || !displayRef.current) return;
    const disp = displayRef.current;
    const rect = disp.getBoundingClientRect();
    const scaleX = disp.width / rect.width;
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    const rw = imgEl.naturalWidth * cos + imgEl.naturalHeight * sin;
    const rh = imgEl.naturalWidth * sin + imgEl.naturalHeight * cos;
    const cs = Math.min(wrapMaxW() / rw, 480 / rh, 1) * zoom;

    const dx = (e.clientX - rect.left) * scaleX;
    const dy = (e.clientY - rect.top) * scaleX;
    const srcW = imgEl.naturalWidth, srcH = imgEl.naturalHeight;
    let sx = (dx - disp.width / 2) / cs;
    let sy = (dy - disp.height / 2) / cs;
    if (flipH) sx = -sx;
    if (flipV) sy = -sy;
    let s: { x: number; y: number };
    if (rotation === 90) { s = { x: sy + srcW / 2, y: -sx + srcH / 2 }; }
    else if (rotation === 180) { s = { x: -sx + srcW / 2, y: -sy + srcH / 2 }; }
    else if (rotation === 270) { s = { x: -sy + srcW / 2, y: sx + srcH / 2 }; }
    else { s = { x: sx + srcW / 2, y: sy + srcH / 2 }; }

    const { handle, startX, startY, startCrop } = drag;
    const ddx = s.x - startX;
    const ddy = s.y - startY;
    const r = ratioValue();
    let next = { ...startCrop };

    if (handle === "move") {
      next.x = Math.max(0, Math.min(startCrop.x + ddx, srcW - startCrop.w));
      next.y = Math.max(0, Math.min(startCrop.y + ddy, srcH - startCrop.h));
    } else {
      let left = startCrop.x, top = startCrop.y, right = startCrop.x + startCrop.w, bottom = startCrop.y + startCrop.h;
      if (handle.includes("n")) top = startCrop.y + ddy;
      if (handle.includes("s")) bottom = startCrop.y + startCrop.h + ddy;
      if (handle.includes("w")) left = startCrop.x + ddx;
      if (handle.includes("e")) right = startCrop.x + startCrop.w + ddx;
      left = Math.max(0, Math.min(left, srcW));
      right = Math.max(0, Math.min(right, srcW));
      top = Math.max(0, Math.min(top, srcH));
      bottom = Math.max(0, Math.min(bottom, srcH));
      let w = right - left, h = bottom - top;
      if (r && w > 0 && h > 0) {
        // lock ratio based on dominant drag
        if (w / h > r) w = h * r; else h = w / r;
        if (handle.includes("w")) left = right - w;
        else right = left + w;
        if (handle.includes("n")) top = bottom - h;
        else bottom = top + h;
      }
      if (w > 4 && h > 4) next = { x: left, y: top, w, h };
    }
    setCrop(next);
  };

  const onPointerUp = () => { dragRef.current = null; };

  const rotateBy = (deg: number) => {
    setRotation((prev) => ((prev + deg) % 360 + 360) % 360);
  };

  const applyPresetRatio = (val: string) => {
    setRatio(val);
    if (!imgEl) return;
    if (val === "free") return;
    const r = val === "custom" ? (parseFloat(customRatioW) || 1) / (parseFloat(customRatioH) || 1) : (() => { const [a, b] = val.split(":").map(Number); return a / b; })();
    const srcW = imgEl.naturalWidth, srcH = imgEl.naturalHeight;
    let w = srcW * 0.8, h = w / r;
    if (h > srcH * 0.8) { h = srcH * 0.8; w = h * r; }
    setCrop({ x: (srcW - w) / 2, y: (srcH - h) / 2, w, h });
  };

  const exportCrop = async () => {
    if (!imgEl || !file) return;
    setBusy(true);
    try {
      // Render the crop at full source resolution (respect rotation/flip)
      const src = createCanvas(imgEl.naturalWidth, imgEl.naturalHeight);
      const sc = ctx2d(src);
      sc.drawImage(imgEl, 0, 0);

      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
      const rw = Math.round(src.width * cos + src.height * sin);
      const rh = Math.round(src.width * sin + src.height * cos);
      const rotated = createCanvas(rw, rh);
      const rc = ctx2d(rotated);
      rc.translate(rw / 2, rh / 2);
      rc.rotate(rad);
      rc.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      rc.drawImage(src, -src.width / 2, -src.height / 2);

      // Map crop rect source coords → rotated coords
      let cx: number, cy: number, cw: number, ch: number;
      if (rotation === 90) { cx = crop.y; cy = src.width - (crop.x + crop.w); cw = crop.h; ch = crop.w; }
      else if (rotation === 180) { cx = src.width - (crop.x + crop.w); cy = src.height - (crop.y + crop.h); cw = crop.w; ch = crop.h; }
      else if (rotation === 270) { cx = src.height - (crop.y + crop.h); cy = crop.x; cw = crop.h; ch = crop.w; }
      else { cx = crop.x; cy = crop.y; cw = crop.w; ch = crop.h; }

      let outW = Math.max(1, Math.round(cw));
      let outH = Math.max(1, Math.round(ch));
      if (mode === "passport") {
        const d = passportDims(passportPreset);
        outW = d.w; outH = d.h;
      }

      const out = createCanvas(outW, outH);
      const oc = ctx2d(out);
      if (mode === "passport" && passportBg !== "keep") {
        oc.fillStyle = passportBg === "white" ? "#ffffff" : "#f0f0f0";
        oc.fillRect(0, 0, outW, outH);
      }
      oc.imageSmoothingQuality = "high";
      oc.drawImage(rotated, cx, cy, cw, ch, 0, 0, outW, outH);

      let blob: Blob;
      const mime = format as "image/jpeg" | "image/png" | "image/webp";
      if (mime === "image/jpeg") {
        // Fill white BEFORE drawing so transparent source pixels composite
        // onto white instead of turning black during JPEG encoding.
        const flat = createCanvas(outW, outH);
        const fctx = ctx2d(flat, false);
        fctx.fillStyle = "#ffffff";
        fctx.fillRect(0, 0, outW, outH);
        fctx.drawImage(out, 0, 0);
        blob = await new Promise<Blob>((res, rej) => flat.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), mime, quality / 100));
      } else {
        blob = await new Promise<Blob>((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), mime, quality / 100));
      }
      const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
      const prev = resultsRef.current;
      for (const r of prev) if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      const result: ProcessedResult = {
        id: `crop-${Date.now()}`,
        sourceId: "crop",
        sourceName: file.name,
        name: outputName(file.name, ext, mode === "passport" ? passportPreset : "cropped"),
        blob,
        width: outW,
        height: outH,
        originalSize: file.size,
        previewUrl: URL.createObjectURL(blob),
        note: `${outW}×${outH}px${mode === "passport" ? ` · ${passportDims(passportPreset).mmW}×${passportDims(passportPreset).mmH}mm @300DPI` : ""} · ${formatBytes(blob.size)}`,
      };
      setResults([result]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!imgEl && (
        <Dropzone accept={tool.accept} multiple={false} maxFiles={1} maxSize={30 * 1024 * 1024} onFiles={(files) => files[0] && loadFile(files[0])} />
      )}

      {imgEl && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Editor */}
          <div className="space-y-3">
            <div ref={canvasWrapRef} className="checkerboard flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl border p-2">
              <canvas
                ref={displayRef}
                className="max-w-full cursor-move touch-none select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label="Crop editor canvas"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Drag inside the frame to move · drag corners to resize
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => rotateBy(-90)}><RotateCw className="mr-1 h-4 w-4 -scale-x-100" /> -90°</Button>
              <Button variant="outline" size="sm" onClick={() => rotateBy(90)}><RotateCw className="mr-1 h-4 w-4" /> 90°</Button>
              <Button variant={flipH ? "default" : "outline"} size="sm" onClick={() => setFlipH(!flipH)}><FlipHorizontal2 className="mr-1 h-4 w-4" /> Flip H</Button>
              <Button variant={flipV ? "default" : "outline"} size="sm" onClick={() => setFlipV(!flipV)}><FlipVertical2 className="mr-1 h-4 w-4" /> Flip V</Button>
            </div>
            <div className="flex items-center gap-3 px-2">
              <Label className="text-xs text-muted-foreground">Zoom</Label>
              <Slider value={[zoom * 100]} min={100} max={300} step={10} onValueChange={([v]) => setZoom(v / 100)} className="flex-1" />
              <span className="w-10 text-right font-mono text-xs">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 rounded-xl border bg-card p-4">
            {mode === "crop" && (
              <div className="space-y-1.5">
                <Label>Aspect ratio</Label>
                <Select value={ratio} onValueChange={applyPresetRatio}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RATIOS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {ratio === "custom" && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input value={customRatioW} onChange={(e) => setCustomRatioW(e.target.value)} className="h-9" inputMode="numeric" aria-label="Ratio width" />
                    <span className="text-muted-foreground">:</span>
                    <Input value={customRatioH} onChange={(e) => setCustomRatioH(e.target.value)} className="h-9" inputMode="numeric" aria-label="Ratio height" />
                  </div>
                )}
              </div>
            )}
            {mode === "passport" && (
              <div className="space-y-1.5">
                <Label>Official size preset</Label>
                <Select value={passportPreset} onValueChange={(v) => {
                  setPassportPreset(v);
                  const d = passportDims(v);
                  if (imgEl) {
                    const target = d.w / d.h;
                    let w = imgEl.naturalWidth * 0.6, h = w / target;
                    if (h > imgEl.naturalHeight * 0.7) { h = imgEl.naturalHeight * 0.7; w = h * target; }
                    setCrop({ x: (imgEl.naturalWidth - w) / 2, y: (imgEl.naturalHeight - h) / 3, w, h });
                  }
                }}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="35x45mm">35×45mm — UK/EU/India</SelectItem>
                    <SelectItem value="2x2in">2×2 inch — US Passport</SelectItem>
                    <SelectItem value="33x48mm">33×48mm — China Visa</SelectItem>
                    <SelectItem value="35x35mm">35×35mm — Square ID</SelectItem>
                    <SelectItem value="3.5x4.5cm">3.5×4.5cm — Schengen</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Align the face inside the red oval — eyes on the dashed line.</p>
              </div>
            )}
            {mode === "passport" && (
              <div className="space-y-1.5">
                <Label>Background</Label>
                <Select value={passportBg} onValueChange={setPassportBg}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">White (official)</SelectItem>
                    <SelectItem value="lightgray">Light gray</SelectItem>
                    <SelectItem value="keep">Keep original</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Output format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/jpeg">JPEG (.jpg)</SelectItem>
                  <SelectItem value="image/png">PNG (.png)</SelectItem>
                  <SelectItem value="image/webp">WebP (.webp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {format !== "image/png" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Quality</Label>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{quality}%</span>
                </div>
                <Slider value={[quality]} min={50} max={100} step={1} onValueChange={([v]) => setQuality(v)} />
              </div>
            )}
            <div className="rounded-lg bg-muted/60 p-3 text-sm">
              <p className="font-medium">Crop: {Math.round(crop.w)}×{Math.round(crop.h)}px</p>
              <p className="text-xs text-muted-foreground">at ({Math.round(crop.x)}, {Math.round(crop.y)}) from top-left</p>
              {mode === "passport" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Output: {passportDims(passportPreset).w}×{passportDims(passportPreset).h}px @300 DPI
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={exportCrop} disabled={busy} className="h-12 flex-1 text-base font-semibold">
                <Download className="mr-2 h-5 w-5" /> {busy ? "Exporting…" : mode === "passport" ? "Create Photo" : "Crop & Download"}
              </Button>
              <Button variant="outline" className="h-12" onClick={() => { setImgEl(null); setFile(null); setResults([]); }}>
                Change
              </Button>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && <ResultsPanel results={results} onReset={() => { setResults([]); }} />}
    </div>
  );
}

export const cnUtil = cn;
