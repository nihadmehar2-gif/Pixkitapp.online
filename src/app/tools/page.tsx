import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TOOLS, liteTools, SITE_URL } from "@/lib/tools";
import { CATEGORIES } from "@/lib/tools/categories";
import { socialMeta } from "@/lib/seo";
import { ToolsBrowser } from "@/components/site/tools-browser";

const TOOLS_DESCRIPTION =
  "Browse all PixKitApp image tools: compression, resizing, cropping, conversion, filters, watermarks, passport photos and more. Search and filter by category.";

export const metadata: Metadata = {
  title: "All Tools — 127 Free Online Image Tools A-Z",
  description: TOOLS_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/tools` },
  ...socialMeta({
    title: "All Tools — 127 Free Online Image Tools A-Z | PixKitApp",
    description: TOOLS_DESCRIPTION,
    path: "/tools",
  }),
};

interface SearchParams {
  q?: string;
  cat?: string;
}

/**
 * Server-side search results.
 *
 * /tools?q=… (and /tools?cat=…) are rendered on the server with the matching
 * tool cards in the initial HTML, which makes the site search genuinely
 * crawlable and justifies the WebSite SearchAction on the homepage. The
 * filtering logic below mirrors ToolsBrowser's client filter exactly, so
 * hydrated results match the prerendered ones 1:1 and the client keeps
 * refining the FULL catalog (passed via allTools) as the user types.
 */
function filterTools(
  tools: ReturnType<typeof liteTools>,
  q: string,
  cat: string
) {
  const terms = q.split(/\s+/).filter(Boolean);
  return tools.filter((tool) => {
    if (cat !== "all" && tool.category !== cat) return false;
    if (terms.length === 0) return true;
    const hay = `${tool.name} ${tool.slug} ${tool.description} ${tool.keywords.join(" ")}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q: rawQ, cat: rawCat } = await searchParams;
  const q = (rawQ ?? "").trim().toLowerCase();
  const cat = (rawCat ?? "").trim() || "all";

  const all = liteTools(TOOLS);
  const searching = q.length > 0 || cat !== "all";
  const filtered = searching ? filterTools(all, q, cat) : all;

  // A-Z directory — grouped server-side so every letter section and all
  // 127 tool links ship in the initial HTML. The grouping is derived once
  // here (server component), independent of the client search state above:
  // the index always lists every tool, exactly matching the page's own
  // "A-Z" title, and is fully crawlable without JavaScript.
  const byLetter = new Map<string, typeof all>();
  for (const tool of [...all].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = (tool.name[0] ?? "#").toUpperCase();
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter)!.push(tool);
  }
  const letters = [...byLetter.keys()].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">All PixKitApp Tools</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every one of our {TOOLS.length} free image tools — searchable, filterable and always processed locally in your browser.
        </p>
        {q.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
            {filtered.length} tool{filtered.length !== 1 ? "s" : ""} matching &ldquo;{rawQ?.trim() ?? q}&rdquo;
          </p>
        )}
      </header>
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading tools…</div>}>
        <ToolsBrowser
          categories={CATEGORIES}
          tools={filtered}
          allTools={all}
        />
      </Suspense>

      {/* Server-rendered A-Z index: plain HTML links grouped by first letter,
          present in the initial server response (no hydration required).
          Jump nav uses in-page anchors (#tools-x) rendered below. */}
      <section aria-labelledby="tools-az-heading" className="mt-12 border-t pt-8">
        <h2 id="tools-az-heading" className="text-lg font-semibold">All {TOOLS.length} tools A–Z</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Every tool name grouped by its first letter — the complete directory of the site, one link per tool.
        </p>
        <nav aria-label="Jump to letter" className="mt-4 flex flex-wrap gap-1.5">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#tools-letter-${letter.toLowerCase()}`}
              className="inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border bg-card px-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {letter}
            </a>
          ))}
        </nav>
        <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map((letter) => (
            <section key={letter} aria-label={`Tools starting with ${letter}`} className="scroll-mt-24" id={`tools-letter-${letter.toLowerCase()}`}>
              <h3 className="text-base font-semibold">{letter}</h3>
              <ul className="mt-2 space-y-1.5">
                {byLetter.get(letter)!.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/${tool.slug}`}
                      className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
