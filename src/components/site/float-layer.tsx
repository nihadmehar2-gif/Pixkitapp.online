/**
 * Floating photo background layer — real photographic images drifting
 * slowly behind all content, framed as rounded cards with a soft glow.
 *
 * Design constraints:
 * - Purely decorative: aria-hidden, pointer-events: none, z-index behind
 *   the page (see `.float-field` in globals.css).
 * - Zero JS / zero hydration: server component, no state, no effects.
 * - Tiny payload: six ~300px WebP photos totalling ~75 KB in /public/floating.
 * - GPU-only animation (transform + opacity) via CSS keyframes; frozen
 *   under prefers-reduced-motion; heaviest items hidden on small screens.
 * - Depth illusion: far = blurred + dim, mid = slight blur, near = crisp
 *   with glow, so the layer reads as gentle parallax space.
 */

import type { CSSProperties } from "react";

type FloatStyle = CSSProperties & Record<"--rot" | "--dur", string | undefined>;

/** A real photo framed as a rounded card (plain <img>, lint-exempt once). */
function FloatImg({
  src,
  width,
  className,
  style,
}: {
  src: string;
  width: number;
  className: string;
  style: FloatStyle;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
      width={width}
      height={width}
      className={className}
      style={{ ...style, width }}
    />
  );
}

export function FloatLayer() {
  return (
    <div className="float-field" aria-hidden="true">
      {/* --- Real photos, drifting like weightless prints --- */}
      <FloatImg
        src="/floating/f1.webp"
        width={124}
        className="float-img float-item float-mid float-drift-a"
        style={{ left: "4%", top: "12%", "--rot": "-8deg", "--dur": "28s", animationDelay: "-4s" }}
      />
      <FloatImg
        src="/floating/f2.webp"
        width={96}
        className="float-img float-item float-far float-drift-b"
        style={{ right: "6%", top: "18%", "--rot": "7deg", "--dur": "32s", animationDelay: "-14s" }}
      />
      <FloatImg
        src="/floating/f3.webp"
        width={140}
        className="float-img float-item float-near float-drift-c float-hide-sm"
        style={{ left: "8%", bottom: "8%", "--rot": "5deg", "--dur": "26s", animationDelay: "-7s" }}
      />
      <FloatImg
        src="/floating/f4.webp"
        width={84}
        className="float-img float-item float-far float-drift-a float-hide-sm"
        style={{ right: "14%", bottom: "12%", "--rot": "-10deg", "--dur": "34s", animationDelay: "-21s" }}
      />
      <FloatImg
        src="/floating/f5.webp"
        width={110}
        className="float-img float-item float-mid float-drift-b"
        style={{ right: "3%", top: "56%", "--rot": "9deg", "--dur": "27s", animationDelay: "-9s" }}
      />
      <FloatImg
        src="/floating/f6.webp"
        width={80}
        className="float-img float-item float-mid float-drift-c float-hide-sm"
        style={{ left: "22%", top: "4%", "--rot": "-6deg", "--dur": "30s", animationDelay: "-3s" }}
      />

      {/* --- Two soft glow orbs for depth (no icons, no confetti) --- */}
      <span
        className="float-item float-dot float-tw"
        style={{ left: "14%", top: "68%", width: 10, height: 10, "--dur": "7s" } as CSSProperties}
      />
      <span
        className="float-item float-dot float-tw float-hide-sm"
        style={{ right: "10%", top: "36%", width: 12, height: 12, "--dur": "8s", animationDelay: "1.4s" } as CSSProperties}
      />
    </div>
  );
}
