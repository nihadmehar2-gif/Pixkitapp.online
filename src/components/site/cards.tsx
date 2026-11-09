import Link from "next/link";
import { ToolIcon } from "./tool-icon";
import type { ToolLite } from "@/lib/tools";
import type { ToolCategory } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

/**
 * Per-category visual identity for tool "logos".
 * Soft Tan redesign: every tool card shows the same solid tan tile with a
 * dark brown icon — one consistent brand surface instead of per-category
 * rainbow gradients. The record shape is kept so existing consumers
 * (`.gradient`, `.glow`) keep working unchanged.
 */
const CATEGORY_STYLES: Record<string, { gradient: string; glow: string }> = {
  compression:  { gradient: "bg-primary text-primary-foreground", glow: "" },
  resizing:     { gradient: "bg-primary text-primary-foreground", glow: "" },
  cropping:     { gradient: "bg-primary text-primary-foreground", glow: "" },
  conversion:   { gradient: "bg-primary text-primary-foreground", glow: "" },
  rotation:     { gradient: "bg-primary text-primary-foreground", glow: "" },
  filters:      { gradient: "bg-primary text-primary-foreground", glow: "" },
  optimization: { gradient: "bg-primary text-primary-foreground", glow: "" },
  metadata:     { gradient: "bg-primary text-primary-foreground", glow: "" },
  color:        { gradient: "bg-primary text-primary-foreground", glow: "" },
  watermarking: { gradient: "bg-primary text-primary-foreground", glow: "" },
  text:         { gradient: "bg-primary text-primary-foreground", glow: "" },
  transparency: { gradient: "bg-primary text-primary-foreground", glow: "" },
  social:       { gradient: "bg-primary text-primary-foreground", glow: "" },
  passport:     { gradient: "bg-primary text-primary-foreground", glow: "" },
};

const FALLBACK_STYLE = { gradient: "bg-primary text-primary-foreground", glow: "" };

/** Solid tan tile + glow pair for a tool's category (all categories share the brand tile). */
export function categoryStyle(categoryId: string) {
  return CATEGORY_STYLES[categoryId] ?? FALLBACK_STYLE;
}

export function ToolCard({ tool, className, heading = "h3" }: { tool: ToolLite; className?: string; heading?: "h2" | "h3" }) {
  const Heading = heading;
  const style = categoryStyle(tool.category);
  return (
    <Link
      href={`/${tool.slug}`}
      className={cn(
        "soft-card group flex h-full flex-col gap-2.5 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] active:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {/* Tool "logo": solid tan tile with a dark brown icon */}
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110",
          style.gradient
        )}
        aria-hidden="true"
      >
        <ToolIcon name={tool.icon} className="h-5.5 w-5.5" />
      </div>
      {/* heading="h2" when cards sit directly under the page h1 (no intervening
          section h2) so the outline never skips a level. */}
      <Heading className="font-semibold leading-snug">{tool.name}</Heading>
      <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{tool.description}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true">
        Open tool <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}

export function CategoryCard({ category, count }: { category: ToolCategory; count: number }) {
  const style = categoryStyle(category.id);
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="soft-card group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-primary", category.color)} aria-hidden="true" />
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110",
          style.gradient
        )}
        aria-hidden="true"
      >
        <ToolIcon name={category.icon} className="h-6 w-6" />
      </div>
      <h3 className="mt-3 font-semibold">{category.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{category.description}</p>
      <p className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-foreground">
        {count} tools <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </p>
    </Link>
  );
}
