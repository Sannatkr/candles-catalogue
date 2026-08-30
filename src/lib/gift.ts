import type { GiftConfig, Product } from "./types";

/**
 * One free candle, chosen by the buyer, once the bag is big enough.
 *
 * Every rule about the gift lives here so the cart, the checkout screen and the
 * server all answer the same question the same way. The browser's copy is a
 * convenience; `resolveGift` is run again on the server at checkout and its
 * answer is the only one that reaches Razorpay.
 *
 * The threshold is measured on the *paid* subtotal — the gift never counts
 * towards unlocking itself, or a ₹1,900 bag would qualify by adding the free
 * candle to it.
 */

export const DEFAULT_GIFT: GiftConfig = {
  enabled: true,
  threshold: 2000,
  surpriseEnabled: true,
  surpriseLabel: "A surprise gift",
};

/** The slug the surprise rides on. Not a catalogue product — it is whatever is
 *  packed on the day, so it only ever needs a name on the packing list. */
export const SURPRISE_SLUG = "surprise-gift";

/** Is the unchosen extra riding along on this bag? */
export function surpriseIncluded(config: GiftConfig, paidSubtotal: number): boolean {
  return config.surpriseEnabled && giftUnlocked(config, paidSubtotal);
}

/** The candles a buyer is allowed to choose from, in the order they browse them. */
export function eligibleGifts(products: Product[]): Product[] {
  return products.filter((p) => p.giftEligible && p.inStock);
}

export function giftUnlocked(config: GiftConfig, paidSubtotal: number): boolean {
  return config.enabled && config.threshold > 0 && paidSubtotal >= config.threshold;
}

/** How much more they need to spend, or 0 once it is unlocked. */
export function amountToGift(config: GiftConfig, paidSubtotal: number): number {
  if (!config.enabled || config.threshold <= 0) return 0;
  return Math.max(0, config.threshold - paidSubtotal);
}

/**
 * The gift as it actually stands: the chosen candle, but only if it is still
 * giftable, still in stock, and the bag still earns it. Anything else returns
 * null, which is what makes a stale localStorage choice harmless.
 */
export function resolveGift(
  config: GiftConfig,
  products: Product[],
  paidSubtotal: number,
  slug: string | null,
): Product | null {
  if (!slug || !giftUnlocked(config, paidSubtotal)) return null;
  const product = products.find((p) => p.slug === slug);
  if (!product || !product.giftEligible || !product.inStock) return null;
  return product;
}
