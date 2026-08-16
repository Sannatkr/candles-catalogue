import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminCollections } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const collections = await listAdminCollections();

  if (collections.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center">
        <p className="font-display text-[1.25rem] text-ink">Make a collection first</p>
        <p className="mx-auto mt-2 max-w-[44ch] text-[0.9rem] leading-relaxed text-ink-soft">
          Every candle belongs to a collection, so there needs to be at least one before you can add a
          product.
        </p>
        <Link
          href="/admin/collections/new"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
        >
          Create a collection
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">New</p>
      <h1 className="mt-3 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Add a candle
      </h1>
      <ProductForm product={null} collections={collections} />
    </>
  );
}
