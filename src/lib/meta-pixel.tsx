"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Meta (Facebook/Instagram) Pixel, so ads can see what people did after the click.
 *
 * Off unless NEXT_PUBLIC_META_PIXEL_ID is set — no ID, no script, no cookies.
 * `fbTrack` is called from the PostHog `track()` helper so every existing event
 * reaches both tools without touching the components that fire them.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export const pixelEnabled = Boolean(PIXEL_ID);

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let loaded = false;

function load() {
  if (loaded || !PIXEL_ID || typeof window === "undefined") return;
  loaded = true;
  if (!window.fbq) {
    const fbq: Fbq = (...args: unknown[]) => {
      fbq.queue?.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    window.fbq = fbq;
    window._fbq = fbq;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq?.("init", PIXEL_ID);
}

/** Standard pixel events Meta can optimise ads on. Safe to call when the pixel is off. */
export function fbTrack(event: string, params?: Record<string, unknown>) {
  if (!PIXEL_ID || typeof window === "undefined") return;
  load();
  window.fbq?.("track", event, params);
}

/** Our PostHog event names → Meta standard events (and the currency Meta expects). */
export function mirrorToPixel(event: string, properties?: Record<string, unknown>) {
  if (!PIXEL_ID) return;
  const value = typeof properties?.value === "number" ? properties.value : undefined;
  const money = value === undefined ? {} : { value, currency: "INR" };
  switch (event) {
    case "add_to_cart":
      fbTrack("AddToCart", { ...money, content_ids: [properties?.product], content_type: "product" });
      break;
    case "begin_checkout":
      fbTrack("InitiateCheckout", { ...money, num_items: properties?.pieces });
      break;
    case "purchase":
      fbTrack("Purchase", { ...money, num_items: properties?.pieces });
      break;
    case "bulk_quote_opened":
      fbTrack("Lead", { content_ids: [properties?.product] });
      break;
  }
}

export function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PIXEL_ID) return;
    load();
    window.fbq?.("track", "PageView");
    const slug = pathname?.match(/^\/products\/([^/?#]+)/)?.[1];
    if (slug) fbTrack("ViewContent", { content_ids: [slug], content_type: "product" });
  }, [pathname]);

  return null;
}
