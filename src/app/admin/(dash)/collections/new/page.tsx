import { CollectionForm } from "@/components/admin/collection-form";

export const dynamic = "force-dynamic";

export default function NewCollectionPage() {
  return (
    <>
      <p className="eyebrow">New</p>
      <h1 className="mt-3 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Add a collection
      </h1>
      <CollectionForm collection={null} />
    </>
  );
}
