import type { Product } from "./types";

/**
 * One price per piece, whatever the quantity.
 *
 * The catalogue used to carry four bulk slabs on every design (10 / 25 / 50 /
 * 100) and switched a buyer to a quote past twenty pieces. That is gone. Bulk
 * is a conversation — the "Chat for bulk" button — and everything up to
 * MAX_ONLINE_QTY checks out at the price on the page.
 */

/**
 * Above this many of one design an online purchase becomes a bulk enquiry —
 * the buyer is quoted directly rather than checking out. Nothing caps the bag
 * as a whole.
 */
export const MAX_ONLINE_QTY = 100;

/** What one piece costs. The only price there is. */
export function singlePrice(product: Pick<Product, "basePrice">) {
  return product.basePrice;
}

/**
 * How many a buyer has to take at a time. 1 for nearly everything; 10 for the
 * mithai candles, which are sold in sets. The stepper moves by it and nothing
 * below it can be bought, but any number above it is fine — 35 is allowed.
 */
export function minQtyOf(product: Pick<Product, "minQty">) {
  return Math.max(1, Math.floor(product.minQty || 1));
}

/**
 * A quantity the shop will actually sell: whole, at least the minimum, and no
 * more than the online ceiling. Anything below 1 is not a quantity at all and
 * comes back as 0 so the caller can drop the line.
 */
export function clampQty(raw: number, minQty: number) {
  const qty = Math.floor(Number(raw) || 0);
  if (qty < 1) return 0;
  return Math.min(MAX_ONLINE_QTY, Math.max(minQty, qty));
}
