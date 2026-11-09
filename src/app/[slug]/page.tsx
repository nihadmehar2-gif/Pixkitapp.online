import Link from "next/link";
import { getTool, TOOLS, SITE_URL, toolsByCategory, categoryById } from "@/lib/tools";
import { CATEGORIES } from "@/lib/tools/categories";
import { ToolPageClient } from "@/components/tool/tool-page-client";
import { ToolIcon } from "@/components/site/tool-icon";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, ShieldCheck, Zap, Lock, Wifi, Info } from "lucide-react";
import { ToolCard, categoryStyle } from "@/components/site/cards";
import { AdSlot } from "@/components/site/ad-slot";
import { OG_IMAGES } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  // Unique, hand-authored SEO title (layout template appends " | PixKitApp") and description.
  const title = tool.seo?.metaTitle ?? `${tool.name} — Free Online`;
  const description = tool.seo?.metaDescription ?? tool.description;
  // Merge primary keyword + tool keywords, deduplicated case-insensitively so the
  // meta keywords tag never contains repeats (e.g. "compress image to 50kb").
  const kwSource = tool.seo ? [tool.seo.primaryKeyword, ...tool.keywords] : tool.keywords;
  const seenKw = new Set<string>();
  const keywords = kwSource.filter((k) => {
    const key = k.toLowerCase().trim();
    if (!key || seenKw.has(key)) return false;
    seenKw.add(key);
    return true;
  });
  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/${tool.slug}` },
    openGraph: {
      title: `${title} | PixKitApp`,
      description,
      url: `${SITE_URL}/${tool.slug}`,
      siteName: "PixKitApp",
      type: "website",
      locale: "en_US",
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PixKitApp`,
      description,
      images: OG_IMAGES,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const category = categoryById(tool.category);
  // Related tools: same category first, then top up with cross-category picks
  // scored by keyword/name affinity (e.g. crop 16:9 ↔ YouTube thumbnail resizer,
  // white-background removal ↔ transparency tools). Keeps ≥4 links even in small
  // categories and creates relevant cross-links between categories.
  const sameCat = toolsByCategory(tool.category).filter((t) => t.slug !== tool.slug);
  const words = new Set(
    [...tool.keywords, ...tool.name.toLowerCase().split(/\s+/)]
      .flatMap((k) => k.toLowerCase().split(/\s+/))
      .filter((w) => w.length > 2)
  );
  const crossCat = TOOLS.filter((t) => t.category !== tool.category)
    .map((t) => {
      const hay = `${t.name} ${t.slug} ${t.keywords.join(" ")}`.toLowerCase();
      let score = 0;
      for (const w of words) if (hay.includes(w)) score += w.length > 4 ? 2 : 1;
      return { t, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, 6 - Math.min(4, sameCat.length)))
    .map((s) => s.t);
  const related = [...sameCat.slice(0, 4), ...crossCat].slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${tool.name} — PixKitApp`,
        url: `${SITE_URL}/${tool.slug}`,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any (web browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: tool.seo?.metaDescription ?? tool.description,
        // Verifiable product features (true of THIS tool) —
        // deliberately NOT the meta keywords, which are search phrases.
        // The batch/ZIP feature only applies to tools that accept multiple files.
        featureList: [
          "Runs entirely in your browser — images are never uploaded",
          "Free to use with no signup and no watermarks",
          ...(tool.multiple ? ["Process up to 10 images per run with ZIP download"] : ["Processes one image at a time, right in your browser"]),
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: category?.name ?? "Tools", item: `${SITE_URL}/categories/${category?.slug ?? "tools"}` },
          { "@type": "ListItem", position: 3, name: tool.name, item: `${SITE_URL}/${tool.slug}` },
        ],
      },
      ...(tool.faq
        ? [
            {
              "@type": "FAQPage",
              mainEntity: tool.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        {/* Padding + negative margin: hit area ~36px tall without changing the visual layout. */}
        <Link href="/" className="inline-block py-2.5 -my-2.5 px-1.5 -mx-1.5 hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {category && (
          <>
            <Link href={`/categories/${category.slug}`} className="inline-block py-2.5 -my-2.5 px-1.5 -mx-1.5 hover:text-foreground">{category.name}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="text-foreground">{tool.name}</span>
      </nav>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg ${categoryStyle(tool.category).gradient}`}
          aria-hidden="true"
        >
          <ToolIcon name={tool.icon} className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.h1}</h1>
          <p className="mt-1.5 max-w-3xl text-muted-foreground">{tool.description}</p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {[
          { icon: ShieldCheck, label: "Private — images never uploaded" },
          { icon: Zap, label: "Instant processing" },
          { icon: Lock, label: "No signup required" },
          { icon: Wifi, label: "No uploads, no waiting" },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-accent-foreground" /> {label}
          </span>
        ))}
      </div>

      {tool.requirementNote && (
        <aside
          aria-label="Requirement accuracy note"
          className="mb-6 flex max-w-3xl items-start gap-2.5 rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{tool.requirementNote}</p>
        </aside>
      )}

      <ToolPageClient tool={tool} />

      {/* Ad container between the tool interface and reading content —
          in normal flow, so it never covers image controls or download buttons. */}
      <AdSlot id="in-content" className="mt-8" />

      {tool.seo ? (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-lg font-semibold">About the {tool.name}</h2>
          {tool.about && <p className="mt-2 leading-relaxed text-muted-foreground">{tool.about}</p>}
          <div className="mt-5 space-y-5">
            <div>
              <h3 className="font-medium">How it works</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">{tool.seo.guide.how}</p>
            </div>
            <div>
              <h3 className="font-medium">How to use it</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">{tool.seo.guide.steps}</p>
            </div>
            <div>
              <h3 className="font-medium">Supported formats &amp; limitations</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">{tool.seo.guide.formats}</p>
            </div>
            <div>
              <h3 className="font-medium">Common use cases</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">{tool.seo.guide.cases}</p>
            </div>
          </div>
        </section>
      ) : (
        tool.about && (
          <section className="prose-sm mt-10 max-w-3xl">
            <h2 className="text-lg font-semibold">About this tool</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{tool.about}</p>
          </section>
        )
      )}

      {tool.faq && tool.faq.length > 0 && (
        <section className="mt-8 max-w-3xl">
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          <div className="mt-3 space-y-3">
            {tool.faq.map((f) => (
              <div key={f.q} className="rounded-lg border bg-card p-4">
                <h3 className="font-medium">{f.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Related tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
          <div className="mt-4">
            <Link href="/tools" className="inline-block py-2.5 -my-2.5 text-sm font-medium text-foreground hover:underline">
              Browse all {TOOLS.length} tools →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
