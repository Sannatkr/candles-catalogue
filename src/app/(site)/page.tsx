import { jsonLd, organizationSchema } from "@/lib/schema";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { OfferBanner } from "@/components/offer-banner";
import { collageImages, onePerCollection } from "@/lib/collage";
import {
  getCollections,
  getFeaturedProducts,
  getProducts,
  getSettings,
  inCollection,
} from "@/lib/data";

/** "Five collections", not "5 collections" — a headline, not a count. */
const WORDS: Record<number, string> = {
  2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten",
};

const FACTS = [
  { label: "Wax", value: "100% natural soy" },
  { label: "Burn", value: "Smokeless, no soot" },
  { label: "Fragrance", value: "English fragrance oils" },
  { label: "Order from", value: "A single piece" },
];

const STEPS = [
  {
    n: "01",
    title: "Browse and shortlist",
    body: "Sizes, burn time, packing and the price per piece are on the page. Nothing hidden behind a phone call.",
  },
  {
    n: "02",
    title: "Book it in a minute",
    body: "Pick your quantity and pay online. Buying for a team or a wedding? Tap Bulk enquiry, choose your candles and quantities, and we quote you the same working day.",
  },
  {
    n: "03",
    title: "Advance and production",
    body: "65% advance starts production. We share photographs before dispatch, and the balance is due then.",
  },
];

