import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS, SITE_URL } from "@/lib/tools";
import { socialMeta } from "@/lib/seo";
import { ShieldCheck, Zap, Heart, Mail, Globe, Lock } from "lucide-react";

const ABOUT_DESCRIPTION =
  "Learn about PixKitApp — 127 free, private, browser-based image tools. Our mission: powerful image processing with zero uploads and zero privacy trade-offs.";

export const metadata: Metadata = {
  title: "About PixKitApp — Free, Private Image Tools",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/about` },
  ...socialMeta({
    title: "About PixKitApp — Free, Private Image Tools",
    description: ABOUT_DESCRIPTION,
    path: "/about",
  }),
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About PixKitApp</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-muted-foreground">
        <p>
          PixKitApp is a collection of <strong className="text-foreground">{TOOLS.length} free image tools</strong> built on a simple
          belief: you shouldn&apos;t have to upload your photos to a stranger&apos;s server just to resize, compress, or convert them.
          Every tool on this site runs entirely inside your browser using the HTML5 Canvas API, the browser's built-in image codecs, and
          modern JavaScript — your images never touch our infrastructure, because there is no upload infrastructure at all.
        </p>
        <p>
          The project started when we noticed how most &quot;free online image tools&quot; work: you hand over your photos, wait for a
          round trip to a datacenter, and hope the file gets deleted. Family photos, ID documents, business assets — all transmitted
          for a task a modern browser can do instantly. We built PixKitApp to prove that model is obsolete. Processing happens at
          your device&apos;s full speed with no upload round-trip, and keeps confidential material (passports, contracts, medical
          scans) exactly where it belongs: with you.
        </p>
        <p>
          The toolkit spans {TOOLS.length} genuinely different tools across 14 categories — compression with exact target sizes,
          pixel-precise resizing, an interactive crop editor, format conversion including PDF and ICO, watermarking, filters,
          EXIF inspection and stripping, color analysis, transparency work, social-media presets and passport photo guides with
          official dimensions. Each tool is purpose-built rather than a re-skin, and each works on phones, tablets, Chromebooks
          and desktops.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          { icon: ShieldCheck, title: "Private by architecture", body: "No uploads, no accounts — and nothing about your images is collected, because processing happens entirely on your device. Privacy isn't a policy here; it's how the software works." },
          { icon: Zap, title: "Fast by design", body: "No waiting for uploads or server queues. A 30MB photo compresses in about a second on a typical laptop." },
          { icon: Globe, title: "Free & open access", body: "Every tool is free with no signup, no watermark and no daily limit. Built to be linked, shared and used." },
          { icon: Lock, title: "No upload infrastructure", body: "Image files are never transmitted anywhere — there is no upload step to secure, breach or wait for. (Pages still load from the web like any other site; the processing itself happens entirely on your device.)" },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Heart className="h-5 w-5 text-primary" /> How it&apos;s made
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          PixKitApp is built with Next.js, TypeScript and Tailwind CSS, and is designed to deploy to edge platforms like Vercel
          where the whole site is served as static files. The processing engines — from the median-cut color quantizer to the
          multi-page PDF writer — are hand-built TypeScript that runs in your browser process. You can verify the no-upload claim
          with your browser&apos;s network inspector: load a tool, process an image, and watch zero outbound requests carry your data.
        </p>
      </div>

      <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Link href="/tools" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
          Explore all {TOOLS.length} tools
        </Link>
        <Link href="/contact" className="inline-flex h-12 items-center gap-2 rounded-lg border px-6 font-medium hover:bg-accent">
          <Mail className="h-4 w-4" /> Get in touch
        </Link>
      </div>
    </div>
  );
}
