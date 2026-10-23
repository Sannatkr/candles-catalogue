/**
 * Where an order came from — the answer to "is the Instagram ad working?".
 *
 * The Meta Pixel tells Meta what happened on the site; it tells us nothing. So
 * the storefront remembers how a visitor arrived (see attribution.tsx), the
 * checkout sends it along, and it is kept on the order row. Shared by the
 * server (classifying at insert) and the admin (labels), so no "use client".
 */

export type OrderSource = "meta_ads" | "social" | "google" | "direct" | "other";

export const ORDER_SOURCE_LABEL: Record<OrderSource, string> = {
  meta_ads: "Meta ad",
  social: "Instagram / Facebook",
  google: "Google",
  direct: "Direct",
  other: "Other site",
};

/** Raw signals captured in the browser on the first page of a visit. */
export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbclid?: string;
  referrer?: string;
  landingPath?: string;
};

const META_HOSTS = /(^|\.)(instagram\.com|facebook\.com|fb\.com|l\.instagram\.com|lm\.facebook\.com|m\.facebook\.com)$/i;
const META_SOURCES = /^(ig|instagram|fb|facebook|meta)$/i;
const PAID_MEDIUMS = /^(paid|cpc|ppc|ads?|paid[_-]?social|social[_-]?paid)$/i;

function hostOf(url: string | undefined) {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/**
 * Meta's ad clicks carry `fbclid`; an Instagram bio link does not, it just
 * arrives with instagram.com as the referrer. UTM tags, when the ad link has
 * them, win over both guesses.
 */
export function classifySource(a: Attribution | null | undefined): OrderSource {
  if (!a) return "direct";
  const source = (a.utmSource ?? "").trim();
  const medium = (a.utmMedium ?? "").trim();
  const host = hostOf(a.referrer);

  if (source) {
    if (META_SOURCES.test(source)) return PAID_MEDIUMS.test(medium) || a.fbclid ? "meta_ads" : "social";
    if (/^google$/i.test(source)) return "google";
    return "other";
  }
  if (a.fbclid) return "meta_ads";
  if (META_HOSTS.test(host)) return "social";
  if (/(^|\.)google\./i.test(host)) return "google";
  if (host) return "other";
  return "direct";
}

/** Trims every field to something safe to store; drops empties. */
export function cleanAttribution(raw: unknown): Attribution | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
  const a: Attribution = {
    utmSource: text(r.utmSource, 80),
    utmMedium: text(r.utmMedium, 80),
    utmCampaign: text(r.utmCampaign, 120),
    fbclid: text(r.fbclid, 200),
    referrer: text(r.referrer, 300),
    landingPath: text(r.landingPath, 300),
  };
  return Object.values(a).some(Boolean) ? a : null;
}
