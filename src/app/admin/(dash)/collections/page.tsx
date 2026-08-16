import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteCollection } from "@/lib/admin/actions";
import { listAdminCollections, listAdminProducts } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; inuse?: string }>;
}) {
  const [{ saved, deleted, inuse }, collections, products] = await Promise.all([
    searchParams,
    listAdminCollections(),
    listAdminProducts(),
  ]);

  const countOf = (slug: string) => products.filter((p) => p.collection_slug === slug).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
            Collections
          </h1>
        </div>
        <Link
          href="/admin/collections/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
        >
          <Plus size={16} />
          Add collection
        </Link>
      </div>

      {inuse && (
        <p className="mt-6 rounded-[10px] bg-ember-wash px-4 py-3 text-[0.875rem] text-ember-deep">
          That collection still has products in it. Move or delete those first.
        </p>
      )}
      {(saved || deleted) && (
        <p className="mt-6 rounded-[10px] bg-[#eaf0e6] px-4 py-3 text-[0.875rem] text-[#41552f]">
          {saved ? "Saved. The live site is already updated." : "Deleted."}
        </p>
      )}

      <ul className="mt-8 space-y-2.5">
        {collections.map((collection) => (
          <li
            key={collection.id}
            className="flex items-center gap-4 rounded-[14px] border border-line bg-canvas p-3 pr-4"
          >
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
              {collection.cover_image && (
                <Image src={collection.cover_image} alt="" fill sizes="96px" className="object-cover" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[1.05rem] text-ink">{collection.name}</p>
              <p className="mt-0.5 truncate text-[0.8rem] text-ink-soft">
                {countOf(collection.slug)} products · /{collection.slug}
              </p>
            </div>

            <Link
              href={`/admin/collections/${collection.id}`}
              className="rounded-full border border-line px-4 py-2 text-[0.825rem] text-ink transition-colors hover:border-ink"
            >
              Edit
            </Link>

            <form action={deleteCollection}>
              <input type="hidden" name="id" value={collection.id} />
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
    </>
  );
}
