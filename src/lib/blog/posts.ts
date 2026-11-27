/** Blog registry — merges the post data files, sorted by date (newest first). */

import type { BlogPost } from "./types";
import { POSTS_A } from "./posts-a";
import { POSTS_B } from "./posts-b";

export const POSTS: BlogPost[] = [...POSTS_A, ...POSTS_B].sort((a, b) =>
  b.date.localeCompare(a.date)
);

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Other posts, closest topic first, for the "related guides" links. */
export function relatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPost(slug);
  if (!current) return POSTS.slice(0, limit);
  return [
    ...POSTS.filter((p) => p.slug !== slug && p.topic === current.topic),
    ...POSTS.filter((p) => p.slug !== slug && p.topic !== current.topic),
  ].slice(0, limit);
}

export type { BlogPost, BlogBlock } from "./types";
