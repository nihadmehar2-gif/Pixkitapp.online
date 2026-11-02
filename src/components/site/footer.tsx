import Link from "next/link";
import { PixKitLogo } from "./logo";
import { CATEGORIES } from "@/lib/tools/categories";
import { TOOLS } from "@/lib/tools";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
      <div className="bg-card/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <PixKitLogo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {TOOLS.length} free image tools that run entirely in your browser. No uploads, no signups, no watermarks — your photos stay on your device.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Categories</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="inline-flex min-h-[36px] items-center hover:text-primary">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Popular Tools</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {["image-compressor", "image-resizer", "crop-image", "webp-to-jpg", "image-to-pdf", "passport-photo-maker"].map((slug) => (
                <li key={slug}>
                  <Link href={`/${slug}`} className="inline-flex min-h-[36px] items-center hover:text-primary">
                    {TOOLS.find((t) => t.slug === slug)?.name ?? slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li><Link href="/about" className="inline-flex min-h-[36px] items-center hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="inline-flex min-h-[36px] items-center hover:text-primary">Contact</Link></li>
              <li><Link href="/privacy" className="inline-flex min-h-[36px] items-center hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="inline-flex min-h-[36px] items-center hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/tools" className="inline-flex min-h-[36px] items-center hover:text-primary">All {TOOLS.length} Tools</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} PixKitApp · www.pixkitapp.online — All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_2px_oklch(0.72_0.19_160/0.7)] motion-reduce:shadow-none" aria-hidden="true" />
            Images are processed in your browser — never uploaded
          </p>
        </div>
      </div>
      </div>
    </footer>
  );
}
