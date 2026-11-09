"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { searchIndexTools } from "@/lib/tools/search-index";
import { CATEGORIES } from "@/lib/tools/categories";
import { ToolIcon } from "./tool-icon";
import { Search } from "lucide-react";

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const run = useCallback((slug: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(`/${slug}`);
  }, [router, onOpenChange]);

  const results = query ? searchIndexTools(query, 14) : [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search tools" description="Find an image tool">
      <CommandInput placeholder="Search 127 tools… e.g. compress, resize, webp" value={query} onValueChange={setQuery} aria-label="Search tools" />
      <CommandList className="max-h-[380px]">
        {results.length === 0 && query.length > 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">No tools match “{query}”.</div>
        )}
        {!query && (
          <CommandGroup heading="Browse categories">
            {CATEGORIES.map((cat) => (
              <CommandItem key={cat.id} value={`category-${cat.id}`} onSelect={() => { onOpenChange(false); router.push(`/categories/${cat.slug}`); }}>
                <ToolIcon name={cat.icon} className="mr-2 h-4 w-4 text-accent-foreground" />
                <span>{cat.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">Category</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.length > 0 && (
          <CommandGroup heading={`${results.length} tool${results.length > 1 ? "s" : ""} found`}>
            {results.map((tool) => (
              <CommandItem key={tool.slug} value={tool.slug} onSelect={() => run(tool.slug)}>
                <ToolIcon name={tool.icon} className="mr-2 h-4 w-4 text-accent-foreground" />
                <span className="font-medium">{tool.name}</span>
                <span className="ml-auto hidden max-w-[200px] truncate text-xs text-muted-foreground sm:block">{tool.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Platform-appropriate search shortcut label, measured once per client.
 *  Touch-first devices (phones/tablets as primary input) get no badge —
 *  a desktop keyboard hint would be wrong there. The server snapshot is
 *  null so hydration is clean; the badge appears after hydration. */
const noopSubscribe = () => () => {};
let cachedShortcut: string | null | undefined;
function clientShortcut(): string | null {
  if (cachedShortcut === undefined) {
    if (typeof window === "undefined" || window.matchMedia?.("(pointer: coarse)")?.matches) {
      cachedShortcut = null;
    } else {
      const apple = /Mac|iPhone|iPad|iPod/i.test(`${navigator.userAgent} ${navigator.platform || ""}`);
      cachedShortcut = apple ? "⌘K" : "Ctrl K";
    }
  }
  return cachedShortcut;
}

export function SearchTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  const shortcut = useSyncExternalStore(noopSubscribe, clientShortcut, () => null);
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-full border bg-card px-3.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
      aria-label="Search tools"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search tools…</span>
      {shortcut && <kbd className="hidden ml-2 rounded border bg-muted px-1.5 font-mono text-[10px] md:inline-block">{shortcut}</kbd>}
    </button>
  );
}