export const metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [settings, collections, featured, allProducts] = await Promise.all([
    getSettings(),
    getCollections(),
    getFeaturedProducts(6),
    getProducts(),
  ]);
  // The banner floats one candle from every collection, in collection order
  // — the whole range in one glance, rather than the three dearest pieces.
  // Five tiles: a sold-out collection's tile is filled from the others.
  const showcase = onePerCollection(collections, allProducts, 5);

  // Four photographs for the hero mosaic, all from the lead collection (Mini
  // Hampers): the hero's job is to show that one range properly, as a
  // collage, rather than one of everything. Short collections are padded
  // from the rest of the catalogue so the grid is never a tile short.
  const lead = collections[0];
  const mosaic = Array.from(
    new Set(
      [
        ...(lead ? collageImages(lead, allProducts, 4) : []),
        ...featured.map((p) => p.images[0]),
        ...allProducts.map((p) => p.images[0]),
        "/placeholders/candle-01.svg",
      ].filter(Boolean),
    ),
  ).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(organizationSchema(settings.instagramHandle)),
        }}
      />

      {/* Hero */}
      {/* Before the hero. An offer people have to scroll to find is an offer
          most people never find. */}
      <OfferBanner
        showcase={showcase}
        fragrances={settings.fragrances}
        instagramHandle={settings.instagramHandle}
        businessName={settings.businessName}
      />

      {/* Collections, straight under the offer. Someone who has just read
          "the price is on the page" should see the range next, not a
          headline about wax: each collection as a collage of three of its
          own candles. */}
      {collections.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pt-16 sm:px-8 lg:pt-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The range</p>
              <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.85rem)] leading-tight tracking-[-0.015em] text-ink">
                {collections.length === 1
                  ? "One collection"
                  : `${WORDS[collections.length] ?? collections.length} collections`}
              </h2>
            </div>
            <Link
              href="/collections"
              className="group inline-flex items-center gap-2 text-[0.925rem] text-ink-soft transition-colors hover:text-ember"
            >
              See all
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, i) => (
              <Reveal key={collection.id} delay={(i % 3) * 80} className="h-full">
                <CollectionCard
                  collection={collection}
                  images={collageImages(collection, allProducts)}
                  count={allProducts.filter((p) => inCollection(p, collection.slug)).length}
                  priority={i < 3}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden">
        {/* Warm glow behind the hero image. On a phone the column stacks, so it
            would sit straight on top of the headline — keep it off small screens. */}
        <div className="pointer-events-none absolute -top-40 -right-32 -z-10 hidden h-[520px] w-[520px] rounded-full bg-ember-wash blur-[120px] lg:block" />

        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 pt-20 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-28 lg:pb-28">
          <Reveal>
            <p className="eyebrow">Handmade soy candles</p>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6.5vw,4.6rem)] leading-[1.02] tracking-[-0.02em] text-ink">
              No smoke.
              <br />
              <span className="text-ember italic">Just the scent.</span>
            </h1>
            <p className="mt-7 max-w-[46ch] text-[1.05rem] leading-relaxed text-ink-soft">
              {settings.aboutBlurb}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/collections"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[0.925rem] text-canvas transition-colors hover:bg-ember"
              >
                Browse collections
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/terms"
                className="rounded-full border border-line px-7 py-3.5 text-[0.925rem] text-ink transition-colors hover:border-ink"
              >
                Terms &amp; payment
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            {/* A collage of the lead collection — four Mini Hampers — not one
                photograph. Same grid at every width, so a phone gets the whole
                set rather than the desktop layout with the good bits switched
                off. */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {lead && (
                <Link
                  href={`/collections/${lead.slug}`}
                  className="group inline-flex items-center gap-2 self-start text-[0.8rem] tracking-[0.14em] text-ink-faint uppercase transition-colors hover:text-ember"
                >
                  {lead.name}
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              )}
              <div className="relative aspect-16/11 overflow-hidden rounded-[20px] bg-canvas-deep">
                <Image
                  src={mosaic[0]}
                  alt={lead?.name ?? "Sugandha Candles"}
                  fill
                  sizes="(max-width: 1024px) 92vw, 46vw"
                  className="object-cover"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {mosaic.slice(1, 4).map((src, i) => (
                  <div
                    key={src + i}
                    className="group relative aspect-square overflow-hidden rounded-[14px] bg-canvas-deep"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 30vw, 15vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Fact strip */}
        <div className="border-y border-line bg-canvas-deep/60">
          <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-px px-5 sm:px-8 lg:grid-cols-4">
            {FACTS.map((fact, i) => (
              <Reveal
                key={fact.label}
                delay={i * 70}
                className="py-7 lg:border-l lg:border-line lg:first:border-l-0 lg:pl-7"
              >
                <p className="eyebrow">{fact.label}</p>
                <p className="mt-1.5 font-display text-[1.15rem] text-ink">
                  {fact.value}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pt-24 sm:px-8">
          <Reveal>
            <p className="eyebrow">Most ordered</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.85rem)] leading-tight tracking-[-0.015em] text-ink">
              What buyers start with
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">
            {featured.map((product, i) => (
              <Reveal key={product.id} delay={(i % 3) * 80}>
                <ProductCard product={product} priority={i < 3} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {collections.length === 0 && featured.length === 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pt-24 sm:px-8">
          <EmptyState
            title="The catalogue is being loaded"
            body="Products are going up right now. Message us in the meantime and we will send what you need directly."
          />
        </section>
      )}

      {/* Why soy */}
      <section className="mx-auto max-w-[1240px] px-5 pt-28 sm:px-8">
        <Reveal className="max-w-[52ch]">
          <p className="eyebrow">Why our wax matters</p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.85rem)] leading-tight tracking-[-0.015em] text-ink">
            Most candles you buy are paraffin.
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-ink-soft">
            Paraffin is a petroleum by-product. It is cheap, it burns hot, and
            it leaves the black film you find on jar rims and walls. We have
            never used it. Every piece here is poured in 100% natural soy —
            nothing blended in to cut cost.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "It does not blacken anything",
              body: "Soy burns cool and clean, so there is no soot on your brass, your jar or the wall behind it. That matters when the candle sits in a pooja room every evening.",
            },
            {
              title: "It lasts noticeably longer",
              body: "A lower burn temperature means the same amount of wax runs 30–50% longer than paraffin. You are paying per piece, but you are buying hours.",
            },
            {
              title: "The scent actually carries",
              body: "Soy holds fragrance oil better and releases it slowly instead of burning it off. The room smells the same in hour four as it did in hour one.",
            },
            {
              title: "Imported, skin-safe oils",
              body: "IFRA-grade fragrance oils, not industrial perfume. Safe around children, and safe to burn in a closed room through an evening.",
            },
            {
              title: "Cotton wicks, no metal core",
              body: "Lead-free braided cotton. Nothing metallic in the flame, and a wick that curls and self-trims instead of mushrooming.",
            },
            {
              title: "Poured, sculpted, finished by hand",
              body: "Every flower, fold and petal on these pieces is shaped by hand in Greater Noida. No two are stamped identical, and that is the point.",
            },
          ].map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 80}>
              <div className="h-px w-10 bg-ember" />
              <h3 className="mt-5 font-display text-[1.15rem] leading-snug text-ink">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[0.925rem] leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1240px] px-5 pt-28 sm:px-8">
        <div className="rounded-[20px] border border-line bg-surface px-6 py-14 sm:px-12">
          <Reveal className="max-w-xl">
            <p className="eyebrow">Ordering</p>
            <h2 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.5rem)] leading-tight tracking-[-0.015em] text-ink">
              Three steps, no back and forth
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 90}>
                <p className="font-display text-[2.4rem] leading-none text-ember-wash">
                  {step.n}
                </p>
                <h3 className="mt-4 font-display text-[1.2rem] text-ink">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[0.925rem] leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="mt-12">
            <Link
              href="/terms"
              className="group inline-flex items-center gap-2 text-[0.95rem] text-ember transition-colors hover:text-ember-deep"
            >
              Read the full terms
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
