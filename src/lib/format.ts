import type { Product } from "./types";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function money(value: number) {
  return inr.format(value).replace(/\.00$/, "");
}

export function compactQty(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** The slab rate that applies at a given quantity. */
export function priceFor(product: Product, qty: number) {
  const applicable = product.priceTiers
    .filter((t) => qty >= t.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];
  return applicable?.price ?? product.priceTiers[0]?.price ?? product.basePrice;
}

/** Lowest slab price, which is what "from ₹X" on a card should show. */
export function bestPrice(product: Product) {
  const prices = [product.basePrice, ...product.priceTiers.map((t) => t.price)].filter(
    (p) => typeof p === "number" && p > 0,
  );
  return prices.length ? Math.min(...prices) : product.basePrice;
}

const handle = (value: string) => value.replace(/^@/, "").trim();

/**
 * Instagram usernames are 1–30 characters of letters, numbers, dots and
 * underscores. A handle that fails this can only ever produce a dead link, so
 * it is worth catching before anyone taps it.
 */
export function isValidInstagramHandle(value: string) {
  return /^[A-Za-z0-9._]{1,30}$/.test(handle(value));
}

/**
 * Opens a DM thread in the Instagram app. Verified as useless on desktop web:
 * ig.me redirects to instagram.com/m/<handle>, which answers "this page isn't
 * available" even for a real handle on a signed-in session. Use
 * instagramChatLink so each device gets the one that works.
 */
export function instagramDmLink(instagramHandle: string) {
  return `https://ig.me/m/${handle(instagramHandle)}`;
}

export function instagramProfileLink(instagramHandle: string) {
  return `https://instagram.com/${handle(instagramHandle)}`;
}

/** True where the Instagram app can pick up a deep link. */
export function onMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * The link that actually reaches a conversation: the app's DM thread on a
 * phone, the profile (with its Message button) on a computer.
 */
export function instagramChatLink(instagramHandle: string) {
  return onMobileDevice() ? instagramDmLink(instagramHandle) : instagramProfileLink(instagramHandle);
}

/**
 * Instagram cannot pre-fill a DM, so email carries the detail a buyer would
 * otherwise have to type out.
 */
export function emailLink(address: string, subject: string, body: string) {
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Sizes are quoted to buyers in inches — that is how the trade talks here — but
 * stored in centimetres so the column names stay honest. A zero means the
 * measurement was never recorded, and is left out rather than shown as 0.
 */
const CM_PER_INCH = 2.54;

export function toInches(cm: number) {
  return Number((cm / CM_PER_INCH).toFixed(1)).toString();
}

export function sizeLabel({ diameterCm, heightCm }: { diameterCm: number; heightCm: number }) {
  const parts = [];
  if (diameterCm > 0) parts.push(`W ${toInches(diameterCm)}`);
  if (heightCm > 0) parts.push(`H ${toInches(heightCm)}`);
  return parts.length ? `${parts.join(" × ")} in` : "";
}
