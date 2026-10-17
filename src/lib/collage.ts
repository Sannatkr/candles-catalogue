import type { Collection, Product } from "./types";

/**
 * The photographs a collection is introduced with: its first few candles,
 * in stock and photographed, no candle twice. A collection with fewer than
 * `count` pieces is padded with its cover so the collage never has a hole.
 */
export function collageImages(collection: Collection, products: Product[], count = 3): string[] {
  const own = products.filter((p) => p.collectionSlug === collection.slug);
  const pool = [
    ...own.filter((p) => p.inStock && p.images[0]),
    ...own.filter((p) => !p.inStock && p.images[0]),
  ].map((p) => p.images[0]);

  const images = Array.from(new Set(pool)).slice(0, count);
  while (images.length < count) images.push(collection.coverImage);
  return images;
}

/** The pieces in a collection, dearest first, for a banner to float. */
export function showcaseProducts(collection: Collection, products: Product[], count = 5): Product[] {
  const own = products.filter((p) => p.collectionSlug === collection.slug && p.images[0]);
  const seen = new Set<string>();
  return [...own.filter((p) => p.inStock), ...own.filter((p) => !p.inStock)]
    .filter((p) => (seen.has(p.images[0]) ? false : (seen.add(p.images[0]), true)))
    .slice(0, count);
}
