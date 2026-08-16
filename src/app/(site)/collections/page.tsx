import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
import { getCollections, getProducts } from "@/lib/data";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-16 sm:px-8 lg:pt-20">
      <Reveal>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.3rem,5.5vw,3.7rem)] leading-[1.05] tracking-[-0.02em] text-ink">
          Collections
        </h1>
        <p className="mt-5 max-w-[54ch] text-[1.02rem] leading-relaxed text-ink-soft">
          Each collection is priced and produced a little differently. Open one to see every design in it
          with sizes, slabs and minimum quantities.
        </p>
      </Reveal>

      {collections.length === 0 && (
        <div className="mt-14">
          <EmptyState
            title="No collections yet"
            body="They are being set up. Message us and we will send what you are looking for directly."
          />
        </div>
      )}

      <div className="mt-14 space-y-5">
        {collections.map((collection, i) => {
          const count = products.filter((p) => p.collectionSlug === collection.slug).length;

          return (
            <Reveal key={collection.id} delay={i * 70}>
              <Link
                href={`/collections/${collection.slug}`}
                className="group grid overflow-hidden rounded-[18px] border border-line bg-surface transition-colors hover:border-ink/25 md:grid-cols-[minmax(0,340px)_1fr]"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-canvas-deep md:aspect-auto md:min-h-[240px]">
                  <Image
                    src={collection.coverImage}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 768px) 92vw, 340px"
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                </div>

                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <p className="eyebrow">
                    {collection.tagline} · {count} {count === 1 ? "design" : "designs"}
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.15rem)] leading-tight text-ink transition-colors group-hover:text-ember">
                    {collection.name}
                  </h2>
                  <p className="mt-3 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
                    {collection.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[0.9rem] text-ember">
                    Open collection
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
