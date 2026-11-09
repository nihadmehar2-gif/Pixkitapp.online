"use client";

/** The reusable tool workspace: upload → options → process → results.
 *  Handles validation, batch limits, progress, ZIP export and errors.
 *  Memory-conscious: every temporary object URL is revoked when no longer
 *  needed (on remove, on re-run, on reset and on unmount). */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToolDef, ProcessedResult, ToolOptionValues } from "@/lib/tools/types";
import { MAX_BATCH, MAX_FILE_SIZE, loadFiles, formatBytes, type LoadedImage } from "@/lib/image/loader";
import { downloadBlob } from "@/lib/image/canvas";
import { Dropzone } from "./dropzone";
import { OptionControls } from "./option-controls";
import { ResultsPanel, ProgressBanner } from "./results";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { X, AlertTriangle, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function initialValues(tool: ToolDef): ToolOptionValues {
  const v: ToolOptionValues = {};
  for (const opt of tool.options) v[opt.key] = opt.default;
  if (tool.params) {
    for (const [k, val] of Object.entries(tool.params)) {
      if (!k.startsWith("__") || k === "__targetKB") v[k] = val;
    }
  }
  return v;
}

/** Map low-level failures to actionable messages. */
function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/memory|allocation|array buffer/i.test(raw)) {
    return "Ran out of memory while processing. Try fewer images at once, or a smaller source image, then run the tool again.";
  }
  if (/could not encode|encode/i.test(raw)) {
    return "This browser could not encode the output format. Try choosing a different output format (e.g. JPG or PNG).";
  }
  if (/canvas|2d context/i.test(raw)) {
    return "Your browser blocked or ran out of canvas space. A smaller image or a different browser (latest Chrome, Edge or Firefox) usually fixes this.";
  }
  if (/decode|corrupt/i.test(raw)) {
    return `${raw} If the file opens in other apps, try exporting it as JPG or PNG first.`;
  }
  return raw;
}

