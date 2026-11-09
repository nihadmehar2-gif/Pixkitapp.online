"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { filesFromDataTransfer, formatBytes } from "@/lib/image/loader";
import { Upload, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  accept?: string[];
  multiple?: boolean;
  maxFiles: number;
  maxSize: number;
  onFiles: (files: File[]) => void;
  compact?: boolean;
}

export function Dropzone({ accept, multiple, maxFiles, maxSize, onFiles, compact }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const files = Array.from(list);
      if (files.length) onFiles(multiple ? files.slice(0, maxFiles) : files.slice(0, 1));
    },
    [onFiles, multiple, maxFiles]
  );

  const acceptAttr = accept?.length
    ? [...accept.map((a) => (a.startsWith(".") ? a : a)), ...["image/*"].filter(() => accept?.some((a) => a === "image/jpeg" || a === "image/png"))].join(",") || undefined
    : "image/*";

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card/50 text-center transition-colors",
        // Keyboard focus lands on the sr-only file input inside; highlight the
        // whole dropzone via :focus-within so focus stays visible.
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40",
        compact ? "p-5" : "p-6 sm:p-12"
      )}
    >
      {/* The real, natively-accessible control: keyboard users tab to this
          input and press Enter to open the picker. Kept sr-only (not hidden)
          so it stays focusable and exposed to assistive technology. */}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={acceptAttr ?? "image/*,.bmp,.avif,.svg"}
        multiple={multiple}
        aria-label={multiple ? "Choose images to process" : "Choose an image to process"}
        aria-describedby={hintId}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Upload className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold">{multiple ? `Choose images or drop them here` : "Choose an image or drop it here"}</p>
        <p id={hintId} className="mt-1 text-sm text-muted-foreground">
          Up to {maxFiles} image{maxFiles > 1 ? "s" : ""} · max {formatBytes(maxSize, 0)} each · files never leave your device
        </p>
      </div>
      {/* Visual duplicate of the input control — mouse users may click it
          (the click bubbles to the dropzone). Not focusable and aria-hidden:
          keyboard and screen-reader users use the real file input above. */}
      <Button type="button" size="lg" aria-hidden="true" tabIndex={-1} className="mt-1 h-14 w-full text-base font-semibold sm:h-12 sm:min-w-[220px] sm:w-auto sm:text-lg">
        <ImageIcon className="mr-2 h-5 w-5" />
        Select {multiple ? "Images" : "Image"}
      </Button>
      <p className="text-xs text-muted-foreground">You can also paste an image from your clipboard</p>
      {compact && <X className="hidden" />}
    </div>
  );
}
