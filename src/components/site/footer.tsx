import Link from "next/link";
import { PixKitLogo } from "./logo";
import { CATEGORIES } from "@/lib/tools/categories";
import { TOOLS } from "@/lib/tools";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto">
      <div className="bg-card border-t">
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
                  <Link href={`/categories/${cat.slug}`} className="inline-flex min-h-[36px] items-center hover:text-foreground">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Popular Tools</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {["image-compressor", "image-resizer", "crop-image", "webp-to-jpg", "image-to-pdf", "passport-photo-maker"].map((slug) => (
                <li key={slug}>
                  <Link href={`/${slug}`} className="inline-flex min-h-[36px] items-center hover:text-foreground">
                    {TOOLS.find((t) => t.slug === slug)?.name ?? slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li><Link href="/about" className="inline-flex min-h-[36px] items-center hover:text-foreground">About Us</Link></li>
              <li><Link href="/contact" className="inline-flex min-h-[36px] items-center hover:text-foreground">Contact</Link></li>
              <li><Link href="/privacy" className="inline-flex min-h-[36px] items-center hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="inline-flex min-h-[36px] items-center hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/tools" className="inline-flex min-h-[36px] items-center hover:text-foreground">All {TOOLS.length} Tools</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} PixKitApp · www.pixkitapp.online — All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
            Images are processed in your browser — never uploaded
          </p>
        </div>
      </div>
      </div>
    </footer>
  );
}
