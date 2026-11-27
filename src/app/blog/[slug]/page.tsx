import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { POSTS, getPost, relatedPosts } from "@/lib/blog/posts";
import type { BlogBlock } from "@/lib/blog/types";
import { getTool, SITE_URL } from "@/lib/tools";
import { ToolCard } from "@/components/site/cards";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const ogImage = { url: `/og/blog/${post.slug}.png`, width: 1200, height: 630, alt: post.title };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: "PixKitApp",
      type: "article",
      publishedTime: post.date,
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-8 text-xl font-semibold">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-5 text-base font-semibold">{block.text}</h3>;
    case "p":
      return <p className="mt-3 leading-relaxed text-muted-foreground">{block.text}</p>;
    case "ul":
      return (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted-foreground">
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ol>
      );
    case "table":
      return (
        <figure className="mt-5 overflow-x-auto">
          {block.caption && <figcaption className="mb-2 text-sm font-medium">{block.caption}</figcaption>}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="border-b px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="odd:bg-card">
                  {row.map((cell, j) => (
                    <td key={j} className="border-b px-3 py-2 align-top text-muted-foreground">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
    case "callout":
      return (
        <aside className="mt-5 rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm leading-relaxed text-foreground">
          {block.text}
        </aside>
      );
    case "tools": {
      const tools = block.slugs.map((s) => getTool(s)).filter(Boolean);
      if (tools.length === 0) return null;
      return (
        <div className="mt-5 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">{block.intro ?? "Tools for this job:"}</p>
          <ul className="mt-2 space-y-1.5">
            {tools.map((t) => (
              <li key={t!.slug}>
                <Link
                  href={`/${t!.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t!.name} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "related": {
      const posts = block.slugs.map((s) => getPost(s)).filter(Boolean);
      if (posts.length === 0) return null;
      return (
        <div className="mt-8 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Related guides:</p>
          <ul className="mt-2 space-y-1.5">
            {posts.map((p) => (
              <li key={p!.slug}>
                <Link
                  href={`/blog/${p!.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {p!.title} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    default:
      return null;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = relatedPosts(slug);
  const wordCount = post.blocks
    .map((b) => {
      if (b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "callout") return b.text.split(/\s+/).length;
      if (b.type === "ul" || b.type === "ol") return b.items.join(" ").split(/\s+/).length;
      if (b.type === "table") return b.rows.flat().join(" ").split(/\s+/).length;
      return 0;
    })
    .reduce((a, b) => a + b, 0);

  // Truthful structured data: dates and word counts reflect the actual article.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        url: `${SITE_URL}/blog/${post.slug}`,
        mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        wordCount,
        author: { "@type": "Organization", name: "PixKitApp", url: SITE_URL },
        publisher: { "@type": "Organization", name: "PixKitApp", url: SITE_URL },
        image: `${SITE_URL}/og/blog/${post.slug}.png`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
        ],
      },
    ],
  };

  const toolBlocks = post.blocks.filter((b): b is Extract<BlogBlock, { type: "tools" }> => b.type === "tools");
  const linkedTools = [...new Set(toolBlocks.flatMap((b) => b.slugs))].map((s) => getTool(s)).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="inline-block py-2.5 -my-2.5 px-1.5 -mx-1.5 hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/blog" className="inline-block py-2.5 -my-2.5 px-1.5 -mx-1.5 hover:text-foreground">Blog</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate text-foreground">{post.title}</span>
      </nav>

      <article>
        <header>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2 py-0.5">{post.topic}</span>
            <time dateTime={post.date} className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{post.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
        </header>

        <div>
          {post.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      </article>

      {linkedTools.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Tools used in this guide</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {linkedTools.slice(0, 6).map((t) => (
              <ToolCard key={t!.slug} tool={t!} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold">Keep reading</h2>
          <ul className="mt-3 space-y-2">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline">
                  {p.title} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
