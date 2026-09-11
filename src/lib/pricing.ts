import type { BulkTier, Product } from "./types";

/**
 * One price at one piece, and a ladder under it.
 *
 * The slabs are back, but they work differently from the ones this shop had
 * before. There are no per-candle price lists to keep up to date: the admin
 * sets one ladder — 25+ / 50+ / 100+ / 200+ — as percentages off, and every
 * candle that takes bulk pricing follows it. The mithai sets, poured and boxed
 * in tens at ₹18–25 a piece, do not: they sit at a fixed price.
 *
 * The ladder is *volume* pricing, not graduated: reaching a rung reprices the
 * whole line, so 50 pieces are all at the 50+ rate. It is the version a buyer
 * can work out in their head, which matters far more here than the last rupee.
 *
 * Every candle also carries its own ceiling — how many will physically go in a
 * parcel. Past it there is no checkout, only the bulk enquiry form.
 */

/** Fallback ceiling for a candle with none of its own set yet. */
export const MAX_ONLINE_QTY = 100;

/**
 * The ladder the shop opens with. The admin overrides it in Settings.
 *
 * Five rungs, opening at ten. Ten is where the big pieces stop being a
 * checkout and become a quote, so the first rung and the first ceiling line up:
 * on a peacock urli every rung reads "on enquiry", which is the point.
 */
export const DEFAULT_BULK_TIERS: BulkTier[] = [
  { minQty: 10, percentOff: 3 },
  { minQty: 25, percentOff: 5 },
  { minQty: 50, percentOff: 8 },
  { minQty: 100, percentOff: 12 },
  { minQty: 200, percentOff: 15 },
];

/** The ladder, cleaned up: whole numbers, in order, nothing daft. */
export function normaliseTiers(tiers: BulkTier[] | undefined): BulkTier[] {
  if (!Array.isArray(tiers)) return [];
  return tiers
    .map((t) => ({
      minQty: Math.floor(Number(t?.minQty) || 0),
      percentOff: Number(t?.percentOff) || 0,
    }))
    .filter((t) => t.minQty > 1 && t.percentOff > 0 && t.percentOff < 90)
    .sort((a, b) => a.minQty - b.minQty);
}

/**
 * How many a buyer has to take at a time. 1 for nearly everything; 10 for the
 * mithai candles, which are sold in sets. The stepper moves by it and nothing
 * below it can be bought, but any number above it is fine — 35 is allowed.
 */
export function minQtyOf(product: Pick<Product, "minQty">) {
  return Math.max(1, Math.floor(product.minQty || 1));
}

/** The most of this design that may be bought online, set by its size. */
export function maxQtyOf(product: Pick<Product, "maxQty" | "minQty">) {
  const cap = Math.floor(product.maxQty || 0);
  if (cap > 0) return Math.max(minQtyOf(product), cap);
  return Math.max(minQtyOf(product), MAX_ONLINE_QTY);
}

/** How many of this one design earn free delivery. 0 means never. */
export function freeShipQtyOf(product: Pick<Product, "freeShipQty">) {
  return Math.max(0, Math.floor(product.freeShipQty || 0));
}

/** What one piece costs at one piece. The top of the ladder. */
export function singlePrice(product: Pick<Product, "basePrice">) {
  return product.basePrice;
}

/** The rung this quantity reaches, or null while it is still below the first. */
export function tierAt(
  product: Pick<Product, "bulkPricing">,
  tiers: BulkTier[],
  qty: number,
): BulkTier | null {
  if (!product.bulkPricing) return null;
  let found: BulkTier | null = null;
  for (const tier of tiers) if (qty >= tier.minQty) found = tier;
  return found;
}

/** A price set by hand for this rung on this candle, or 0 for "use the percentage". */
export function overrideFor(
  product: Pick<Product, "tierPrices">,
  minQty: number,
): number {
  const raw = Number(product.tierPrices?.[String(minQty)]);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
}

/**
 * What one piece costs at this quantity.
 *
 * A rung with a hand-set price is charged at exactly that, whatever the
 * percentage says — the admin typed a number, and quietly moving it would make
 * the field a lie. Everything else takes the percentage off the base price.
 */
export function unitPriceAt(
  product: Pick<Product, "basePrice" | "bulkPricing" | "tierPrices">,
  tiers: BulkTier[],
  qty: number,
): number {
  const tier = tierAt(product, tiers, qty);
  if (!tier) return product.basePrice;

  const byHand = overrideFor(product, tier.minQty);
  if (byHand) return byHand;

  // Rounded to the rupee, and deliberately not charm-priced to a 9 like the
  // retail prices are. Two reasons. Snapping ₹75 down to ₹69 on a ₹79 candle
  // gives away 13% where 5% was promised, and it collapses three rungs of the
  // ladder onto the same number — at ₹79 the 25+, 50+ and 100+ rates all became
  // ₹69. And a bulk buyer is not reading a shelf price: clean net rates are
  // what a quotation looks like, which is what this is.
  return Math.min(product.basePrice, Math.round(product.basePrice * (1 - tier.percentOff / 100)));
}

/**
 * The cheapest this candle ever gets — its rate at the bottom of the ladder.
 *
 * This is the number the grid leads with, as "From ₹169". Most of what leaves
 * this kitchen leaves in hundreds, and a card that only ever said ₹299 was
 * quoting the one price a bulk buyer will never pay. Null when there is no
 * ladder to walk down — the mithai sets, sold at a flat price in tens — and the
 * card falls back to the plain price.
 *
 * The whole ladder is scanned rather than just its last rung: a rate typed in
 * by hand can sit lower than the one below it, and "from" has to mean from.
 */
export function bulkFromPrice(
  product: Pick<Product, "basePrice" | "bulkPricing" | "tierPrices">,
  tiers: BulkTier[],
): number | null {
  if (!product.bulkPricing || tiers.length === 0) return null;
  const lowest = Math.min(...tiers.map((tier) => unitPriceAt(product, tiers, tier.minQty)));
  return lowest < product.basePrice ? lowest : null;
}

export type Slab = {
  minQty: number;
  percentOff: number;
  unitPrice: number;
  /** False once the rung sits above what this candle will ship — enquiry only. */
  online: boolean;
};

/**
 * The ladder as a buyer sees it on the product page. Rungs above the candle's
 * ceiling are kept rather than hidden: a peacock urli that stops at 7 should
 * still show that 25, 50 and 100 exist, because that is the whole point of the
 * bulk enquiry button sitting underneath.
 */
export function slabsFor(
  product: Pick<Product, "basePrice" | "bulkPricing" | "maxQty" | "minQty" | "tierPrices">,
  tiers: BulkTier[],
): Slab[] {
  if (!product.bulkPricing) return [];
  const cap = maxQtyOf(product);
  return tiers.map((tier) => ({
    minQty: tier.minQty,
    percentOff: tier.percentOff,
    unitPrice: unitPriceAt(product, tiers, tier.minQty),
    online: tier.minQty <= cap,
  }));
}

/**
 * A quantity the shop will actually sell: whole, at least the minimum, and no
 * more than this candle's own ceiling. Anything below 1 is not a quantity at
 * all and comes back as 0 so the caller can drop the line.
 */
export function clampQty(raw: number, minQty: number, maxQty: number) {
  const qty = Math.floor(Number(raw) || 0);
  if (qty < 1) return 0;
  return Math.min(Math.max(minQty, maxQty), Math.max(minQty, qty));
}
