import type { Metadata } from "next";
import { SITE_URL } from "@/lib/tools";
import { socialMeta } from "@/lib/seo";

const PRIVACY_DESCRIPTION =
  "PixKitApp privacy policy: every image is processed locally in your browser — no uploads, no accounts. Usage is measured with Google Analytics 4.";

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

type PolicyLink = { href: string; label: string };
type PolicySection = { title: string; body: string[]; links?: PolicyLink[] };

const SECTIONS: PolicySection[] = [
  {
    title: "1. Overview",
    body: [
      "PixKitApp (\"we\", \"us\", \"our\") operates www.pixkitapp.online, a suite of free browser-based image tools. This policy explains what data we collect, what we deliberately do not collect, and how the site works technically. The short version: your images are processed entirely on your own device and are never transmitted to our servers.",
      "By using PixKitApp you agree to this policy. If you disagree with any part of it, please discontinue use of the site. This policy describes only www.pixkitapp.online. One third-party service is active today: Google Analytics 4, which measures aggregate site usage and is described in section 4. Advertising (section 6) is planned but not yet enabled — if we enable it, this policy will be updated first.",
    ],
  },
  {
    title: "2. Your images are never uploaded",
    body: [
      "Every tool on PixKitApp — compression, resizing, cropping, conversion, watermarking, metadata inspection, passport photo generation and all others — performs its processing locally in your web browser using the Canvas API and related browser capabilities. When you select or drop an image, the file is read into your browser's memory, processed by JavaScript running on your device, and offered back to you as a download.",
      "At no point is your image file, its contents, or any derivative of it sent to us. You can verify this yourself with your browser's developer tools: process any image and observe that no outbound request carries file data. No script on the site — including Google Analytics 4 (section 4) and any advertising we enable later (section 6) — has access to your image files, because image data exists only inside your browser's memory.",
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
    links: [
      { href: "https://policies.google.com/technologies/partner-sites", label: "How Google uses information from sites or apps that use our services" },
      { href: "https://tools.google.com/dlpage/gaoptout", label: "Google Analytics opt-out browser add-on (tools.google.com/dlpage/gaoptout)" },
    ],
    body: [
      "Like most websites, our hosting provider may record standard server logs — IP address, user-agent, requested URL, timestamp and referrer — for security, abuse prevention and aggregate analytics. These logs relate to page requests only; they never contain your image data because image data is never requested or sent.",
      "We use Google Analytics 4 (Google Ireland Limited / Google LLC; measurement ID G-VXJMF2PERB) to understand aggregate usage of the site — pages and tools viewed, session counts, device and browser type, general geographic region and referrer — so we can improve the website. Google Analytics 4 does not store IP addresses in its standard reporting data. IP information may be processed by Google to derive approximate location and other technical information before being discarded according to Google's processing practices. Google Analytics never receives your images, because images are processed only inside your browser.",
      "Google Analytics sets first-party cookies (such as _ga) to distinguish visits, and loads its script from Google's googletagmanager.com domain. Google may use cookie or device identifiers and related technical information to measure website usage and improve the service; this information is handled by Google according to Google's policies, described in Google's official explainer linked below. You can prevent Google Analytics from collecting your data without affecting any tool — for example with Google's official opt-out browser add-on (also linked below) or a content blocker that filters googletagmanager.com. We do not currently operate a cookie-consent banner; where local law requires a consent choice for measurement cookies, we will surface one. Appropriate cookie/consent controls will be implemented where required before any advertising or personalized advertising is enabled.",
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
      "Today the site is served through standard web hosting and content delivery infrastructure (Vercel). Fonts and framework code are bundled and served from the site's own domain rather than loaded from external font CDNs. Google, as the provider of Google Analytics 4 described in section 4, acts as a processor for the aggregate usage data it measures on our behalf. We do not share your information with third parties for marketing, and there is no image data to share in any case.",
      "If advertising is enabled later, the provider named in section 6 will become an additional third-party processor for the specific data it collects (for example, ad-serving cookies) — but never for your images.",
    ],
  },
  {
    title: "8. Children's privacy",
    body: [
      "PixKitApp is suitable for all ages: the image tools do not ask users to provide personal information such as names, email addresses or account details. Google Analytics may use cookie or device identifiers and related technical information to measure website usage and improve the service; this information is handled by Google according to Google's policies. The site is not directed at children under 13 and we do not knowingly collect personal information from children — the tools have no account system and no upload step.",
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
      "Under regulations such as the GDPR and CCPA, you have rights to access, correct, delete and port your personal data. We do not maintain user accounts, so we hold no user-provided personal data. The website-usage information measured by Google Analytics 4 (section 4) — including cookie or device identifiers — is collected and handled by Google according to Google's policies; you can opt out of Google Analytics with the official browser add-on linked in section 4. For any question or request — including deleting correspondence you emailed us — contact pixkitapp1@gmail.com and we will respond within 30 days.",
      "If and when advertising cookies become active, the ad provider's own opt-out tools (such as Google Ads Settings and www.aboutads.info) will also be available to you, in addition to any consent interface we are required to offer in your region.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this policy to reflect product or legal changes. The effective date at the top of this page shows the current version. Material changes — especially enabling advertising — will be summarized at the top of this page before they take effect.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "Questions about this policy or about how PixKitApp works: email pixkitapp1@gmail.com or use the contact page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective date: November 2, 2026 · Applies to www.pixkitapp.online and all PixKitApp tools.</p>

      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
        <strong>TL;DR:</strong> All {TOOLS_COUNT} tools process images locally in your browser — we never receive, store or see your images. No accounts. Aggregate usage measurement via Google Analytics 4 is active (section 4) — it measures page views and device type, never your images. No ads are shown today; section 6 explains exactly what will change
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
            {s.links && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} rel="noopener noreferrer" className="text-primary hover:underline">{l.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

const TOOLS_COUNT = 127;
