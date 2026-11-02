/** Tool type system — data-driven definitions for 124 tools. */

import type { LoadedImage } from "@/lib/image/loader";
import type { OutputFormat } from "@/lib/image/canvas";

export interface ToolCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // tailwind-friendly gradient token
  /** Hand-authored SEO title for the category page (template appends " | PixKitApp"). */
  metaTitle?: string;
  /** Hand-authored 150–160c meta description; falls back to a formula when absent. */
  metaDescription?: string;
}

/** One configurable control on a tool page. */
export type ToolOption =
  | { key: string; label: string; type: "number"; default: number; min?: number; max?: number; step?: number; suffix?: string; help?: string }
  | { key: string; label: string; type: "slider"; default: number; min: number; max: number; step?: number; suffix?: string; help?: string }
  | { key: string; label: string; type: "select"; default: string; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: "toggle"; default: boolean; help?: string }
  | { key: string; label: string; type: "color"; default: string; help?: string }
  | { key: string; label: string; type: "text"; default: string; placeholder?: string; maxLength?: number; help?: string }
  | { key: string; label: string; type: "textarea"; default: string; placeholder?: string; maxLength?: number; help?: string };

export type ToolOptionValues = Record<string, string | number | boolean | File[]>;

export interface ProcessedResult {
  id: string;
  sourceId: string;
  sourceName: string;
  name: string; // output filename
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  previewUrl: string;
  note?: string; // e.g. quality used, savings
}

export type ProcessContext = {
  onProgress?: (done: number, total: number) => void;
};

/** Processor signature — receives loaded images + option values, returns results. */
export type Processor = (
  images: LoadedImage[],
  options: ToolOptionValues,
  ctx: ProcessContext
) => Promise<ProcessedResult[]>;

export interface ToolDef {
  slug: string;
  name: string; // nav/card title
  h1: string; // page headline
  description: string; // card + meta description
  keywords: string[];
  category: string; // category id
  icon: string; // lucide icon name
  popular?: boolean;
  /** File input config */
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  /** Whether dropping a file enables an interactive editor (crop/passport) instead of run-button flow. */
  interactive?: "crop" | "passport";
  /** Show live preview of first image as options change (single-file tools). */
  livePreview?: boolean;
  /** Options schema */
  options: ToolOption[];
  /** Processor registry key */
  processor: string;
  /** Static params merged with option values (e.g. fixed target KB). */
  params?: ToolOptionValues;
  /** SEO FAQ for JSON-LD */
  faq?: { q: string; a: string }[];
  /**
   * Visible accuracy note rendered as a callout on the tool page (outside the
   * FAQ/JSON-LD). Used by passport/visa/ID tools: requirements vary by country
   * and change over time, so pages must direct users to the issuing authority.
   */
  requirementNote?: string;
  /** Long SEO copy shown under the tool (2-3 sentences). */
  about?: string;
  /** Per-tool SEO content: unique title, meta description, primary keyword and usage guide. */
  seo?: ToolSeo;
}

/** Structured SEO guide rendered below the tool interface (~150-200 words total). */
export interface ToolGuide {
  /** How the tool works, technically. */
  how: string;
  /** Step-by-step usage instructions referencing the actual UI. */
  steps: string;
  /** Supported input/output formats plus honest limitations. */
  formats: string;
  /** Practical use cases. */
  cases: string;
}

export interface ToolSeo {
  /** Unique SEO title WITHOUT the " | PixKitApp" suffix (the layout template appends it). */
  metaTitle: string;
  /** Unique meta description, ideally 140-160 characters. */
  metaDescription: string;
  /** The single primary keyword this page targets. */
  primaryKeyword: string;
  guide: ToolGuide;
}

export function seo(
  metaTitle: string,
  metaDescription: string,
  primaryKeyword: string,
  how: string,
  steps: string,
  formats: string,
  cases: string
): ToolSeo {
  return { metaTitle, metaDescription, primaryKeyword, guide: { how, steps, formats, cases } };
}

export function optSlider(key: string, label: string, def: number, min: number, max: number, step = 1, suffix = "", help?: string): ToolOption {
  return { key, label, type: "slider", default: def, min, max, step, suffix, help };
}
export function optNumber(key: string, label: string, def: number, min?: number, max?: number, suffix?: string, help?: string): ToolOption {
  return { key, label, type: "number", default: def, min, max, step: 1, suffix, help };
}
export function optSelect(key: string, label: string, def: string, options: { value: string; label: string }[], help?: string): ToolOption {
  return { key, label, type: "select", default: def, options, help };
}
export function optToggle(key: string, label: string, def: boolean, help?: string): ToolOption {
  return { key, label, type: "toggle", default: def, help };
}
export function optColor(key: string, label: string, def: string, help?: string): ToolOption {
  return { key, label, type: "color", default: def, help };
}
export function optText(key: string, label: string, def: string, placeholder?: string, maxLength = 120, help?: string): ToolOption {
  return { key, label, type: "text", default: def, placeholder, maxLength, help };
}

export const FORMAT_OPTS = (def = "auto"): ToolOption =>
  optSelect("format", "Output format", def, [
    { value: "auto", label: "Keep original / auto" },
    { value: "image/jpeg", label: "JPEG (.jpg)" },
    { value: "image/png", label: "PNG (.png)" },
    { value: "image/webp", label: "WebP (.webp)" },
  ], "Keep original re-encodes in the SAME format (JPEG→JPEG, PNG→PNG, WebP→WebP) — no hidden conversion. Pick a format to convert; JPEG flattens transparency onto white.");

export const QUALITY_OPTS = (def = 80): ToolOption[] => [
  optSlider("quality", "Image quality", def, 5, 100, 1, "%", "Lower quality = smaller file. 80% is a good balance."),
];
