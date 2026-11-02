"use client";

/** Homepage search that routes to /tools?q=… */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

const SUGGESTIONS = ["compress to 50kb", "webp to jpg", "passport photo", "crop circle", "remove white background", "resize for instagram"];

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const go = (query: string) => {
    router.push(query.trim() ? `/tools?q=${encodeURIComponent(query.trim())}` : "/tools");
  };

  return (
    <div className="mx-auto mt-7 max-w-xl">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); go(q); }}
        className="flex overflow-hidden rounded-full border bg-card shadow-lg focus-within:ring-2 focus-within:ring-ring"
      >
        <div className="flex flex-1 items-center gap-2 pl-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools — try “compress” or “webp”…"
            aria-label="Search image tools"
            className="h-13 w-full bg-transparent py-3.5 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          className="m-1 inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Search <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap justify-center gap-2.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => go(s)}
            className="inline-flex min-h-[40px] items-center rounded-full border bg-card px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
