import { notFound } from "next/navigation";
import { CollectionBanner } from "@/components/collection-banner";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { showcaseProducts } from "@/lib/collage";
import { getCollection, getCollections, getProducts, inCollection } from "@/lib/data";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  return {
    title: collection?.name ?? "Collection",
    description: collection?.tagline,
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collection, all] = await Promise.all([getCollection(slug), getProducts()]);
  if (!collection) notFound();

  const products = all.filter((p) => inCollection(p, slug));
  // The dearest pieces float in the banner; the cheapest sets the "from".
  const floating = showcaseProducts(collection, all).sort((a, b) => b.basePrice - a.basePrice);
  const from = products.length ? Math.min(...products.map((p) => p.basePrice)) : 0;

  return (
    <>
      <CollectionBanner collection={collection} products={floating} count={products.length} from={from} />

      <section className="mx-auto max-w-[1240px] px-5 pt-14 sm:px-8">
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
