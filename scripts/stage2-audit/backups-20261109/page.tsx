import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, categoryById, DOCUMENT_PHOTO_NOTE } from "@/lib/tools/categories";
import { toolsByCategory, TOOLS, SITE_URL } from "@/lib/tools";
import { socialMeta } from "@/lib/seo";
import { ToolCard } from "@/components/site/cards";
import { ToolIcon } from "@/components/site/tool-icon";
import { ChevronRight, Info } from "lucide-react";

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) return {};
  const count = toolsByCategory(cat.id).length;
  // Hand-authored per-category metadata (categories.ts) with formula fallbacks.
  const title = cat.metaTitle ?? `${cat.name} Tools — ${count} Free Online`;
  const description =
    cat.metaDescription ??
    `${cat.description} ${count} free ${cat.name.toLowerCase()} tools that run in your browser with zero uploads.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/categories/${cat.slug}` },
    ...socialMeta({
      title,
      description,
      path: `/categories/${cat.slug}`,
    }),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();
  const tools = toolsByCategory(cat.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${cat.name} Tools — PixKitApp`,
        url: `${SITE_URL}/categories/${cat.slug}`,
        description: cat.description,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: tools.length,
          itemListElement: tools.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.name,
            url: `${SITE_URL}/${t.slug}`,
          })),
        },
      },
      {
        // Mirrors the visible breadcrumb above the header (Home → Category).
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: `${cat.name} Tools`,
            item: `${SITE_URL}/categories/${cat.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{cat.name} Tools</span>
      </nav>

      <header className="mb-8 flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${cat.color}`}>
          <ToolIcon name={cat.icon} className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cat.name} Tools</h1>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">{cat.description}</p>
          <p className="mt-1 text-sm font-medium text-primary">{tools.length} free tools</p>
        </div>
      </header>

      {cat.id === "passport" && DOCUMENT_PHOTO_NOTE && (
        <aside
          aria-label="Requirement accuracy note"
          className="mb-8 flex max-w-3xl items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{DOCUMENT_PHOTO_NOTE}</p>
        </aside>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} heading="h2" />
        ))}
      </div>

      <section className="mt-12 border-t pt-8">
        <h2 className="text-lg font-semibold">Other categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.id !== cat.id).map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ToolIcon name={c.icon} className="h-3.5 w-3.5" />
              {c.name} ({TOOLS.filter((t) => t.category === c.id).length})
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
