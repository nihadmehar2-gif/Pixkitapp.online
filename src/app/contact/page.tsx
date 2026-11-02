import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { SITE_URL } from "@/lib/tools";
import { socialMeta } from "@/lib/seo";

const CONTACT_DESCRIPTION =
  "Get in touch with the PixKitApp team — feedback, bug reports, tool requests and partnership inquiries are all welcome. We read and reply to every message.";

export const metadata: Metadata = {
  title: "Contact PixKitApp — Feedback & Tool Requests",
  description: CONTACT_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/contact` },
  ...socialMeta({
    title: "Contact PixKitApp — Feedback & Tool Requests",
    description: CONTACT_DESCRIPTION,
    path: "/contact",
  }),
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact PixKitApp</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        Questions, bug reports, tool requests or partnership ideas — we want to hear them. The fastest way to reach the team
        is the form below: it prepares an email draft in your own mail client, so nothing you write passes through a web
        server first. Every message gets read, and we reply as quickly as we can.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { title: "Feedback & ideas", body: "Tell us which tool to build next — user requests drive our roadmap." },
          { title: "Bug reports", body: "Include your browser (e.g. Chrome 130, Android) and what you expected to happen." },
          { title: "Everything else", body: "Press, partnerships, education use — all welcome at pixkitapp1@gmail.com." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">{item.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
