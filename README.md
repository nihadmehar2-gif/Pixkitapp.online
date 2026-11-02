# PixKitApp — Free Online Image Toolkit

127 genuinely different, fully working image tools, all processed **100% in the
user's browser** (Canvas API + built-in codecs). No uploads. No accounts. 147
SEO-indexed static pages. Built with Next.js 16 (App Router, SSG), TypeScript,
Tailwind CSS 4 and shadcn/ui.

- Production URL: **https://www.pixkitapp.online** (canonical host — apex
  `pixkitapp.online` and the legacy `pixkitapp.com` domain 308-redirect here,
  see `src/proxy.ts`)
- Every tool has a unique clean URL (e.g. `/image-compressor`, `/webp-to-jpg`,
  `/passport-photo-maker`), a working interface, live preview and download.

---

## 1. Project structure

```
pixkitapp/                        # this repo (deployable to Vercel as-is)
├── src/
│   ├── app/                      # App Router — 147 static routes
│   │   ├── layout.tsx            #   root layout: metadata, theme, header/footer, skip-link
│   │   ├── page.tsx              #   homepage: hero+search, popular tools, 14 categories
│   │   ├── tools/page.tsx        #   all-tools browser (URL-synced search + filters)
│   │   ├── [slug]/page.tsx       #   127 tool pages (SSG, generateStaticParams)
│   │   ├── categories/[category]/page.tsx   # 14 category pages (SSG)
│   │   ├── about/ contact/ privacy/ terms/  # static content pages
│   │   ├── not-found.tsx         #   helpful 404
│   │   ├── sitemap.ts            #   /sitemap.xml — 147 URLs
│   │   ├── robots.ts             #   /robots.txt — allow all + sitemap ref
│   │   └── api/                  #   scaffold health route (unused by tools)
│   ├── components/
│   │   ├── site/                 # header (mobile sheet), footer, search dialog (cmdk),
│   │   │                         # theme provider/toggle, cards, ad-slot.tsx
│   │   ├── tool/                 # ToolWorkspace (standard flow), CropWorkspace
│   │   │                         # (interactive crop/passport), ColorPickerWorkspace,
│   │   │                         # dropzone, option-controls, results, progress/errors
│   │   └── ui/                   # shadcn/ui primitives
│   └── lib/
│       ├── image/                # image engine: loader (validation, 30MB, batch 10),
│       │                         # canvas (encode/download), encoders (BMP/ICO/PDF/
│       │                         # quantizer), metadata (EXIF/PNG chunks)
│       └── tools/                # tool system:
│           ├── types.ts          #   ToolDef schema (options, processor, seo, faq)
│           ├── categories.ts     #   14 categories
│           ├── index.ts          #   registry + search + SEO/FAQ attach
│           ├── definitions/      #   127 tool definitions (6 files by domain)
│           ├── processors/       #   35+ processing functions (7 modules)
│           ├── seo/              #   hand-written unique SEO block per tool
│           ├── faq/generated-faqs.ts  # grounded per-tool FAQs (gen-faqs.ts)
│           └── search-index.ts   # lightweight client search index
├── scripts/                      # build/verify tooling (see §5)
├── db/ prisma/                   # scaffold persistence (site does not require it)
├── next.config.ts                # standalone output + security headers
├── package.json                  # scripts, deps (bun or npm both work)
└── tailwind.config.ts, tsconfig.json, components.json
```

## 2. Installation

```bash
# requires Node 20+ (or Bun 1.1+)
git clone <your-repo-url> pixkitapp && cd pixkitapp
bun install            # or: npm install
```

Environment (optional — site works without any env vars):

```bash
# .env — only needed for the scaffolded prisma health route
DATABASE_URL="file:./db/custom.db"

# AdSense — site ships with clearly-labelled reserved placeholders until set.
# Do NOT invent values; use your real IDs after AdSense approval.
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_HEADER=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_PREFOOTER=1234567890
```

## 3. Build & run

```bash
bun run dev            # dev server → http://localhost:3000
bun run build          # production build (SSG; also copies static/ + public/ into standalone/)
bun run start          # serve the production build (standalone server.js)
bun run lint           # eslint (0 errors/warnings expected)
bunx tsc --noEmit      # typecheck (clean for src/; examples/, skills/ are scaffold dirs)
```

## 4. Vercel deployment

The repo is Vercel-ready: every route is `generateStaticParams` SSG (152 static
pages), no server functions are required by any tool, `output: "standalone"` is
compatible with Vercel's build.

1. Push this repo to GitHub/GitLab/Bitbucket.
2. vercel.com → **Add New → Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected). Build command `bun run build`
   (or default `next build`). Output: default. Node 20.x.
4. Environment variables: add the optional `NEXT_PUBLIC_ADSENSE_*` values here
   (or skip until AdSense is approved).
5. **Deploy.** First build ≈ 1–2 min; all 152 pages prerender.

### Connect www.pixkitapp.online + HTTPS

The production domain is **`www.pixkitapp.online`** — this is the canonical
host every sitemap/robots/canonical/OG URL is derived from (`SITE_URL` in
`src/lib/tools/index.ts`). The apex and the legacy `.com` domain redirect to
it with 308s (proxy-level, `src/proxy.ts`).

