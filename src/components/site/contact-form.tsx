"use client";

import { useState } from "react";
import { Mail, MessageSquare, Bug, Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "feedback", label: "General feedback", icon: MessageSquare },
  { id: "bug", label: "Report a bug", icon: Bug },
  { id: "idea", label: "Tool request", icon: Lightbulb },
];

export function ContactForm() {
  const [type, setType] = useState("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
    if (message.trim().length < 10) return setError("Please write at least a sentence (10+ characters).");

    // Compose a mailto — nothing is transmitted over the web; your email client sends it.
    const subject = `[PixKitApp ${type}] ${message.slice(0, 60).replace(/\s+/g, " ")}`;
    const body = `${message}\n\n—\nName: ${name}\nEmail: ${email}\nSent from www.pixkitapp.online contact page`;
    window.location.href = `mailto:pixkitapp1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-xl font-semibold">Your email draft is ready</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          We opened your email client with the message pre-filled — just hit send. This keeps the process
          fully private: no contact data passes through our site.
        </p>
        <button
          onClick={() => { setSent(false); setMessage(""); }}
          className="mt-5 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border bg-card p-6">
      <div>
        <Label className="mb-2 block">What&apos;s this about?</Label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors",
                type === id ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" maxLength={120} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-message">Message</Label>
        <Textarea
          id="c-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you love, what's broken, or what tool you wish existed…"
          rows={6}
          maxLength={4000}
        />
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto sm:px-8"
      >
        <Send className="h-4 w-4" /> Open email draft
      </button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        This form composes an email in your own mail client — PixKitApp servers never receive your message or contact details.
        You can also reach us directly at <span className="inline-flex items-center gap-1 font-medium text-foreground"><Mail className="h-3.5 w-3.5" /> pixkitapp1@gmail.com</span>.
      </p>
    </form>
  );
}
