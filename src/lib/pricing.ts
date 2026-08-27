import type { PriceTier, Product } from "./types";

/**
 * A buyer picks a band, not a number. The old catalogue printed the whole slab
 * table — "25 – 49 pcs ₹499" — which reads like a price list a wholesaler faxes
 * you. A shop shows one price at a time and changes it when you change your
 * mind, so that is what these helpers are for.
 */

/**
 * Above this many of any one design, an online purchase becomes a bulk enquiry
 * — the buyer is quoted directly rather than checking out. There is no ceiling
 * on the bag as a whole: a buyer may add as many designs as they like.
 */
export const RETAIL_MAX = 20;

export type Band = {
  minQty: number;
  price: number;
  /** What the chip says. Never a range. */
  label: string;
  /** Retail bands go through the cart; the rest go through the enquiry form. */
  retail: boolean;
};

const sortTiers = (tiers: PriceTier[]) =>
  [...tiers].filter((t) => t.minQty > 0 && t.price > 0).sort((a, b) => a.minQty - b.minQty);

/**
 * The bands offered on a product page. The first one is whatever the product
 * costs on its own; the rest are the bulk steps the seller set up — typically
 * 10, 25, 50 and 100.
 */
export function bandsFor(product: Product): Band[] {
  const tiers = sortTiers(product.priceTiers);

  if (!tiers.length) {
    return [{ minQty: 1, price: product.basePrice, label: "Single", retail: true }];
  }

  return tiers.map((tier, i) => ({
    minQty: tier.minQty,
    price: tier.price,
    label: i === 0 && tier.minQty <= RETAIL_MAX ? "Single" : `${tier.minQty}+`,
    retail: tier.minQty <= RETAIL_MAX,
  }));
}

/** What one piece costs on its own — the only price a catalogue card shows. */
export function singlePrice(product: Product) {
  const tiers = sortTiers(product.priceTiers);
  const first = tiers.find((t) => t.minQty <= RETAIL_MAX) ?? tiers[0];
  return first?.price ?? product.basePrice;
}

/** The rate that applies once a real quantity is known. */
export function priceAtQty(product: Product, qty: number) {
  const tiers = sortTiers(product.priceTiers);
  const applicable = [...tiers].reverse().find((t) => qty >= t.minQty);
  return applicable?.price ?? singlePrice(product);
}

// Delivery is no longer a flat fee — it is worked out by weight and zone in
// src/lib/shipping.ts.