1. Vercel project → **Settings → Domains → Add** → `pixkitapp.online`, then
   add `www.pixkitapp.online` and set **www as primary** (apex → www redirect).
2. At your registrar, point DNS per Vercel's instructions:
   - Apex `A` record → `76.76.21.21`
   - `www` `CNAME` → `cname.vercel-dns.com`
3. HTTPS is automatic: Vercel provisions and renews certificates for every
   connected domain — no manual step. Verify the padlock on
   `https://www.pixkitapp.online` after DNS propagates (5 min – 48 h).
4. If the legacy `pixkitapp.com` domain is still owned, add it to the same
   Vercel project and redirect it to `www.pixkitapp.online` (the app already
   308s any legacy host it receives).

### Submit the sitemap to Google Search Console

1. Create/verify the property for `https://www.pixkitapp.online` in
   [search.google.com/search-console](https://search.google.com/search-console)
   (DNS TXT record verification is easiest while adding the domain).
2. **Sitemaps → Add a new sitemap** → enter `sitemap.xml` → Submit.
   (The live file is at `https://www.pixkitapp.online/sitemap.xml` — 147 URLs.)
3. Use **URL Inspection** on key pages (`/`, `/image-compressor`,
   `/webp-to-jpg`, …) → "Request indexing" for the first batch.
4. Revisit Coverage reports over the following weeks. Note: indexing and
   ranking are Google's decisions — submitting the sitemap enables discovery,
   it does not guarantee inclusion or position.

### Test individual URLs

```bash
curl -I https://www.pixkitapp.online/webp-to-jpg     # expect HTTP/2 200
curl -s https://www.pixkitapp.online/sitemap.xml | grep -c "<loc>"   # expect 147
curl -s https://www.pixkitapp.online/robots.txt
# 404 behaviour
curl -o /dev/null -w "%{http_code}\n" https://www.pixkitapp.online/does-not-exist   # 404
# apex + legacy domain must 308-redirect to www
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://pixkitapp.online/
```

## 5. Verification tooling (scripts/)

All runnable locally against a build:

| Script | What it verifies |
|---|---|
| `bun scripts/audit-tools.ts` | every tool has name/H1/description/category/keywords/accept/registered processor/options/guide/SEO/FAQ |
| `bun scripts/gen-faqs.ts` | regenerates grounded FAQs for tools without hand-written ones |
| `python3 scripts/seo-tests.py` | 68 checks: sitemap validity, robots, self-canonicals, single H1, SSR content, noindex absence, 404s, internal links |
| `python3 scripts/check-titles.py` | scans prerendered HTML for duplicate titles/descriptions |
| `node scripts/sweep-all.mjs` | loads all 127 tool pages in Chrome; asserts 200 + H1 + UI mounts + zero console/page errors |
| `node scripts/functional-tests.mjs` | 12 end-to-end flows (upload→process→preview→download) across all workspace types |
| `node scripts/privacy-nav-tests.mjs` | network capture proving zero uploads + refresh/back/forward/404 |
| `node scripts/responsive-ads-tests.mjs` | 375/768/1440 overflow checks + ad-slot overlap measurement |

## 6. Ad slots & privacy design

- Three reserved slots: **below header**, **in-content** (between tool and
  guide / on homepage between sections), **pre-footer**. Each reserves its
  height (100–280px) to avoid layout shift, sits in normal document flow and
  never overlaps controls. With no env vars set, they render **nothing at
  all** (no empty "Advertisement" boxes) and load **zero** third-party code.
- Privacy claims are deliberately precise: images are processed in-browser and
  are never uploaded; the Privacy Policy accurately describes hosting logs,
  theme localStorage, and — in its own section — what activates if/when
  AdSense is enabled (cookies, personalization, opt-outs). No absolute
  "100% private" claims are made anywhere.

## 7. Honest status & remaining manual steps

Code-complete and verified (see worklog for test evidence). Items that require
the site owner, by nature outside the codebase:

1. **Domain + hosting** — `www.pixkitapp.online` is live and canonical; the
   apex 308-redirects to it (§4). If the legacy `pixkitapp.com` domain is
   still owned, point it at the same Vercel project (the app 308s it).
2. **Contact inbox** — all contact references site-wide (Contact/Privacy/
   Terms and the form's mailto action) route to the owner's personal inbox
   **pixkitapp1@gmail.com**; no mailbox provisioning is needed.
3. **AdSense** — apply at google.com/adsense, then set the env vars in §2.
   Placeholders remain until then. Ad placement already complies with flow/
   spacing rules, but AdSense approval itself is Google's decision.
4. **Search Console** — verify property + submit sitemap (§4). Google decides
   if/when pages are indexed and ranked — no guarantee is offered.
5. **Prisma/`/api` route** — inherited from the scaffold; the tools don't use
   it. Harmless in production; removable if you want a smaller dependency tree.
6. **`typescript.ignoreBuildErrors: true`** in next.config.ts (scaffold
   default). `tsc --noEmit` is clean for `src/`, so this is currently inert —
   tighten it to `false` for stricter CI if desired.
