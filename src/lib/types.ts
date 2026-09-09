export type Product = {
  id: string;
  slug: string;
  name: string;
  collectionSlug: string;
  tagline: string;
  description: string;
  images: string[];
  sizeChartImage: string | null;

  /** Free-text words a buyer might search: shapes, occasions, materials. */
  keywords: string[];

  fragrance: string;
  waxType: string;
  wickType: string;
  burnTimeHours: number;

  heightCm: number;
  diameterCm: number;
  weightGrams: number;

  /**
   * Chargeable shipping weight of one piece, in grams — what the courier bills
   * for once the protective box is on it, which is far more than the wax weighs.
   * 0 means "estimate it from the size".
   */
  packWeightGrams: number;

  /** Price per piece at one. The slabs cut down from here. */
  basePrice: number;
  /** List price shown struck through. 0 hides it. */
  mrp: number;
  /**
   * Sold in sets of this many. 1 for nearly everything; 10 for the mithai
   * candles. The quantity stepper moves by it and nothing below it can be
   * bought, but any number above it is allowed.
   */
  minQty: number;
  packaging: string;

  /**
   * The most pieces of this design that may go through the checkout, set by how
   * big it is: 7 for a peacock urli, 300 for a set-of-ten mithai candle. Past it
   * the buyer is sent to the bulk enquiry form. 0 falls back to the site-wide
   * ceiling.
   */
  maxQty: number;
  /**
   * How many of this one design earn free delivery on the whole order. 50 for
   * most candles, but never above the ceiling — so a peacock urli earns it at 7.
   * 0 switches it off for this candle.
   */
  freeShipQty: number;
  /** Do the quantity slabs apply? False for the mithai sets, which are fixed. */
  bulkPricing: boolean;
  /**
   * A hand-set price for a rung, keyed by the rung's quantity — {"25": 474}.
   * A rung named here is charged at exactly that; a rung missing falls back to
   * the percentage in Settings. Empty for most candles.
   */
  tierPrices: Record<string, number>;

  inStock: boolean;
  featured: boolean;
  sortOrder: number;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  sortOrder: number;
};

export type TermsSection = {
  heading: string;
  body: string[];
};

/**
 * How delivery is charged: a flat fee, free over a subtotal — but only while the
 * parcel stays under a weight, so a heavy order never ships free.
 */
export type ShippingConfig = {
  /** Flat delivery fee charged when the order is not free. */
  flatFee: number;
  /** Free delivery once the subtotal reaches this — 0 turns free shipping off. */
  freeOverSubtotal: number;
  /** …but only if the parcel stays under this weight, so a heavy order never rides free. */
  freeUnderGrams: number;
};

/**
 * One rung of the bulk ladder: take this many of one design and the price per
 * piece comes down by this much. Edited in the admin, so the ladder can be
 * tuned against real costs without a deploy.
 */
export type BulkTier = {
  /** Pieces of a single design needed to reach this rung. */
  minQty: number;
  /** Cut off the price per piece, as a percentage. */
  percentOff: number;
};

export type SiteSettings = {
  businessName: string;
  tagline: string;
  aboutBlurb: string;
  /** Instagram username without the @. Powers every enquiry button. */
  instagramHandle: string;
  email: string;
  addressLines: string[];
  currency: string;
  /** Offered on the booking form once an order gets large enough to customise. */
  fragrances: string[];
  shipping: ShippingConfig;
  /** The bulk ladder, cheapest rung first. Empty turns slab pricing off. */
  bulkTiers: BulkTier[];
  termsIntro: string;
  termsSections: TermsSection[];
};

export type Booking = {
  id: string;
  createdAt: string;
  productSlug: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fragrance: string | null;
  pincode: string | null;
  state: string | null;
  buyerName: string;
  buyerContact: string;
  phone: string | null;
  note: string | null;
  status: "new" | "contacted" | "confirmed" | "closed";
};
