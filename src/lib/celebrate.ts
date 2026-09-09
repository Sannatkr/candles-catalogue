/**
 * The celebration when an order earns free delivery.
 *
 * canvas-confetti does the drawing: it is the smallest of the serious options
 * (92 kB unpacked, no dependencies) and it renders to its own canvas rather
 * than to hundreds of DOM nodes, which is what keeps it smooth on a mid-range
 * phone — the device most of this shop's buyers are holding.
 *
 * It is loaded on demand, not at import time. Nobody should pay for a confetti
 * bundle on a page they never celebrate on.
 */

/** The shop's own palette — gold, ember and terracotta, never rainbow party colours. */
const GOLD = ["#e5c07b", "#f0d9b5", "#d4a24c"];
const EMBER = ["#b45f2b", "#d98b4a", "#c0392b"];
const BRAND = [...GOLD, ...EMBER, "#3d5730"];

type Origin = { x: number; y: number };

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where on the screen an element sits, in the 0–1 coordinates confetti wants. */
export function originOf(el: HTMLElement | null): Origin | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  if (!r.width) return undefined;
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  };
}

async function load() {
  if (typeof window === "undefined" || prefersReducedMotion()) return null;
  const mod = await import("canvas-confetti");
  return mod.default;
}

/**
 * The moment the quantity earns free delivery. A quick double burst by the
 * quantity box — enough to catch the eye, over before it can annoy.
 */
export async function celebrateUnlock(origin: Origin = { x: 0.5, y: 0.35 }) {
  const confetti = await load();
  if (!confetti) return;

  const base = {
    origin,
    colors: BRAND,
    disableForReducedMotion: true,
    zIndex: 70,
    scalar: 0.9,
  } as const;

  confetti({ ...base, particleCount: 45, spread: 62, startVelocity: 32, ticks: 140 });
  // A slower, wider second wave a beat later reads as one full burst rather
  // than a single thin puff.
  window.setTimeout(() => {
    confetti({ ...base, particleCount: 25, spread: 90, startVelocity: 22, decay: 0.92, ticks: 160 });
  }, 130);
}
