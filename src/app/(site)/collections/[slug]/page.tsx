import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { getCollection, getCollections, getProductsByCollection } from "@/lib/data";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  return { title: collection?.name ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const products = await getProductsByCollection(slug);

  return (
    <>
      <div className="relative">
        <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-canvas-deep">
          <Image
            src={collection.coverImage}
            alt={collection.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/75 via-ink/25 to-ink/5" />
        </div>

        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="relative -mt-24 rounded-[18px] border border-line bg-canvas p-7 sm:-mt-28 sm:p-11">
            <Link
              href="/collections"
              className="group inline-flex items-center gap-2 text-[0.85rem] text-ink-soft transition-colors hover:text-ember"
            >
              <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
              All collections
            </Link>
            <p className="eyebrow mt-6">{collection.tagline}</p>
            <h1 className="mt-3 font-display text-[clamp(2.1rem,5vw,3.3rem)] leading-[1.05] tracking-[-0.02em] text-ink">
              {collection.name}
            </h1>
            <p className="mt-5 max-w-[62ch] text-[1.02rem] leading-relaxed text-ink-soft">
              {collection.description}
            </p>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1240px] px-5 pt-16 sm:px-8">
        <p className="eyebrow">
          {products.length} {products.length === 1 ? "design" : "designs"}
        </p>

        {products.length === 0 ? (
          <p className="mt-8 text-ink-soft">Nothing published in this collection yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={(i % 3) * 80}>
                <ProductCard product={product} priority={i < 3} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
