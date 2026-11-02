import type { Metadata } from "next";
import { SITE_URL } from "@/lib/tools";
import { socialMeta } from "@/lib/seo";

const TERMS_DESCRIPTION =
  "PixKitApp terms of service: free tools provided as-is, you retain all rights to your images, fair use rules and liability limits — written in plain language.";

export const metadata: Metadata = {
  title: "PixKitApp Terms of Service — Usage Rules",
  description: TERMS_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/terms` },
  ...socialMeta({
    title: "PixKitApp Terms of Service — Usage Rules",
    description: TERMS_DESCRIPTION,
    path: "/terms",
  }),
};

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: [
      "These Terms of Service (\"Terms\") govern your use of www.pixkitapp.online and all tools offered by PixKitApp (the \"Service\"). By accessing or using the Service you agree to be bound by these Terms. If you do not agree, do not use the Service.",
      "We may revise these Terms from time to time. Continued use after changes are posted constitutes acceptance of the revised Terms. The effective date at the top of this page indicates the current version.",
    ],
  },
  {
    title: "2. The service",
    body: [
      "PixKitApp provides free, browser-based image processing tools — including but not limited to compression, resizing, cropping, format conversion, rotation, filtering, watermarking, metadata inspection, color utilities, transparency tools, social media resizing and passport photo guides. All processing occurs locally in your web browser; the Service does not upload, store or process your images on its servers.",
      "The Service is provided free of charge, without registration. We reserve the right to add, change, suspend or remove any tool or feature at any time without notice.",
    ],
  },
  {
    title: "3. Your images and content",
    body: [
      "You retain full ownership of every image you process and every result you create with the Service. We claim no license, right or interest whatsoever in your files — again, we never receive them.",
      "You represent that you own or have the necessary rights to the images you process, and that your use of the outputs will not infringe the rights of any third party.",
    ],
  },
  {
    title: "4. Acceptable use",
    body: [
      "You agree not to use the Service to process or produce content that is unlawful, harmful, or that infringes intellectual property, privacy or publicity rights. You further agree not to:",
    ],
    bullets: [
      "Attempt to disrupt, overload or reverse the availability of the Service (e.g. automated scraping, denial-of-service, excessive automated requests);",
      "Circumvent, probe or attack the Service's hosting infrastructure;",
      "Misrepresent the Service as your own product, or resell access to it as a hosted solution without written permission;",
      "Use the Service to violate any applicable law or regulation.",
    ],
  },
  {
    title: "5. Passport and official document photos",
    body: [
      "The passport and ID photo tools output images at official published dimensions with visual alignment guides. Requirements vary by country and change over time, and some authorities require photos taken by professional photographers or approved vendors.",
      "Outputs from these tools are provided for convenience only and are not guaranteed to be accepted by any government, agency or institution. You are solely responsible for verifying current official requirements before submitting any document photo.",
    ],
  },
  {
    title: "6. Disclaimer of warranties",
    body: [
      "THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.",
      "We do not warrant that the tools will be uninterrupted, error-free, or that results (file sizes, dimensions, formats, compatibility) will precisely match your requirements in every case. Browser capabilities differ across devices and affect available functionality.",
    ],
  },
  {
    title: "7. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, PixKitApp and its operators shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of data, profits, or business opportunities arising from your use of — or inability to use — the Service, even if advised of the possibility of such damages.",
      "Because processing is local and we hold no copies of your data, we cannot be liable for loss of image files; always keep originals of anything important before processing.",
      "Aggregate liability for any claim relating to the Service shall not exceed one hundred US dollars (US$100) or the amount you paid us in the preceding twelve months, whichever is greater (currently, you pay us nothing).",
    ],
  },
  {
    title: "8. Indemnification",
    body: [
      "You agree to indemnify and hold harmless PixKitApp and its operators from any claim or demand, including reasonable attorneys' fees, arising out of your use of the Service, your processed content, or your violation of these Terms.",
    ],
  },
  {
    title: "9. Third-party links",
    body: [
      "The Service may reference or link to third-party websites. We are not responsible for the content, policies or practices of third parties.",
    ],
  },
  {
    title: "10. Governing law",
    body: [
      "These Terms are governed by the laws of the jurisdiction in which the Service operator is established, without regard to conflict-of-law principles. Any dispute will be resolved in the courts of that jurisdiction, unless mandatory local consumer law grants you a different forum.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "Questions about these Terms: email pixkitapp1@gmail.com or use the contact page on the site.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective date: October 14, 2026 · Applies to www.pixkitapp.online and all PixKitApp tools.</p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
            <div className="mt-2 space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-muted-foreground">{p}</p>
              ))}
              {s.bullets && (
                <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="leading-relaxed">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
