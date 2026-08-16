import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/admin/collection-form";
import { getAdminCollection } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await getAdminCollection(id);
  if (!collection) notFound();

  return (
    <>
      <p className="eyebrow">Editing</p>
      <h1 className="mt-3 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        {collection.name}
      </h1>
      <CollectionForm collection={collection} />
    </>
  );
}
