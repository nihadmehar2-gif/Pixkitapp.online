import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AdSlot } from "@/components/site/ad-slot";
import { FloatLayer } from "@/components/site/float-layer";
import { ClickFx } from "@/components/site/click-fx";
import { PageFade } from "@/components/site/page-fade";
import { SITE_URL } from "@/lib/tools";
import { OG_IMAGES, ROBOTS_DIRECTIVES } from "@/lib/seo";

// Body font — warm, modern geometric sans with friendly curves.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Display font for headings — expressive grotesque with an optical-size
// axis, so large headings get tighter, more editorial letterforms.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free Online Image Tools – Compress, Resize & Convert",
    template: "%s | PixKitApp",
  },
  description:
    "Use 127 free online image tools to compress, resize, crop and convert photos right in your browser. Nothing is uploaded — files never leave your device.",
  // No site-wide `keywords` tag: Google ignores meta keywords, and a generic
  // inherited list on every page is metadata noise. Tool pages still emit
  // their own deduplicated, tool-specific keyword lists.
  authors: [{ name: "PixKitApp" }],
  creator: "PixKitApp",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "PixKitApp — Free Online Image Tools",
    description: "127 private, browser-based image tools. No uploads, no signups, no watermarks.",
    url: SITE_URL,
    siteName: "PixKitApp",
    type: "website",
    locale: "en_US",
    images: OG_IMAGES,
  },
  twitter: {
    card: "summary_large_image",
    title: "PixKitApp — Free Online Image Tools",
    description: "127 private, browser-based image tools. No uploads required.",
    images: OG_IMAGES,
  },
  // Preview/staging environments must never be indexable (see src/lib/seo.ts).
  robots: ROBOTS_DIRECTIVES,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1625" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${jakarta.variable} ${bricolage.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to content
          </a>
          {/* Animated aurora lighting layer — purely decorative, behind all
              content, ignores pointer events, honours reduced motion. */}
          <div className="aurora" aria-hidden="true">
            <div className="aurora-blob aurora-blob-1" />
            <div className="aurora-blob aurora-blob-2" />
            <div className="aurora-blob aurora-blob-3" />
          </div>
          {/* Floating photo background layer — real images drifting slowly,
              purely decorative, behind all content, ignores pointer events,
              honours reduced motion. Sits above the aurora wash, below the
              page. */}
          <FloatLayer />
          {/* Click burst effect — decorative, passive listener, honours
              reduced motion. Renders nothing itself. */}
          <ClickFx />
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            {/* Ad container below the header — reserved space, in normal flow. */}
            <AdSlot id="top" className="mt-3" />
            <main id="main-content" className="flex-1">
              {/* Route transition: content fades/rises in on every
                  navigation (see PageFade — key remount replays CSS). */}
              <PageFade>{children}</PageFade>
            </main>
            {/* Ad container before the footer — reserved space, in normal flow. */}
            <AdSlot id="pre-footer" className="mb-6 mt-10" />
            <SiteFooter />
          </div>
          <Toaster />
          {/*
            Runtime hostname guard: on any non-production hostname the
            robots directive is flipped to noindex,nofollow at parse time
            (reuses the existing meta tag, so no duplicates are created).
            Belt-and-braces alongside the build-time env switches and the
            middleware X-Robots-Tag header — see src/middleware.ts.
          */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                'try{if(!/^(www\\.)?pixkitapp\\.online$/.test(location.hostname)){var m=document.querySelector(\'meta[name="robots"]\');if(!m){m=document.createElement("meta");m.setAttribute("name","robots");document.head.appendChild(m)}m.setAttribute("content","noindex, nofollow")}}catch(e){}',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
