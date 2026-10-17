import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Collection } from "@/lib/types";

/**
 * A collection shown as three of its own candles rather than one cover
 * photograph: one tall picture, two square ones beside it. Three pieces say
 * "a range" the way a single shot never can.
 */
export function CollectionCollage({
  images,
  name,
  priority = false,
}: {
  images: string[];
  name: string;
  priority?: boolean;
}) {
  const [a, b, c] = images;
  const tile = "relative overflow-hidden bg-canvas-deep";
  const img =
    "object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]";

  return (
    <div className="grid aspect-[4/3] grid-cols-[1.35fr_1fr] grid-rows-2 gap-1.5 sm:gap-2">
      <div className={`${tile} row-span-2 rounded-l-[14px]`}>
        <Image src={a} alt={name} fill priority={priority} sizes="(max-width: 640px) 55vw, 22vw" className={img} />
      </div>
      <div className={`${tile} rounded-tr-[14px]`}>
        <Image src={b} alt="" fill sizes="(max-width: 640px) 40vw, 16vw" className={img} />
      </div>
      <div className={`${tile} rounded-br-[14px]`}>
        <Image src={c} alt="" fill sizes="(max-width: 640px) 40vw, 16vw" className={img} />
      </div>
    </div>
  );
}

export function CollectionCard({
  collection,
  images,
  count,
  priority = false,
}: {
  collection: Collection;
  images: string[];
  count: number;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-surface p-2 transition-colors hover:border-ink/25"
    >
      <CollectionCollage images={images} name={collection.name} priority={priority} />

      <div className="flex flex-1 flex-col px-4 pt-5 pb-4">
        <p className="eyebrow">
          {collection.tagline} · {count} {count === 1 ? "design" : "designs"}
        </p>
        <h3 className="mt-2.5 font-display text-[1.5rem] leading-tight text-ink transition-colors group-hover:text-ember">
          {collection.name}
        </h3>
        <p className="mt-2.5 line-clamp-2 text-[0.9rem] leading-relaxed text-ink-soft">{collection.description}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-4 text-[0.875rem] text-ember">
          Open collection
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
