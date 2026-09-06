import { breadcrumbSchema, jsonLd, productSchema } from "@/lib/schema";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClampedText } from "@/components/clamped-text";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { Reveal } from "@/components/reveal";
import {
  getCollection,
  getProduct,
  getProducts,
  getSettings,
} from "@/lib/data";
import { sizeLabel } from "@/lib/format";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product?.name ?? "Product",
    // The real description, not the tagline. "Our best seller, and it shows" is
    // lovely and contains not one word anybody types into Google; the
    // description names the shape, the occasion and the fragrance.
    description: (product?.description || product?.tagline || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155),
    alternates: { canonical: `/products/${slug}` },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [settings, collection, allProducts] = await Promise.all([
    getSettings(),
    getCollection(product.collectionSlug),
    getProducts(),
  ]);

  const related = allProducts
    .filter(
      (p) => p.collectionSlug === product.collectionSlug && p.id !== product.id,
    )
    .slice(0, 3);

  // In short, and scent first — it is the one spec a buyer actually asks about.
  const specs = [
    { label: "Fragrance", value: product.fragrance },
    { label: "Size", value: sizeLabel(product) },
    { label: "Wax", value: product.waxType },
    { label: "Wick", value: product.wickType },
  ].filter((s) => s.value);

  return (
    <>
      {/* Everything marked up here is visible on this page — price, stock,
          images, name. Marking up anything a shopper cannot see is a policy
          violation, and there is deliberately no rating: the shop has no
          reviews yet, and inventing stars would be both a Google violation and
          a misleading advertisement under Indian consumer law. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(productSchema(product, collection)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              ...(collection
                ? [
                    {
                      name: collection.name,
                      path: `/collections/${collection.slug}`,
                    },
                  ]
                : [{ name: "All Products", path: "/products" }]),
              { name: product.name, path: `/products/${product.slug}` },
            ]),
          ),
        }}
      />

      <div className="mx-auto max-w-[1240px] px-5 pt-8 sm:px-8">
        <Link
          href={collection ? `/collections/${collection.slug}` : "/products"}
          className="group inline-flex items-center gap-2 text-[0.85rem] text-ink-soft transition-colors hover:text-ember"
        >
          <ArrowLeft
            size={15}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          {collection ? collection.name : "All products"}
        </Link>
      </div>

      <article className="mx-auto grid max-w-[1240px] gap-12 px-5 pt-8 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Reveal>
          <ProductGallery images={product.images} alt={product.name} />
        </Reveal>

        <Reveal delay={90} className="lg:pt-4">
          <p className="eyebrow">{collection?.name ?? "Catalogue"}</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4.6vw,3rem)] leading-[1.06] tracking-[-0.02em] text-ink">
            {product.name}
          </h1>
          <p className="mt-3 text-[1.05rem] text-ink-soft">{product.tagline}</p>

          {!product.inStock && (
            <span className="mt-5 inline-block rounded-full bg-ember-wash px-3.5 py-1.5 text-[0.78rem] text-ember-deep">
              Made to order · add 5–7 days to lead time
            </span>
          )}

          <ProductPurchase
            product={product}
            fragrances={settings.fragrances}
            instagramHandle={settings.instagramHandle}
            businessName={settings.businessName}
          />

          {/* The specs, right under the price and short: chips, not a table.
              Fragrance leads because that is the one line people read. */}
          {specs.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {specs.map((spec) => (
                <li
                  key={spec.label}
                  className="inline-flex items-baseline gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.85rem]"
                >
                  <span className="text-ink-faint">{spec.label}</span>
                  <span className="text-ink">{spec.value}</span>
                </li>
              ))}
            </ul>
          )}

          {/* The story last, held to two lines. Few read it; those who do can open it. */}
          <ClampedText text={product.description} className="mt-7 max-w-[54ch]" />
        </Reveal>
      </article>

      {/* Size chart */}
      {product.sizeChartImage && (
        <section className="mx-auto max-w-[1240px] px-5 pt-24 sm:px-8">
          <Reveal>
            <p className="eyebrow">Dimensions</p>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight tracking-[-0.015em] text-ink">
              Size guide
            </h2>
            <p className="mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Measurements are of the finished candle. Vessel dimensions may
              vary by ±2 mm between batches.
            </p>
          </Reveal>

          <Reveal delay={80} className="mt-8">
            <div className="relative aspect-3/2 w-full overflow-hidden rounded-[18px] border border-line bg-surface">
              <Image
                src={product.sizeChartImage}
                alt={`${product.name} size guide`}
                fill
                sizes="(max-width: 1240px) 92vw, 1240px"
                className="object-contain"
              />
            </div>
          </Reveal>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pt-24 sm:px-8">
          <Reveal>
            <p className="eyebrow">Also in {collection?.name}</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">
            {related.map((item, i) => (
              <Reveal key={item.id} delay={i * 80}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
