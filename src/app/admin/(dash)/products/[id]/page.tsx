import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct, listAdminCollections } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, collections] = await Promise.all([getAdminProduct(id), listAdminCollections()]);
  if (!product) notFound();

  return (
    <>
      <p className="eyebrow">Editing</p>
      <h1 className="mt-3 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        {product.name}
      </h1>
      <ProductForm product={product} collections={collections} />
    </>
  );
}
