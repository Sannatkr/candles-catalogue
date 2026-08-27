import type { Product, ShippingConfig } from "./types";

/**
 * Delivery is a flat fee, free over a subtotal — but only while the parcel stays
 * light. The weight guard is the whole trick: a light order gets the simple
 * flat/free deal, while a heavy one (five brass urlis is ~10 kg) never ships
 * free, because giving away that freight would swallow the margin.
 *
 * Weight still matters, so each candle keeps a "pack weight" — what a courier
 * bills for one piece once it is boxed, which is far more than the wax weighs.
 */

export const DEFAULT_SHIPPING: ShippingConfig = {
  flatFee: 89,
  freeOverSubtotal: 2000,
  freeUnderGrams: 2000,
};

/** How much the box grows around the candle once it is bubble-wrapped and boxed. */
const PACKING_FACTOR = 3;
/** Even the smallest, sturdiest piece still costs something to box and ship. */
const FLOOR_GRAMS = 250;

/** A rough shipping weight for a candle that has none set by hand. */
export function estimatePackGrams(weightGrams: number, heightCm: number, diameterCm: number): number {
  // Volumetric grams for the candle's own bounding box: (L×W×H cm³)/5000 kg → ×1000 g.
  const volumetric = (heightCm * diameterCm * diameterCm) / 5;
  const base = Math.max(weightGrams || 0, volumetric || 0);
  return Math.max(FLOOR_GRAMS, Math.round(base * PACKING_FACTOR));
}

/** The chargeable shipping weight of one piece: the value set by hand, or an estimate. */
export function packGramsOf(
  product: Pick<Product, "packWeightGrams" | "weightGrams" | "heightCm" | "diameterCm">,
): number {
  if (product.packWeightGrams && product.packWeightGrams > 0) return product.packWeightGrams;
  return estimatePackGrams(product.weightGrams, product.heightCm, product.diameterCm);
}

/** What delivery costs for this parcel: flat, or free when big enough and light enough. */
export function shippingCost(config: ShippingConfig, { grams, subtotal }: { grams: number; subtotal: number }): number {
  if (subtotal <= 0) return 0;

  const lightEnough = config.freeUnderGrams <= 0 || grams <= config.freeUnderGrams;
  if (config.freeOverSubtotal > 0 && subtotal >= config.freeOverSubtotal && lightEnough) return 0;

  return Math.max(0, Math.round(config.flatFee));
}
