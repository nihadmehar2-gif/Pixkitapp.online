import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AdSlot } from "@/components/site/ad-slot";
import { PageFade } from "@/components/site/page-fade";
import { SITE_URL } from "@/lib/tools";
import { OG_IMAGES, ROBOTS_DIRECTIVES, IS_PREVIEW } from "@/lib/seo";
import { GA_MEASUREMENT_ID, GA_SPA_TRACKER_SNIPPET } from "@/lib/analytics";
import { CONSENT_DEFAULT_SNIPPET } from "@/lib/consent";

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
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
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
  // Publisher site-verification tag — emitted into <head> on every page
  // as <meta name="..." content="..."> (verification tags are public):
  // - google-adsense-account: AdSense site ownership (account
  //   ca-pub-4279894620173730) — pairs with the ads.txt authorization line
  //   and the AdSense loader below.
  other: {
    "google-adsense-account": "ca-pub-4279894620173730",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c22" },
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {/*
            Google Consent Mode v2 regional defaults — MUST execute before
            any Google tag (the AdSense loader and GA4 below). Rendered as a
            plain inline <script> as the FIRST element of <body>, so the
            browser executes it synchronously during HTML parsing. Ordering
            guarantee (verified against the built HTML):
              1. this consent snippet (inline, parses first in <body>)
              2. the AdSense loader below — plain <script defer>, which the
                 HTML spec executes only after the whole document is parsed,
                 i.e. strictly after every inline script
              3. GA4 gtag.js — next/script afterInteractive, injected after
                 hydration (the initial HTML only contains a preload link).
            Sets consent to "denied" for EEA/UK/CH visitors (personalized ad
            cookies off, GA4 cookieless) and "granted" elsewhere; a
            Google-certified CMP (AdSense → Privacy & messaging, enabled in
            the AdSense account) updates the state through the standard
            gtag('consent','update') mechanism. See src/lib/consent.ts.
          */}
          {!IS_PREVIEW && (
            <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SNIPPET }} />
          )}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to content
          </a>
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
          {/* Google Analytics 4 — official gtag.js snippet via next/script.
              Both scripts load asynchronously (afterInteractive — never
              blocks rendering/LCP). The init inline script is the official
              snippet (dataLayer + gtag('js') + gtag('config')).
              GA_SPA_TRACKER_SNIPPET fires page_view on client-side
              navigations (App Router never reloads the page).
              Rendered only in production indexing mode — preview/staging
              never reports to the production property (see src/lib/seo.ts). */}
          {!IS_PREVIEW && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
              />
              <Script
                id="ga4-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
                }}
              />
              <script dangerouslySetInnerHTML={{ __html: GA_SPA_TRACKER_SNIPPET }} />
            </>
          )}
          {/**
            Google AdSense account loader — the official "Get code" snippet
            from the AdSense account (ca-pub-4279894620173730), rendered as
            a plain <script defer> so it stays in the server-rendered HTML —
            the raw HTML a verification crawler fetches contains it — while
            the defer attribute guarantees it EXECUTES only after the whole
            document is parsed, i.e. strictly after the Consent Mode default
            snippet above. (An async loader would race a cache-hot fetch
            ahead of the consent defaults; defer makes the ordering exact.)
            Rendered only in production indexing mode — preview/staging never
            loads ad scripts. NOTE: this is the only AdSense loader on the
            site; keep the dormant AdSlot system (ad-slot.tsx +
            NEXT_PUBLIC_ADSENSE_* env) disabled while it exists, otherwise
            the AdSense library would load twice.
          */}
          {!IS_PREVIEW && (
            <script
              defer
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4279894620173730"
              crossOrigin="anonymous"
            />
          )}
          {/*
            Runtime hostname guard: on any non-production hostname the
            robots directive is flipped to noindex,nofollow at parse time
            (reuses the existing meta tag, so no duplicates are created).
            Belt-and-braces alongside the build-time env switches and the
            proxy X-Robots-Tag header — see src/proxy.ts.
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
