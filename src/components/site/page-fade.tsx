"use client";

/**
 * Page transition — fades content in with a gentle rise every time the
 * route changes. Works by keying a wrapper div on the pathname: App Router
 * remounts it on navigation, which replays the CSS animation
 * (`.page-fade` in globals.css). Layout (header/footer/ads) persists, so
 * only the content area animates.
 *
 * - Zero dependencies, no exit-animation hacks, SSR-safe.
 * - GPU-only properties (opacity + transform).
 * - Frozen for prefers-reduced-motion via globals.css.
 * - Remounting on navigation matches normal App Router behaviour (page
 *   state never survives navigation anyway), so no behaviour changes —
 *   purely visual.
 */

import { usePathname } from "next/navigation";

export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
