"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Attribution } from "@/lib/order-source";

/**
 * Remembers how a visitor arrived, so the order they place later can say so.
 *
 * Read once, on the first page of the visit: UTM tags and Meta's `fbclid` from
 * the URL, plus the referring site. Kept in localStorage for a week — a
 * shopper who taps the ad on Monday and buys on Thursday still counts for the
 * ad. First touch wins: a later plain visit does not overwrite it, but a later
 * tagged link (a different campaign) does.
 */

const KEY = "sc-arrived-via";
const WEEK = 7 * 24 * 60 * 60 * 1000;

type Stored = Attribution & { at: number };

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (
      !parsed ||
      typeof parsed.at !== "number" ||
      Date.now() - parsed.at > WEEK
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(value: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the order simply arrives without a source.
  }
}

/** What the checkout sends with the order. Null when nothing was remembered. */
export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  const stored = read();
  if (!stored) return null;
  const { utmSource, utmMedium, utmCampaign, fbclid, referrer, landingPath } =
    stored;
  return { utmSource, utmMedium, utmCampaign, fbclid, referrer, landingPath };
}

export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const get = (k: string) => searchParams?.get(k)?.trim() || undefined;
    const tagged: Attribution = {
      utmSource: get("utm_source"),
      utmMedium: get("utm_medium"),
      utmCampaign: get("utm_campaign"),
      fbclid: get("fbclid"),
    };
    const hasTags = Object.values(tagged).some(Boolean);
    const existing = read();

    // A tagged link always records itself; an untagged page only fills a gap.
    if (!hasTags && existing) return;

    let referrer: string | undefined;
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).hostname !== window.location.hostname)
        referrer = ref;
    } catch {
      referrer = undefined;
    }
    if (!hasTags && !referrer) return; // a plain direct visit: nothing to say

    write({
      ...tagged,
      referrer,
      landingPath: pathname ?? undefined,
      at: Date.now(),
    });
    // Only the first page of the visit matters, so no dependency on pathname.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
