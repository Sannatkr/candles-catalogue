import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { InstagramIcon } from "@/components/instagram-icon";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { Reveal } from "@/components/reveal";
import { getCollection, getProduct, getProducts, getSettings } from "@/lib/data";
import { compactQty, emailLink, instagramDmLink, money } from "@/lib/format";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product?.name ?? "Product",
    description: product?.tagline,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [settings, collection, allProducts] = await Promise.all([
    getSettings(),
    getCollection(product.collectionSlug),
    getProducts(),
  ]);

  const related = allProducts
    .filter((p) => p.collectionSlug === product.collectionSlug && p.id !== product.id)
    .slice(0, 3);

  const specs = [
    { label: "Fragrance", value: product.fragrance },
    { label: "Wax", value: product.waxType },
    { label: "Wick", value: product.wickType },
    { label: "Burn time", value: `${product.burnTimeHours} hours` },
    { label: "Height", value: `${product.heightCm} cm` },
    { label: "Diameter", value: `${product.diameterCm} cm` },
    { label: "Net weight", value: `${product.weightGrams} g` },
    { label: "Packing", value: product.packaging },
  ].filter((s) => s.value);

  const dmHref = instagramDmLink(settings.instagramHandle);
  const emailHref = emailLink(
    settings.email,
    `Enquiry: ${product.name}`,
    [
      `Hi ${settings.businessName},`,
      "",
      `I'd like a quote for: ${product.name}`,
      "Quantity:",
      "",
      "Company:",
      "Delivery city:",
      "Required by:",
    ].join("\n"),
  );

  return (
    <>
      <div className="mx-auto max-w-[1240px] px-5 pt-8 sm:px-8">
        <Link
          href={collection ? `/collections/${collection.slug}` : "/products"}
          className="group inline-flex items-center gap-2 text-[0.85rem] text-ink-soft transition-colors hover:text-ember"
        >
          <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
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

          <p className="mt-7 max-w-[54ch] leading-relaxed text-ink-soft">{product.description}</p>

          {/* Pricing */}
          <div className="mt-9 rounded-[16px] border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Price per piece</p>
              <p className="text-[0.78rem] text-ink-faint">excl. GST</p>
            </div>

            {product.priceTiers.length > 0 ? (
              <table className="mt-4 w-full text-[0.925rem]">
                <tbody>
                  {product.priceTiers.map((tier, i) => (
                    <tr key={tier.minQty} className="border-b border-line-soft last:border-0">
                      <td className="py-2.5 text-ink-soft">
                        {compactQty(tier.minQty)}
                        {product.priceTiers[i + 1]
                          ? ` – ${compactQty(product.priceTiers[i + 1].minQty - 1)}`
                          : "+"}{" "}
                        pcs
                      </td>
                      <td className="py-2.5 text-right font-display text-[1.1rem] text-ink">
                        {money(tier.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3 font-display text-[1.6rem] text-ink">{money(product.basePrice)}</p>
            )}

            <p className="mt-5 border-t border-line pt-4 text-[0.85rem] leading-relaxed text-ink-soft">
              No minimum order. Buy a single piece, or cross a slab and the lower rate applies on its
              own.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={dmHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember"
            >
              <InstagramIcon size={17} />
              DM us on Instagram
            </a>
            <a
              href={emailHref}
              className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line px-7 py-4 text-[0.95rem] text-ink transition-colors hover:border-ink"
            >
              <Mail size={17} />
              Email enquiry
            </a>
          </div>

          <p className="mt-3 text-[0.8rem] text-ink-faint">
            Instagram cannot carry the details across, so mention{" "}
            <span className="text-ink-soft">“{product.name}”</span> in your message — or use email and
            it is filled in for you.
          </p>

          {/* Specs */}
          <div className="mt-11">
            <p className="eyebrow">Specification</p>
            <dl className="mt-4 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line-soft py-3"
                >
                  <dt className="text-[0.875rem] text-ink-faint">{spec.label}</dt>
                  <dd className="text-right text-[0.925rem] text-ink">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
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
              Measurements are of the finished candle. Vessel dimensions may vary by ±2 mm between
              batches.
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
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
