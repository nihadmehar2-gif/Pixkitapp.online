"use client";

/**
 * Click burst effect — every pointer press anywhere on the site spawns a
 * short glowing burst at the cursor: an expanding ring, a soft radial
 * flash and eight flying sparks in the Aurora Glass palette.
 *
 * Constraints:
 * - Purely decorative: aria-hidden overlay, pointer-events: none, and the
 *   listener is passive (no preventDefault), so interactions never change.
 * - Zero dependencies: hand-rolled DOM nodes + CSS keyframes
 *   (`.click-fx-*` in globals.css), removed ~0.9 s after spawn.
 * - Honours prefers-reduced-motion: checked live on every event and
 *   additionally hidden via CSS.
 * - GPU-only animation (transform + opacity).
 */

import { useEffect } from "react";

/** Spark colours: violet, cyan, pink, amber — matches the theme accents. */
const SPARK_COLORS = [
  "oklch(0.82 0.16 305)",
  "oklch(0.82 0.14 210)",
  "oklch(0.84 0.14 350)",
  "oklch(0.86 0.13 85)",
];

const SPARK_COUNT = 8;
const FX_LIFETIME_MS = 900;

export function ClickFx() {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      // Live check so users who change their OS motion setting mid-session
      // get the calmer experience without a reload.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const fx = document.createElement("span");
      fx.className = "click-fx";
      fx.setAttribute("aria-hidden", "true");
      fx.style.left = `${event.clientX}px`;
      fx.style.top = `${event.clientY}px`;

      const ring = document.createElement("span");
      ring.className = "click-fx-ring";
      const glow = document.createElement("span");
      glow.className = "click-fx-glow";
      fx.append(ring, glow);

      for (let i = 0; i < SPARK_COUNT; i++) {
        const spark = document.createElement("span");
        spark.className = "click-fx-spark";
        // Evenly spread angles with a little jitter so bursts look organic.
        const angle = (Math.PI * 2 * i) / SPARK_COUNT + Math.random() * 0.6;
        const distance = 26 + Math.random() * 20;
        spark.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
        spark.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
        spark.style.setProperty("--spark", SPARK_COLORS[i % SPARK_COLORS.length]);
        spark.style.setProperty("--fly-t", `${(0.5 + Math.random() * 0.25).toFixed(2)}s`);
        fx.append(spark);
      }

      document.body.append(fx);
      window.setTimeout(() => fx.remove(), FX_LIFETIME_MS);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
