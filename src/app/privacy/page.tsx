import type { Metadata } from "next";
import { SITE_URL } from "@/lib/tools";
import { socialMeta } from "@/lib/seo";

const PRIVACY_DESCRIPTION =
  "PixKitApp privacy policy: every image is processed locally in your browser — no uploads, no accounts, no tracking. Read exactly what we do and do not collect.";

export const metadata: Metadata = {
  title: "Privacy Policy — Zero-Upload Image Processing",
  description: PRIVACY_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/privacy` },
  ...socialMeta({
    title: "Privacy Policy — Zero-Upload Image Processing",
    description: PRIVACY_DESCRIPTION,
    path: "/privacy",
  }),
};

const SECTIONS = [
  {
    title: "1. Overview",
    body: [
      "PixKitApp (\"we\", \"us\", \"our\") operates www.pixkitapp.online, a suite of free browser-based image tools. This policy explains what data we collect, what we deliberately do not collect, and how the site works technically. The short version: your images are processed entirely on your own device and are never transmitted to our servers.",
      "By using PixKitApp you agree to this policy. If you disagree with any part of it, please discontinue use of the site. This policy describes only www.pixkitapp.online; it does not cover third-party services that load only after we enable them, which we describe in sections 4, 6 and 7 and will update before doing so.",
    ],
  },
  {
    title: "2. Your images are never uploaded",
    body: [
      "Every tool on PixKitApp — compression, resizing, cropping, conversion, watermarking, metadata inspection, passport photo generation and all others — performs its processing locally in your web browser using the Canvas API and related browser capabilities. When you select or drop an image, the file is read into your browser's memory, processed by JavaScript running on your device, and offered back to you as a download.",
      "At no point is your image file, its contents, or any derivative of it sent to us. You can verify this yourself with your browser's developer tools: process any image and observe that no outbound request carries file data. If we later enable third-party advertising or analytics scripts (see sections 6 and 7), those scripts will still have no access to your image files, because image data exists only inside your browser's memory.",
      "Because of this architecture, we cannot access, view, store, share, or lose your images — they never exist on our systems. If you close the tab before downloading a result, the processed data is gone; we have no copy.",
    ],
  },
  {
    title: "3. Information we do not collect",
    body: [
      "We do not require accounts, and we do not collect names, email addresses, payment details or identity documents through normal use of the tools. We do not scan, hash, fingerprint or analyze the content of images you process.",
      "The contact page composes an email in your own mail client; if you choose to send us email, we receive whatever you choose to include, and we use it only to respond to you.",
    ],
  },
  {
    title: "4. Automatic technical data",
    body: [
      "Like most websites, our hosting provider may record standard server logs — IP address, user-agent, requested URL, timestamp and referrer — for security, abuse prevention and aggregate analytics. These logs relate to page requests only; they never contain your image data because image data is never requested or sent.",
      "We use Google Analytics 4 (Google Ireland Limited / Google LLC) to understand aggregate usage of the site — pages viewed, session counts, device and browser type, general geographic region and referrer. GA4 does not log or store your IP address, and it never receives your images, because images are processed only inside your browser.",
      "Google Analytics uses first-party cookies (such as _ga) to distinguish visits and can be disabled without affecting any tool: you can opt out with Google's official browser add-on (tools.google.com/dlpage/gaoptout) or your browser's cookie / Do Not Track settings. Where local law requires a consent choice for measurement cookies, we will surface it.",
    ],
  },
  {
    title: "5. Cookies and local storage",
    body: [
      "PixKitApp stores one small preference in your browser's local storage: your light/dark theme choice. This preference never leaves your device and is not shared with anyone.",
      "We do not set advertising cookies of our own. Google Analytics 4 (section 4) sets first-party measurement cookies such as _ga for the aggregate usage measurement described above. If advertising is enabled in the future (see section 6), the advertising provider may set its own cookies — that will be disclosed here before it happens, together with any legally required consent mechanisms.",
    ],
  },
  {
    title: "6. Advertising (planned, not yet active)",
    body: [
      "PixKitApp is designed to be supported by advertising. While advertising is not enabled, pages show no visible ad space at all — ad slots stay fully collapsed instead of displaying empty placeholders — and no third-party ad scripts are loaded, no ad cookies are set, and no ad-related data is collected.",
      "When we enable advertising, we plan to use Google AdSense. For transparency, here is what that will mean, based on Google's published documentation: Google and its partners may use cookies or device identifiers to serve and measure ads, and, depending on your region and your consent choices, to personalize the ads you see. Google's use of advertising cookies enables it and its partners to serve ads based on your visits to this and other sites. You can opt out of personalized advertising in Google Ads Settings (adssettings.google.com), and regional rules such as the EU/UK GDPR and CCPA may give you additional choices that we will surface as required.",
      "We will not place ads over image controls or download buttons, disguise ads as tools, or design placements to encourage accidental clicks. This policy will be updated with the effective date when advertising goes live, and this section will always name the providers actually in use.",
    ],
  },
  {
    title: "7. Third-party services",
    body: [
      "Today the site is served through standard web hosting and content delivery infrastructure. Fonts and framework code may be delivered by CDN providers under their own technical logs. We do not share your information with third parties for marketing, and there is no image data to share in any case.",
      "Google, as the provider of Google Analytics 4 described in section 4, acts as a processor for the aggregate usage data it measures on our behalf. If advertising is enabled later, the provider named in section 6 will become an additional third-party processor for the specific data it collects (for example, ad-serving cookies) — but never for your images.",
    ],
  },
  {
    title: "8. Children's privacy",
    body: [
      "PixKitApp is suitable for all ages precisely because normal tool usage collects no personal data. The site is not directed at children under 13 and we do not knowingly collect personal information from children — there is simply no mechanism to do so through normal tool usage.",
    ],
  },
  {
    title: "9. Data security",
    body: [
      "The most secure data is data we never have. Beyond that architectural advantage, the site is served exclusively over HTTPS, and we keep dependencies updated to address security advisories promptly.",
      "Please note that no method of transmission over the Internet is 100% secure. Since your images stay on your device, the security of your files depends primarily on your own device and browser hygiene.",
    ],
  },
  {
    title: "10. Your rights",
    body: [
      "Under regulations such as the GDPR and CCPA, you have rights to access, correct, delete and port your personal data. Because we do not maintain user databases, there is generally no personal data held by us to act upon. For any question or request — including deleting correspondence you emailed us — contact nihadmehar2@gmail.com and we will respond within 30 days.",
      "If and when advertising cookies become active, the ad provider's own opt-out tools (such as Google Ads Settings and www.aboutads.info) will also be available to you, in addition to any consent interface we are required to offer in your region.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this policy to reflect product or legal changes. The effective date below shows the current version. Material changes — especially enabling analytics or advertising — will be summarized at the top of this page before they take effect.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "Questions about this policy or about how PixKitApp works: email nihadmehar2@gmail.com or use the contact page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective date: November 2, 2026 (updated when Google Analytics 4 was added) · Applies to www.pixkitapp.online and all PixKitApp tools.</p>

      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
        <strong>TL;DR:</strong> All {TOOLS_COUNT} tools process images locally in your browser — we never receive, store or see your images. No accounts. Aggregate usage measurement via Google Analytics 4 is active (section 4) — it measures page views and device type, never your images. Ad containers on the page are reserved placeholders; section 6 explains exactly what will change
        if we enable advertising.
      </div>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
            <div className="mt-2 space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-muted-foreground">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

const TOOLS_COUNT = 127;
