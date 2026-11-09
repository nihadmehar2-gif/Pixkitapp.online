"use client";

/** Results grid: preview, stats, per-item download, download-all ZIP.
 *  Responsive: cards stack on phones; download controls are 44px+ touch
 *  targets and stay in normal flow (never overlaid by ads or other content). */

import { useState } from "react";
import type { ProcessedResult } from "@/lib/tools/types";
import { formatBytes } from "@/lib/image/loader";
import { downloadBlob } from "@/lib/image/canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Eye, PackageOpen, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  results: ProcessedResult[];
  onReset: () => void;
  onDownloadAll?: () => void;
  zipping?: boolean;
  customNote?: (r: ProcessedResult) => string;
}

export function ResultsPanel({ results, onReset, onDownloadAll, zipping, customNote }: Props) {
  const [preview, setPreview] = useState<ProcessedResult | null>(null);
  const totalIn = results.reduce((s, r) => s + r.originalSize, 0);
  const totalOut = results.reduce((s, r) => s + r.blob.size, 0);
  const pct = totalIn > 0 ? Math.round(((totalIn - totalOut) / totalIn) * 100) : 0;

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">
            {results.length} result{results.length > 1 ? "s" : ""} ready
          </p>
          <p className="text-sm text-muted-foreground">
            {formatBytes(totalIn)} → {formatBytes(totalOut)}
            {pct > 0 && <span className="ml-1 font-medium text-green-600 dark:text-green-400">(−{pct}%)</span>}
            {pct < 0 && <span className="ml-1 text-amber-600 dark:text-amber-400">(+{-pct}%)</span>}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {results.length > 1 && (
            <Button onClick={onDownloadAll} disabled={zipping} className="h-12 w-full text-base sm:h-11 sm:w-auto sm:text-sm">
              {zipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <PackageOpen className="mr-2 h-4 w-4" aria-hidden="true" />}
              {zipping ? "Zipping…" : "Download all (ZIP)"}
            </Button>
          )}
          <Button variant="outline" onClick={onReset} className="h-12 w-full text-base sm:h-11 sm:w-auto sm:text-sm">
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Start over
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {results.map((r) => (
          <li key={r.id} className="flex gap-3 rounded-xl border bg-card p-3">
            <button
              type="button"
              onClick={() => r.previewUrl && setPreview(r)}
              disabled={!r.previewUrl}
              aria-label={r.previewUrl ? `Enlarge preview of ${r.name}` : `Result file ${r.name} has no visual preview`}
              className="checkerboard flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
            >
              {r.previewUrl ? (
                <img src={r.previewUrl} alt={`Result preview: ${r.name}`} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
              ) : (
                <PackageOpen className="h-8 w-8 text-muted-foreground" aria-label="File result, no visual preview available" />
              )}
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-sm font-medium" title={r.name}>{r.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatBytes(r.blob.size)}
                {r.width > 0 && ` · ${r.width}×${r.height}`}
              </p>
              {r.note && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{customNote ? customNote(r) : r.note}</p>}
              <div className="mt-auto flex gap-2 pt-2">
                <Button size="sm" className="h-11 flex-1 text-sm" onClick={() => downloadBlob(r.blob, r.name)}>
                  <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Download
                </Button>
                {r.previewUrl && (
                  <Button size="sm" variant="outline" className="h-11 w-11 p-0" onClick={() => setPreview(r)} aria-label={`Preview ${r.name}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="pr-6 text-base">{preview?.name}</DialogTitle>
            <DialogDescription className="sr-only">Preview of the processed image with download option.</DialogDescription>
          </DialogHeader>
          {preview?.previewUrl && (
            <div className="checkerboard flex max-h-[70vh] items-center justify-center overflow-hidden rounded-lg border p-2">
              <img src={preview.previewUrl} alt={`Full preview: ${preview.name}`} className="max-h-[65vh] max-w-full object-contain" />
            </div>
          )}
          {preview && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                {preview.width > 0 ? `${preview.width}×${preview.height} · ` : ""}{formatBytes(preview.blob.size)}
              </span>
              <Button className="h-12 w-full text-base sm:h-10 sm:w-auto sm:text-sm" onClick={() => downloadBlob(preview.blob, preview.name)}>
                <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProgressBanner({ done, total, label }: { done: number; total: number; label?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const indeterminate = total <= 1;
  return (
    <div className={cn("rounded-xl border bg-card p-4")} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {label ? `${label} in progress… ` : "Processing… "}
            {!indeterminate && `${done}/${total} · ${pct}%`}
            {indeterminate && "this usually takes a few seconds"}
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={indeterminate ? undefined : pct}
            aria-label="Processing progress"
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: indeterminate ? "100%" : `${pct}%`, opacity: indeterminate ? 0.4 : 1 }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Keep this tab open — processing runs on your device.</p>
        </div>
      </div>
    </div>
  );
}
