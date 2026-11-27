/** Blog content model — data-driven editorial guides. */

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "callout"; text: string }
  /** Tool links rendered as a small inline card list (internal linking). */
  | { type: "tools"; intro?: string; slugs: string[] }
  /** Links to related guides (back-linking between articles). */
  | { type: "related"; slugs: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description, 140–160 characters. */
  description: string;
  /** Publication date (ISO yyyy-mm-dd) — also used as the sitemap lastmod. */
  date: string;
  /** Coarse topic tag shown on the index. */
  topic: "Formats" | "Guides" | "Privacy" | "Web performance" | "Photos";
  blocks: BlogBlock[];
}
