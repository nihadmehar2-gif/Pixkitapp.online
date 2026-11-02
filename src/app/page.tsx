import Link from "next/link";
import type { Metadata } from "next";
import { TOOLS, popularTools, categoriesWithCounts, SITE_URL } from "@/lib/tools";
import { CATEGORIES } from "@/lib/tools/categories";
import { socialMeta } from "@/lib/seo";
import { ToolCard, CategoryCard, categoryStyle } from "@/components/site/cards";
import { ToolIcon } from "@/components/site/tool-icon";
import { HomeSearch } from "@/components/site/home-search";
import { AdSlot } from "@/components/site/ad-slot";
import { ShieldCheck, Zap, Smartphone, BadgeCheck } from "lucide-react";

// Primary keyword: "free online image tools" — used verbatim in the title,
// meta description and H1 below. Kept natural, honest and ~150 characters.
const HOME_DESCRIPTION =
  "Use 127 free online image tools to compress, resize, crop and convert photos right in your browser. Nothing is uploaded — files never leave your device.";

export const metadata: Metadata = {
  // 56 chars — primary keyword "free online image tools" verbatim plus brand;
  // resize/crop intent stays covered by the meta description and H1 below.
  title: "Free Online Image Tools – Compress & Convert | PixKitApp",
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  ...socialMeta({
    title: "Free Online Image Tools – Compress & Convert | PixKitApp",
    description: HOME_DESCRIPTION,
    path: "/",
  }),
};

/**
 * Site-wide structured data (homepage only — tool and category pages emit
 * their own page-specific nodes).
 *
 * Accuracy rules enforced here:
 * - Only verifiable facts (no ratings, reviews, contact details or social
 *   profiles that don't publicly exist).
 * - SearchAction is included because /tools?q=… is a real, server-rendered,
 *   crawlable search results page (see src/app/tools/page.tsx).
 * - Every FAQPage question below is rendered VISIBLY in the FAQ section of
 *   this page (HOME_FAQS is the single source for both).
 */
const HOME_FAQS = [
  {
    q: "Are PixKitApp tools really free?",
    a: "Yes — all 127 image tools are completely free with no signup, no watermarks and nothing to install.",
  },
  {
    q: "Are my images uploaded to a server?",
    a: "No. Every tool processes images locally in your browser using Canvas and web APIs. Your files never leave your device.",
  },
  {
    q: "Do the tools work on phones and Chromebooks?",
    a: "Yes. PixKitApp is mobile-first and works in any modern browser — Android, iPhone, iPad, Chromebook, Windows and Mac.",
  },
];

/**
 * Tool spotlight entries. Each note adds specific, code-verified detail
 * beyond the tool's standard description (which already appears on every
 * card elsewhere on this page) — so the spotlight never just repeats the
 * popular-tools copy.
 */
