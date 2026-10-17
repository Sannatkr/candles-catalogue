import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
import { collageImages } from "@/lib/collage";
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
        {collections.map((collection, i) => (
          <Reveal key={collection.id} delay={i * 70} className="h-full">
            <CollectionCard
              collection={collection}
              images={collageImages(collection, products)}
              count={products.filter((p) => p.collectionSlug === collection.slug).length}
              priority={i < 3}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
