import type { Metadata } from "next";
import { SITE_URL } from "@/lib/tools";
import { socialMeta } from "@/lib/seo";

const PRIVACY_DESCRIPTION =
  "PixKitApp privacy policy: every image is processed locally in your browser — no uploads, no accounts. Usage is measured with Google Analytics 4; Google AdSense code is installed, with ads pending account approval.";

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
      'PixKitApp ("we", "us", "our") operates www.pixkitapp.online, a suite of free browser-based image tools. This policy explains what data we collect, what we deliberately do not collect, and how the site works technically. The short version: your images are processed entirely on your own device and are never transmitted to our servers.',
      "By using PixKitApp you agree to this policy. If you disagree with any part of it, please discontinue use of the site. This policy describes only www.pixkitapp.online.",
      "Two Google services are integrated on this site. Google Analytics 4 actively measures aggregate site usage (section 4). Google AdSense code is installed (section 6), but ads themselves are not confirmed to be serving yet: the AdSense account is still in review, and the site's consent message is still being configured. Both services are described below exactly as they behave today, including what they load, what they may store, and how consent works in your region.",
    ],
  },
  {
    title: "2. Your images are never uploaded",
    body: [
      "Every tool on PixKitApp — compression, resizing, cropping, conversion, watermarking, metadata inspection, passport photo generation and all others — performs its processing locally in your web browser using the Canvas API and related browser capabilities. When you select or drop an image, the file is read into your browser's memory, processed by JavaScript running on your device, and offered back to you as a download.",
      "At no point is your image file, its contents, or any derivative of it sent to us. You can verify this yourself with your browser's developer tools: process any image and observe that no outbound request carries file data. The site's own tool code never reads image content into any code path that talks to the network, and no third-party script on the site — Google Analytics 4 (section 4) or Google AdSense (section 6) — is wired into the file inputs or the processing code. What we can guarantee is what is observable: no network request made while processing an image contains your file or its contents. We cannot make absolute claims about the internal behavior of third-party scripts we do not control; if you want strict isolation, you can block third-party requests with a content blocker, or process images while offline once a tool page has loaded.",
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
    title: "4. Automatic technical data and Google Analytics 4",
    links: [
      { href: "https://policies.google.com/technologies/partner-sites", label: "How Google uses information from sites or apps that use our services" },
      { href: "https://tools.google.com/dlpage/gaoptout", label: "Google Analytics opt-out browser add-on (tools.google.com/dlpage/gaoptout)" },
    ],
    body: [
      "Like most websites, our hosting provider may record standard server logs — IP address, user-agent, requested URL, timestamp and referrer — for security, abuse prevention and aggregate analytics. These logs relate to page requests only; they never contain your image data because image data is never requested or sent.",
      "We use Google Analytics 4 (Google Ireland Limited / Google LLC; measurement ID G-VXJMF2PERB) to understand aggregate usage of the site — pages and tools viewed, session counts, device and browser type, general geographic region and referrer — so we can improve the website. Google Analytics 4 does not store IP addresses in its standard reporting data. IP information may be processed by Google to derive approximate location and other technical information before being discarded according to Google's processing practices. Google Analytics never receives your images, because images are processed only inside your browser.",
      "Google Analytics sets first-party cookies (such as _ga) to distinguish visits, and loads its script from Google's googletagmanager.com domain. In the EEA, the UK and Switzerland, analytics cookies are disabled by default; until the consent message described in section 6 is activated and you grant measurement consent, Google Analytics runs in those regions in a cookieless measurement mode. You can prevent Google Analytics from collecting your data without affecting any tool — for example with Google's official opt-out browser add-on (also linked below) or a content blocker that filters googletagmanager.com.",
    ],
  },
  {
    title: "5. Cookies and local storage",
    body: [
      "PixKitApp stores one small preference in your browser's local storage: your light/dark theme choice. This preference never leaves your device and is not shared with anyone.",
      "Google Analytics 4 (section 4) sets first-party measurement cookies such as _ga, subject to the consent defaults described in section 6. Google AdSense (section 6) may set advertising cookies or use device identifiers once ads actually serve; in the EEA, the UK and Switzerland those ad cookies are disabled by default and remain off until ad consent is granted — which becomes possible once the consent message described in section 6 is activated. We do not set any advertising cookies of our own, and we use no other third-party analytics or marketing services.",
    ],
  },
  {
    title: "6. Advertising — Google AdSense, and how consent works",
    links: [
      { href: "https://policies.google.com/technologies/ads", label: "How Google uses advertising cookies (policies.google.com/technologies/ads)" },
      { href: "https://adssettings.google.com", label: "Google Ads Settings (adssettings.google.com)" },
      { href: "https://support.google.com/adsense/answer/13554116", label: "Google consent management requirements for serving ads in the EEA, the UK and Switzerland" },
    ],
    body: [
      "PixKitApp is set up for advertising through Google AdSense (Google Ireland Limited / Google LLC; publisher ID ca-pub-4279894620173730, also published in our public ads.txt file). The AdSense loader script (pagead2.googlesyndication.com) is present in the HTML of every page so the site and its ownership can be verified. Loading that script fetches Google's ad library code only — by itself it does not request or display any specific advertisement. Whether ads actually appear depends on Google AdSense account approval, which has not been confirmed at the time of this policy's last update; until ads are confirmed to serve, you will not see advertisements on the site. The page layout keeps space for future ad units in normal document flow — never over image controls or download buttons — but no ad containers are displayed while ad serving is unconfirmed.",
      "Once ads serve, Google and its partners may use cookies or device identifiers to serve and measure them and, depending on your region and consent choices, to personalize them. Where personalization is not permitted, Google's documented behavior is to serve non-personalized ads, which use contextual signals (the page's content) rather than stored interests or cross-site identifiers. This is behavior we configure for but cannot ourselves enforce — it depends on Google's ad systems and on our consent setup being complete.",
      "Consent defaults (implemented in code, verified on this site): this site implements Google Consent Mode v2. For visitors in the EEA, the UK and Switzerland, advertising and measurement cookies are disabled by default — ad_storage, ad_user_data, ad_personalization and analytics_storage all start as denied, and no advertising cookies are written. For visitors in the rest of the world, these consent types default to granted, and you can still opt out with the controls listed below.",
      "Consent management (being configured, not yet active): where personalized ads are served in the EEA, the UK and Switzerland, Google requires a Google-certified consent management platform (CMP) integrated with the IAB Transparency and Consent Framework (TCF). We intend to use Google's own certified CMP, created through the Privacy & messaging tab of our AdSense account. That dashboard configuration is still pending, so no consent message is shown yet. While it is pending, the code-level defaults above already keep advertising and analytics cookies switched off for EEA, UK and Swiss visitors, and ads are not confirmed to serve anywhere. Once the consent message is activated, it will let you accept, reject, or customize which purposes and vendors you allow, offer a privacy-options entry point inside the message to change your decision at any time, store your choice, and apply it on future visits.",
      "You can also manage advertising cookies independently of any consent message: Google Ads Settings (adssettings.google.com) lets you turn off ad personalization for your Google account, www.aboutads.info offers industry opt-outs, and your browser's cookie and tracking controls apply to all sites. Declining consent — or having no message to respond to — never blocks access to any tool: every feature works fully without cookies.",
    ],
  },
  {
    title: "7. Third-party services",
    body: [
      "The complete list of third-party services involved in running this site: Vercel (web hosting and content delivery), Google Analytics 4 (aggregate usage measurement, section 4) and Google AdSense (advertising, section 6). Framework code and fonts are bundled and served from the site's own domain rather than loaded from external font CDNs.",
      "Google's handling of the measurement and advertising data described in sections 4 and 6 — including the roles of controller and processor and any contract terms — is governed by Google's own product terms and privacy policies, which we link to in those sections. We do not share your information with any other third parties for marketing, and there is no image data to share in any case. Google AdSense is the only advertising network integrated on this site, and no other ad scripts load on any page.",
    ],
  },
  {
    title: "8. Children's privacy",
    body: [
      "PixKitApp is suitable for all ages: the image tools do not ask users to provide personal information such as names, email addresses or account details. Google Analytics and Google AdSense may use cookie or device identifiers and related technical information as described in sections 4 and 6, handled according to Google's policies. The site is not directed at children under 13 and we do not knowingly collect personal information from children — the tools have no account system and no upload step.",
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
      "Under regulations such as the GDPR and CCPA, you have rights to access, correct, delete and port your personal data. We do not maintain user accounts, so we hold no user-provided personal data. The website-usage information measured by Google Analytics 4 (section 4) and the advertising data handled by Google AdSense (section 6) are collected and handled by Google according to Google's policies; you can opt out of Google Analytics with the official browser add-on linked in section 4, and manage ad personalization through the consent message once it is activated, through Google Ads Settings and through www.aboutads.info as described in section 6. For any question or request — including deleting correspondence you emailed us — contact pixkitapp1@gmail.com and we will respond within 30 days.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this policy to reflect product or legal changes. The effective date at the top of this page shows the current version. Material changes will be summarized at the top of this page before they take effect.",
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
      <p className="mt-2 text-sm text-muted-foreground">Effective date: November 27, 2026 · Applies to www.pixkitapp.online and all PixKitApp tools.</p>

      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
        <strong>TL;DR:</strong> All {TOOLS_COUNT} tools process images locally in your browser — we never receive, store or see your images. No accounts. Aggregate usage measurement runs via Google Analytics 4 (section 4). Google AdSense code is installed, but ads are pending account approval and are not confirmed to be serving (section 6). In the EEA, the UK and Switzerland, advertising and measurement cookies stay switched off by default, and every tool works fully without cookies either way.
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
                    <a href={l.href} rel="noopener noreferrer" className="text-foreground underline hover:underline">{l.label}</a>
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