export function ToolWorkspace({ tool }: { tool: ToolDef }) {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [options, setOptions] = useState<ToolOptionValues>(() => initialValues(tool));
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const { toast } = useToast();
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Refs mirror current state so the unmount cleanup revokes everything
  // without re-subscribing listeners.
  const imagesRef = useRef<LoadedImage[]>([]);
  const resultsRef = useRef<ProcessedResult[]>([]);
  imagesRef.current = images;
  resultsRef.current = results;

  const maxFiles = tool.maxFiles ?? (tool.multiple ? MAX_BATCH : 1);
  const maxSize = tool.maxSize ?? MAX_FILE_SIZE;

  // Memory hygiene: revoke every temporary object URL when the page unmounts
  // (e.g. navigating to another tool) so blobs don't linger in memory.
  useEffect(() => {
    return () => {
      for (const img of imagesRef.current) URL.revokeObjectURL(img.objectUrl);
      for (const r of resultsRef.current) if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
    };
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      setErrors([]);
      setResults((prev) => {
        for (const r of prev) if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
        return [];
      });
      const { images: loaded, errors: errs } = await loadFiles(files, {
        accept: tool.accept,
        maxFiles,
        maxSize,
      });
      if (errs.length) setErrors(errs);
      if (loaded.length > 0) {
        setImages((prev) => (tool.multiple ? [...prev, ...loaded].slice(0, maxFiles) : loaded));
        toast({
          title: `${loaded.length} image${loaded.length > 1 ? "s" : ""} loaded`,
          description: "Adjust the options, then press the action button.",
        });
      }
    },
    [tool.accept, maxFiles, maxSize, tool.multiple, toast]
  );

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.objectUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.objectUrl));
    results.forEach((r) => r.previewUrl && URL.revokeObjectURL(r.previewUrl));
    setImages([]);
    setResults([]);
    setErrors([]);
    setOptions(initialValues(tool));
    setLogoFiles([]);
  };

  const setOption = (key: string, value: string | number | boolean) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const run = async () => {
    if (images.length === 0) return;
    setBusy(true);
    setErrors([]);
    setProgress({ done: 0, total: images.length });
    // Release previews from the previous run before starting a new one.
    results.forEach((r) => r.previewUrl && URL.revokeObjectURL(r.previewUrl));
    setResults([]);
    try {
      // Load the processor registry on demand — tool-specific processing
      // JavaScript is only fetched when the user actually runs a tool.
      const { getProcessor } = await import("@/lib/tools/processors");
      const processor = getProcessor(tool.processor);
      const merged: ToolOptionValues = { ...options, ...tool.params };
      if (tool.slug === "add-logo-watermark") merged.__logoFiles = logoFiles;
      if (
        (tool.slug === "compress-image-to-specific-size" || tool.slug === "resize-image-to-kb") &&
        typeof options.targetKB === "number"
      ) {
        merged.__targetKB = options.targetKB;
      }
      const res = await processor(images, merged, { onProgress: (done, total) => setProgress({ done, total }) });
      setResults(res);
      toast({ title: `Done — ${res.length} result${res.length > 1 ? "s" : ""}`, description: "Preview and download below." });
      setTimeout(() => workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      const msg = friendlyError(e);
      setErrors([msg]);
      toast({ title: "Processing error", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (results.length === 0) return;
    setZipping(true);
    try {
      // JSZip is only downloaded when a multi-file ZIP is actually requested.
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const used = new Set<string>();
      for (const r of results) {
        let name = r.name;
        let n = 1;
        while (used.has(name)) name = r.name.replace(/(\.[^.]+)$/, `-${n++}$1`);
        used.add(name);
        zip.file(name, r.blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `pixkitapp-${tool.slug}-${results.length}-files.zip`);
      toast({ title: "ZIP ready", description: `${results.length} files packaged.` });
    } catch {
      toast({ title: "ZIP failed", description: "Try downloading files individually.", variant: "destructive" });
    } finally {
      setZipping(false);
    }
  };

  const actionLabel = useMemo(() => {
    if (tool.processor === "metadataReport") return "Read Metadata";
    if (tool.processor === "pickColor") return "Open Color Picker";
    if (tool.processor === "base64Decode") return "Decode Image";
    if (tool.category === "compression" || tool.category === "optimization") return images.length > 1 ? "Compress All" : "Compress";
    if (tool.category === "conversion") return images.length > 1 ? "Convert All" : "Convert";
    if (tool.category === "resizing") return images.length > 1 ? "Resize All" : "Resize";
    if (tool.category === "filters") return images.length > 1 ? "Apply Filter" : "Apply Filter";
    return images.length > 1 ? `Process ${images.length} Images` : "Process Image";
  }, [tool, images.length]);

  return (
    <div ref={workspaceRef} className="scroll-mt-24 space-y-5">
      {/* Step 1: upload */}
      {images.length === 0 && (
        <Dropzone accept={tool.accept} multiple={tool.multiple} maxFiles={maxFiles} maxSize={maxSize} onFiles={handleFiles} />
      )}

      {/* Selected files */}
      {images.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold" aria-live="polite">
              {images.length} image{images.length > 1 ? "s" : ""} · {formatBytes(images.reduce((s, i) => s + i.size, 0))}
            </p>
            {tool.multiple && images.length < maxFiles && (
              <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
                + Add more
                <input
                  type="file"
                  className="sr-only"
                  accept={tool.accept?.join(",") ?? "image/*"}
                  multiple
                  onChange={(e) => { if (e.target.files?.length) handleFiles(Array.from(e.target.files)); e.target.value = ""; }}
                />
              </label>
            )}
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Selected images">
            {images.map((img) => (
              <li key={img.id} className="group relative">
                <img
                  src={img.objectUrl}
                  alt={`Selected: ${img.name}`}
                  className="h-20 w-20 rounded-lg border object-cover sm:h-16 sm:w-16"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  aria-label={`Remove ${img.name}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <p className="mt-1 w-20 truncate text-center text-[10px] text-muted-foreground sm:w-16" title={`${img.name} — ${img.width}×${img.height}`}>
                  {img.width}×{img.height}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something needs your attention</AlertTitle>
          <AlertDescription>
            {errors.map((e, i) => (
              <p key={i} className={i > 0 ? "mt-1" : ""}>{e}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Step 2: options + run */}
      {images.length > 0 && !busy && (
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          {tool.options.length > 0 && (
            <div className={cn(tool.options.length > 6 && "max-h-[480px] overflow-y-auto pr-1 thin-scroll")}>
              <OptionControls options={tool.options} values={options} onChange={setOption} onLogoFiles={tool.slug === "add-logo-watermark" ? setLogoFiles : undefined} />
            </div>
          )}
          <Button onClick={run} size="lg" className="mt-5 h-14 w-full text-base font-semibold sm:h-12">
            <Play className="mr-2 h-5 w-5" aria-hidden="true" />
            {actionLabel}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Processing happens on your device — nothing is uploaded.
          </p>
        </div>
      )}

      {/* Progress */}
      {busy && <ProgressBanner done={progress.done} total={progress.total} label={actionLabel} />}

      {/* Step 3: results */}
      {results.length > 0 && !busy && (
        <ResultsPanel results={results} onReset={reset} onDownloadAll={downloadAll} zipping={zipping} />
      )}
    </div>
  );
}
