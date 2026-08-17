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

/** Opens straight into a DM thread, on the app if installed and web otherwise. */
export function instagramDmLink(instagramHandle: string) {
  return `https://ig.me/m/${handle(instagramHandle)}`;
}

export function instagramProfileLink(instagramHandle: string) {
  return `https://instagram.com/${handle(instagramHandle)}`;
}

/**
 * Instagram cannot pre-fill a DM, so email carries the detail a buyer would
 * otherwise have to type out.
 */
export function emailLink(address: string, subject: string, body: string) {
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
