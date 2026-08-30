import type { Collection, Product } from "./types";

/**
 * The structured data Google reads to build a rich result — the little price,
 * stock and breadcrumb line under a search listing.
 *
 * Two rules run through all of it. Everything here must be **visible on the
 * page it describes**, because marking up something a shopper cannot see is a
 * structured-data policy violation and gets the whole site's rich results
 * pulled. And nothing here is invented: there is no `aggregateRating`, because
 * this shop has no reviews yet, and a fabricated star rating is both a Google
 * violation and a misleading advertisement under India's consumer law. It goes
 * in the day real reviews exist, and not a day before.
 */

const SITE_URL = "https://www.sugandhacandles.com";

export function productSchema(
  product: Product,
  collection?: Collection | null,
) {
  const price = product.basePrice;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.tagline || undefined,
    image: product.images.map((src) =>
      src.startsWith("http") ? src : `${SITE_URL}${src}`,
    ),
    sku: product.slug,
    brand: { "@type": "Brand", name: "Sugandha Candles" },
    category: collection?.name,
    ...(product.fragrance
      ? {
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Fragrance",
              value: product.fragrance,
            },
            ...(product.waxType
              ? [
                  {
                    "@type": "PropertyValue",
                    name: "Wax",
                    value: product.waxType,
                  },
                ]
              : []),
          ],
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "INR",
      price: String(price),
      // Undated availability is treated as stale; a year out is the usual
      // convention for a shop that restocks continuously.
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      // OutOfStock, not PreOrder: "made to order" here means the shop pours it
      // when asked, not that a buyer reserves a future release. Misstating
      // availability breaches structured-data policy outright.
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Sugandha Candles" },
    },
  };
}

/** The trail Google prints instead of a bare URL under the title. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/** Who the shop is, once, on the home page. */
export function organizationSchema(instagramHandle?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sugandha Candles",
    url: SITE_URL,
    description:
      "Handcrafted soy wax candles, urli platters and gift hampers, poured by hand in Greater Noida.",
    ...(instagramHandle
      ? {
          sameAs: [
            `https://www.instagram.com/${instagramHandle.replace(/^@/, "")}`,
          ],
        }
      : {}),
  };
}

/** Serialises safely for a <script type="application/ld+json"> tag. */
export function jsonLd(data: unknown) {
  // `<` is escaped so a product name containing markup cannot close the script
  // tag and inject into the page.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
