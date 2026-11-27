import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, ShieldCheck } from "lucide-react";
import { POSTS } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Blog — Image Guides & Practical Tutorials",
  description:
    "Practical guides for image formats, upload limits, passport photos, privacy metadata and web performance — written for the tools you can run right here.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "PixKitApp Blog — Image Guides & Practical Tutorials",
    description: "Practical guides for formats, upload limits, passport photos, privacy and web performance.",
    url: `${SITE_URL}/blog`,
    siteName: "PixKitApp",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og/blog/index.png", width: 1200, height: 630, alt: "PixKitApp blog — image guides" }],
  },
};

export default function BlogIndex() {
  // Blog + ItemList schema — truthful: every listed post exists and links correctly.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "PixKitApp Blog",
        url: `${SITE_URL}/blog`,
        description: "Practical image guides: formats, upload limits, passport photos, privacy metadata and web performance.",
      },
      {
        "@type": "ItemList",
        itemListElement: POSTS.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.title,
          url: `${SITE_URL}/blog/${p.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" aria-hidden="true" /> Blog
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Image guides &amp; practical tutorials</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Deep, honest guides for the jobs the tools on this site handle: picking formats, hitting upload
          limits, preparing passport photos, protecting your privacy and speeding up pages. Every guide
          links to the exact tools it describes — and every tool runs entirely in your browser.
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Nothing you read here requires an upload — the tools process your images on your device.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {POSTS.map((post) => (
          <article key={post.slug} className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-0.5">{post.topic}</span>
              <time dateTime={post.date} className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            <h2 className="mt-3 text-lg font-semibold leading-snug">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.description}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground"
            >
              Read the guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
