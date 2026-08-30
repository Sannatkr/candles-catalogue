"use client";

import { useEffect, useState } from "react";

/**
 * A short burst of paper, in the shop's own colours. Hand-rolled rather than a
 * library: it is thirty absolutely-positioned divs and a keyframe, which is far
 * less than any dependency would cost, and it keeps the page self-contained.
 *
 * It renders nothing at all for a visitor who has asked for less motion — the
 * celebration is decoration, and decoration is the first thing that should go.
 */

const COLOURS = ["#b45f2b", "#d98b4a", "#e5c07b", "#3d5730", "#c0392b", "#f0d9b5"];
const PIECES = 30;

export function Confetti({ fire }: { fire: number }) {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (reduced || !fire) return null;

  return (
    <span
      key={fire}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center overflow-visible"
    >
      {Array.from({ length: PIECES }, (_, i) => {
        // Deterministic spread — no Math.random, so the server and the client
        // never disagree about where a piece starts.
        const angle = (i / PIECES) * 2 - 1;
        const drift = Math.round(angle * 190);
        const delay = (i % 6) * 45;
        const spin = i % 2 ? 420 : -380;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={
              {
                background: COLOURS[i % COLOURS.length],
                animationDelay: `${delay}ms`,
                borderRadius: i % 3 === 0 ? "50%" : "1px",
                "--drift": `${drift}px`,
                "--spin": `${spin}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
