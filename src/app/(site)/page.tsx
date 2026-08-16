import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { getCollections, getFeaturedProducts, getSettings } from "@/lib/data";

const FACTS = [
  { label: "Poured", value: "By hand, small batch" },
  { label: "Order from", value: "A single piece" },
  { label: "Lead time", value: "7–10 working days" },
  { label: "Private label", value: "From 500 pieces" },
];

const STEPS = [
  {
    n: "01",
    title: "Browse and shortlist",
    body: "Everything is here — sizes, burn time, packing and price slabs. Nothing hidden behind a phone call.",
  },
  {
    n: "02",
    title: "Send us the list",
    body: "Send us the product names and quantities on Instagram. We send a proforma invoice the same working day.",
  },
  {
    n: "03",
    title: "Advance and production",
    body: "65% advance starts production. We share photographs before dispatch, and the balance is due then.",
  },
];

export default async function HomePage() {
  const [settings, collections, featured] = await Promise.all([
    getSettings(),
    getCollections(),
    getFeaturedProducts(6),
  ]);

  const hero = collections[0]?.coverImage ?? "/placeholders/candle-01.svg";
  const heroAlt = collections[1]?.coverImage ?? "/placeholders/candle-05.svg";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-ember-wash blur-[120px]" />

        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
          <Reveal>
            <p className="eyebrow">Wholesale Catalogue</p>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6.5vw,4.6rem)] leading-[1.02] tracking-[-0.02em] text-ink">
              Candles worth
              <br />
              <span className="text-ember italic">lighting twice.</span>
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

          <Reveal delay={120} className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-[20px] bg-canvas-deep sm:aspect-3/4">
              <Image
                src={hero}
                alt="Sugandha Candles"
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-4 hidden aspect-square w-[42%] overflow-hidden rounded-[16px] border-[6px] border-canvas bg-canvas-deep sm:block">
              <Image
                src={heroAlt}
                alt=""
                fill
                sizes="24vw"
                className="object-cover"
              />
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

      {/* Collections */}
      {collections.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pt-24 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The range</p>
              <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.85rem)] leading-tight tracking-[-0.015em] text-ink">
                {collections.length === 1 ? "One collection" : `${collections.length} collections`}
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

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {collections.map((collection, i) => (
              <Reveal key={collection.id} delay={i * 80}>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-16/11 overflow-hidden rounded-card bg-canvas-deep">
                    <Image
                      src={collection.coverImage}
                      alt={collection.name}
                      fill
                      sizes="(max-width: 640px) 92vw, 46vw"
                      className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="text-[0.7rem] tracking-[0.18em] text-canvas/70 uppercase">
                        {collection.tagline}
                      </p>
                      <h3 className="mt-1.5 font-display text-[1.6rem] text-canvas">
                        {collection.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pt-24 sm:px-8">
          <Reveal>
            <p className="eyebrow">Most ordered</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.85rem)] leading-tight tracking-[-0.015em] text-ink">
              What buyers start with
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
