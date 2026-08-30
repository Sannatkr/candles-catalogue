import type { MetadataRoute } from "next";

const SITE_URL = "https://www.sugandhacandles.com";

/**
 * The bag, the checkout, a receipt and the admin are all either private or
 * meaningless to a search engine — a crawler indexing them wastes the site's
 * crawl budget and can surface a stranger's half-finished order URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/cart",
        "/checkout",
        "/orders/",
        "/account",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
