import { EmptyState } from "@/components/empty-state";
import { OfferBanner } from "@/components/offer-banner";
import { ProductBrowser } from "@/components/product-browser";
import { Reveal } from "@/components/reveal";
import { getProducts } from "@/lib/data";
import { showcaseProducts } from "@/lib/gift";

export const metadata = { title: "All Products" };

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <OfferBanner showcase={showcaseProducts(products)} />

      <div className="mx-auto max-w-[1240px] px-5 pt-10 sm:px-8 sm:pt-16 lg:pt-20">
        <Reveal>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-4 font-display text-[clamp(2.3rem,5.5vw,3.7rem)] leading-[1.05] tracking-[-0.02em] text-ink">
            Every design we make
          </h1>
          <p className="mt-5 max-w-[54ch] text-[1.02rem] leading-relaxed text-ink-soft">
            Search by name, shape, occasion or fragrance. All prices are per
            piece.
          </p>
        </Reveal>

        {products.length === 0 ? (
          <div className="mt-14">
            <EmptyState
              title="Nothing published yet"
              body="The range is going up right now. Message us and we will send what you are looking for directly."
            />
          </div>
        ) : (
          <ProductBrowser products={products} />
        )}
      </div>
    </>
  );
}
