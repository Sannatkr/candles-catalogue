import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flame, Layers, Package, Tag } from "lucide-react";
import { LotusMotif } from "@/components/lotus-motif";
import { money } from "@/lib/format";
import type { Collection, Product } from "@/lib/types";

/**
 * The opening of a collection page. Not a cover photograph with the title
 * stamped on it: a dark engraved ground, the lotus rosette turning slowly
 * behind, and the collection's own candles drifting in the air beside the
 * name — with the four facts a buyer wants first (how many designs, the
 * price it starts from, what it is poured in, what bulk does to the price)
 * set out as a small infographic.
 *
 * All the motion is CSS, so nothing here needs JavaScript to move and it
 * all stops for anyone who has asked for reduced motion.
 */
export function CollectionBanner({
  collection,
  products,
  count,
  from,
}: {
  collection: Collection;
  /** Up to five pieces to float, dearest first. */
  products: Product[];
  count: number;
  /** The lowest price in the collection, one piece. */
  from: number;
}) {
  // Where each floating photograph sits, on a 12-column canvas: left, top,
  // width, tilt, and which drift it follows. Laid out so no two overlap and
  // the dearest piece is the biggest.
  const slots = [
    { left: "34%", top: "8%", w: "38%", cls: "drift-a", z: 3 },
    { left: "2%", top: "26%", w: "30%", cls: "drift-b", z: 2 },
    { left: "68%", top: "38%", w: "30%", cls: "drift-c", z: 2 },
    { left: "16%", top: "62%", w: "26%", cls: "drift-c", z: 1 },
    { left: "48%", top: "66%", w: "24%", cls: "drift-b", z: 1 },
  ];

  const facts = [
    { icon: Layers, label: "Designs", value: `${count}` },
    { icon: Tag, label: "From", value: money(from) },
    { icon: Flame, label: "Wax", value: "100% soy" },
    { icon: Package, label: "Bulk", value: "Rates on the page" },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-ink text-canvas">
      {/* Light: a warm rise from the lower left and a gold wash top right,
          breathing slowly so the ground is never flat. */}
      <span
        aria-hidden
        className="glow-breathe pointer-events-none absolute inset-0 bg-[radial-gradient(110%_120%_at_6%_110%,rgba(180,95,43,0.38)_0%,transparent_58%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_100%_at_92%_-10%,rgba(229,192,123,0.22)_0%,transparent_60%)]"
      />
      {/* The rosette, turning once every couple of minutes. */}
      {/* On a phone the rosette sits up in the corner, out from behind the
          words; from `sm` up it fills the ground. */}
      <LotusMotif className="spin-slow pointer-events-none absolute top-[6%] left-[88%] h-[70%] -translate-x-1/2 -translate-y-1/2 text-[#e5c07b]/18 sm:top-1/2 sm:left-1/2 sm:h-[150%] lg:left-[72%]" />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 pt-8 pb-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-10 lg:pb-20">
        <div className="rise-in">
          <Link
            href="/collections"
            className="group inline-flex items-center gap-2 text-[0.85rem] text-canvas/65 transition-colors hover:text-canvas"
          >
            <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
            All collections
          </Link>

          <p className="mt-8 text-[0.7rem] font-semibold tracking-[0.2em] text-[#e5c07b] uppercase">{collection.tagline}</p>
          <h1 className="mt-3 font-display text-[clamp(2.3rem,5.6vw,3.9rem)] leading-[1.02] tracking-[-0.02em] text-canvas">
            {collection.name}
          </h1>
          <p className="mt-5 max-w-[56ch] text-[1rem] leading-relaxed text-canvas/72 sm:text-[1.05rem]">
            {collection.description}
          </p>

          <dl className="mt-8 grid max-w-[34rem] grid-cols-2 gap-2.5 sm:grid-cols-4">
            {facts.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="rise-in rounded-[12px] border border-canvas/12 bg-canvas/[0.06] px-3.5 py-3 backdrop-blur-sm"
                  style={{ animationDelay: `${160 + i * 90}ms` }}
                >
                  <dt className="flex items-center gap-1.5 text-[0.66rem] tracking-[0.14em] text-canvas/55 uppercase">
                    <Icon size={12} className="text-[#e5c07b]" />
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-[1.1rem] leading-tight text-canvas">{f.value}</dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* The candles, in the air. A phone gets a neat row of three, the
            middle one lifted; from `sm` up the five take their places on the
            canvas. */}
        <div className="relative flex w-full items-end justify-center gap-3 px-1 sm:block sm:aspect-[4/3] sm:px-0 lg:aspect-[5/4]">
          {products.slice(0, 5).map((p, i) => {
            const s = slots[i];
            return (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                aria-label={p.name}
                style={
                  {
                    "--l": s.left,
                    "--t": s.top,
                    "--w": s.w,
                    zIndex: s.z,
                    animationDelay: `${i * -1.7}s`,
                  } as React.CSSProperties
                }
                className={`${s.cls} group block w-[30%] sm:absolute sm:top-(--t) sm:left-(--l) sm:w-(--w) ${
                  i === 1 ? "-translate-y-4 sm:translate-y-0" : ""
                } ${i >= 3 ? "hidden sm:block" : ""}`}
              >
                <span className="rise-in relative block aspect-4/5 overflow-hidden rounded-[16px] bg-ink/40 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)] ring-1 ring-[#e5c07b]/40 transition-shadow duration-500 group-hover:ring-[#e5c07b]/80" style={{ animationDelay: `${120 + i * 110}ms` }}>
                  <Image
                    src={p.images[0]}
                    alt=""
                    fill
                    priority={i === 0}
                    sizes="(max-width: 640px) 40vw, (max-width: 1024px) 30vw, 20vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                  <span className="absolute inset-x-0 bottom-0 translate-y-1 bg-linear-to-t from-ink/80 to-transparent px-3 pt-6 pb-2.5 text-[0.72rem] text-canvas opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                    {p.name}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
