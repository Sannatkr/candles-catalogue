import { inCollection } from "./data";
import type { Collection, Product } from "./types";

/**
 * The photographs a collection is introduced with: its first few candles,
 * in stock and photographed, no photo twice. When a collection has fewer
 * candles than tiles, the candles' second and third photographs fill in —
 * a one-candle collection shows that candle from three sides rather than
 * the same shot three times. Only after that does the cover pad it out.
 */
export function collageImages(collection: Collection, products: Product[], count = 3): string[] {
  const own = products.filter((p) => inCollection(p, collection.slug));
  const ordered = [...own.filter((p) => p.inStock), ...own.filter((p) => !p.inStock)];

  // Round-robin: every candle's first photo, then every candle's second, …
  const pool: string[] = [];
  const most = Math.max(0, ...ordered.map((p) => p.images.length));
  for (let i = 0; i < most; i++) {
    for (const p of ordered) if (p.images[i]) pool.push(p.images[i]);
  }

  const images = Array.from(new Set(pool)).slice(0, count);
  while (images.length < count) images.push(collection.coverImage);
  return images;
}

/** The pieces in a collection, dearest first, for a banner to float. */
export function showcaseProducts(collection: Collection, products: Product[], count = 5): Product[] {
  const own = products.filter((p) => inCollection(p, collection.slug) && p.images[0]);
  const seen = new Set<string>();
  return [...own.filter((p) => p.inStock), ...own.filter((p) => !p.inStock)]
    .filter((p) => (seen.has(p.images[0]) ? false : (seen.add(p.images[0]), true)))
    .slice(0, count);
}

/**
 * One candle for every collection, in collection order — the dearest in-stock
 * piece whose home is that collection, so the home banner shows the whole
 * range in as many tiles as there are collections.
 */
export function onePerCollection(collections: Collection[], products: Product[]): Product[] {
  const used = new Set<string>();
  const picks: Product[] = [];
  for (const c of collections) {
    const pick = products
      .filter((p) => p.collectionSlug === c.slug && p.inStock && p.images[0] && !used.has(p.images[0]))
      .sort((a, b) => b.basePrice - a.basePrice)[0];
    if (pick) {
      used.add(pick.images[0]);
      picks.push(pick);
    }
  }
  return picks;
}