const SPOTLIGHT: { slug: string; note: string }[] = [
  {
    slug: "image-compressor",
    note: "One quality slider (75% suits most photos) — opaque PNGs converted to JPEG often shrink the most.",
  },
  {
    slug: "image-to-pdf",
    note: "Up to 10 images become one document — pick A4 or Letter paper with your own orientation and margins.",
  },
  {
    slug: "passport-photo-maker",
    note: "Print-ready 300 DPI output with alignment guides — size presets for US, UK, EU, India and more.",
  },
  {
    slug: "remove-white-background",
    note: "Flood-fill transparency protects white details inside your subject and exports a real alpha-channel PNG.",
  },
  {
    slug: "resize-image-to-kb",
    note: "Searches dimensions and quality together, so big photos land under your KB cap without going soft.",
  },
  {
    slug: "image-metadata-viewer",
    note: "See what your camera embeds before you share: EXIF settings, GPS coordinates and PNG chunks, decoded on-device.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "PixKitApp",
      url: SITE_URL,
      description: "127 free online image tools that run in your browser with zero uploads.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/tools?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "PixKitApp",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.svg`,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: HOME_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function HomePage() {
  const popular = popularTools(12);
  const cats = categoriesWithCounts();

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Localized light bloom behind the headline */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.62 0.25 300 / 0.45), transparent)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="glow-halo mx-auto mb-5 inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-sm text-muted-foreground">
            <BadgeCheck className="h-4 w-4 text-primary" />
            {TOOLS.length} tools · zero uploads · 100% free
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Free online image tools for every task.{" "}
            <span className="text-shine">Right in your browser.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Compress, resize, crop, convert, watermark and more — {TOOLS.length} free online image tools that process
            everything on your device. Nothing is ever uploaded, so your photos stay private.
          </p>
          <HomeSearch />

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Private by design" },
              { icon: Zap, label: "Instant results" },
              { icon: Smartphone, label: "Mobile-first" },
              { icon: BadgeCheck, label: "No watermarks" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="glass-card flex items-center justify-center gap-2 rounded-xl px-3 py-2.5">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular tools */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Popular <span className="text-shine">tools</span>
            </h2>
            <p className="mt-1 text-muted-foreground">The go-to image utilities on PixKitApp.</p>
          </div>
          <Link href="/tools" className="hidden shrink-0 text-sm font-medium text-primary hover:underline sm:block">
            View all {TOOLS.length} →
          </Link>
        </div>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
        <Link href="/tools" className="mt-5 block text-sm font-medium text-primary hover:underline sm:hidden">
          View all {TOOLS.length} tools →
        </Link>
      </section>

      {/* Ad container between content sections — reserved space, in normal flow. */}
      <AdSlot id="in-content" className="py-2" />

      {/* Categories */}
      <section className="border-y">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Browse by <span className="text-shine">category</span>
          </h2>
          <p className="mt-1 text-muted-foreground">Every tool organized into {CATEGORIES.length} focused categories.</p>
          <div className="mt-7 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cats.map((cat) => (
              <CategoryCard key={cat.id} category={cat} count={cat.count} />
            ))}
          </div>
        </div>
      </section>

      {/* Why PixKitApp */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Why PixKitApp is <span className="text-shine">different</span>
            </h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  title: "Your images never leave your device",
                  body: "Unlike most online tools, PixKitApp has no upload step. All processing runs locally with the Canvas API and modern browser capabilities — your files stay on your machine from start to finish.",
                },
                {
                  title: "A growing collection of practical image tools",
                  body: "Each of the 127 tools has its own purpose-built interface, options and output — from iterative target-size compression to EXIF inspection to passport photo guides.",
                },
                {
                  title: "Built for every screen",
                  body: "Large touch targets, responsive layouts and keyboard shortcuts make it fast on phones, Chromebooks and desktops alike.",
                },
                {
                  title: "Batch everything",
                  body: "Process up to 10 images per run with per-file stats and one-click ZIP download of all results.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-card flex gap-3 rounded-xl p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card min-w-0 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold">Tool spotlight</h3>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {SPOTLIGHT.map(({ slug, note }) => {
                const tool = TOOLS.find((t) => t.slug === slug)!;
                const style = categoryStyle(tool.category);
                return (
                  <Link key={slug} href={`/${slug}`} className="group flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 ${style.gradient}`}>
                      <ToolIcon name={tool.icon} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tool.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{note}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* All tools A-Z */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                All {TOOLS.length} <span className="text-shine">tools</span>
              </h2>
              <p className="mt-1 text-muted-foreground">Everything on PixKitApp, organized by category.</p>
            </div>
            <Link href="/tools" className="shrink-0 text-sm font-medium text-primary hover:underline">
              Search & filter →
            </Link>
          </div>
          <div className="space-y-7">
            {CATEGORIES.map((cat) => {
              const tools = TOOLS.filter((t) => t.category === cat.id);
              if (tools.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-white shadow-sm ${cat.color}`}>
                      <ToolIcon name={cat.icon} className="h-3.5 w-3.5" />
                    </span>
                    {cat.name}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs normal-case">{tools.length}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {tools.map((t) => {
                      const style = categoryStyle(t.category);
                      return (
                        <Link
                          key={t.slug}
                          href={`/${t.slug}`}
                          className="group inline-flex min-h-[40px] items-center gap-2 rounded-full glass-card px-3.5 py-2 text-sm text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:text-foreground hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${style.gradient}`} aria-hidden="true">
                            <ToolIcon name={t.icon} className="h-3 w-3" />
                          </span>
                          {t.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ — the visible source of truth for the FAQPage structured data
          above. Questions and answers are kept 1:1 with HOME_FAQS. */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Frequently asked <span className="text-shine">questions</span>
          </h2>
          <div className="mt-6 space-y-3">
            {HOME_FAQS.map((f) => (
              <div key={f.q} className="glass-card rounded-xl p-4">
                <h3 className="font-medium">{f.q}</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
