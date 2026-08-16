import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteProduct } from "@/lib/admin/actions";
import { listAdminCollections, listAdminProducts } from "@/lib/admin/queries";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const [{ saved, deleted }, products, collections] = await Promise.all([
    searchParams,
    listAdminProducts(),
    listAdminCollections(),
  ]);

  const nameOf = new Map(collections.map((c) => [c.slug, c.name]));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Products
          </h1>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
        >
          <Plus size={16} />
          Add candle
        </Link>
      </div>

      {(saved || deleted) && (
        <p className="mt-6 rounded-[10px] bg-[#eaf0e6] px-4 py-3 text-[0.875rem] text-[#41552f]">
          {saved ? "Saved. The live site is already updated." : "Deleted."}
        </p>
      )}

      {products.length === 0 ? (
        <p className="mt-10 rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center text-[0.925rem] text-ink-soft">
          Nothing here yet. The public catalogue stays empty until you add your first candle — after that
          it is live straight away.
        </p>
      ) : (
        <ul className="mt-8 space-y-2.5">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-4 rounded-[14px] border border-line bg-canvas p-3 pr-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
                {product.images?.[0] && (
                  <Image src={product.images[0]} alt="" fill sizes="64px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[1.05rem] text-ink">{product.name}</p>
                <p className="mt-0.5 truncate text-[0.8rem] text-ink-soft">
                  {nameOf.get(product.collection_slug) ?? product.collection_slug} ·{" "}
                  {money(product.base_price ?? 0)}
                  {!product.in_stock && " · made to order"}
                  {product.featured && " · on home page"}
                </p>
              </div>

              <Link
                href={`/admin/products/${product.id}`}
                className="rounded-full border border-line px-4 py-2 text-[0.825rem] text-ink transition-colors hover:border-ink"
              >
                Edit
              </Link>

              <form action={deleteProduct}>
                <input type="hidden" name="id" value={product.id} />
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-[0.825rem] text-ink-faint transition-colors hover:text-ember-deep"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
