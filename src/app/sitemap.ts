import type { MetadataRoute } from "next";
import { getCollections, getProducts } from "@/lib/data";

const SITE_URL = "https://www.sugandhacandles.com";

/**
 * Built from the live catalogue rather than hand-listed, so a candle added in
 * the admin is discoverable without anyone remembering to edit this file.
 *
 * No `priority` or `changeFrequency`: Google's own sitemap documentation says
 * it ignores both, so they are noise pretending to be instruction. No
 * `lastModified` either — Google uses it only when it is "consistently and
 * verifiably accurate", and stamping every URL with today's date on every
 * rebuild is the fastest way to teach it that ours means nothing. It goes back
 * in when the catalogue carries a real updated_at.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);

  return [
    {
      url: SITE_URL,
    },
    {
      url: `${SITE_URL}/products`,
    },
    {
      url: `${SITE_URL}/collections`,
    },
    {
      url: `${SITE_URL}/terms`,
    },
    ...collections.map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
    })),
  ];
}
