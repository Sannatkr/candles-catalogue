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
    <div className="mx-auto max-w-[1240px] px-5 pt-10 sm:px-8 sm:pt-16 lg:pt-20">
      <Reveal>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.3rem,5.5vw,3.7rem)] leading-[1.05] tracking-[-0.02em] text-ink">
          Collections
        </h1>
        <p className="mt-5 max-w-[54ch] text-[1.02rem] leading-relaxed text-ink-soft">
          Each collection is priced and produced a little differently. Open one to see every design in it
          with sizes and prices.
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

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, i) => {
          const count = products.filter((p) => p.collectionSlug === collection.slug).length;

          return (
            <Reveal key={collection.id} delay={i * 70} className="h-full">
              <Link
                href={`/collections/${collection.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-surface transition-colors hover:border-ink/25"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-canvas-deep sm:aspect-4/5">
                  <Image
                    src={collection.coverImage}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow">
                    {collection.tagline} · {count} {count === 1 ? "design" : "designs"}
                  </p>
                  <h2 className="mt-3 font-display text-[1.6rem] leading-tight text-ink transition-colors group-hover:text-ember">
                    {collection.name}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-[0.92rem] leading-relaxed text-ink-soft">
                    {collection.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-[0.9rem] text-ember">
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
