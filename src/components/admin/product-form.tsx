"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { PriceTiers } from "@/components/admin/price-tiers";
import { Card, Field, Input, Notice, Select, SubmitButton, Textarea, Toggle } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { saveProduct } from "@/lib/admin/actions";
import type { AdminCollection, AdminProduct } from "@/lib/admin/queries";
import { slugify } from "@/lib/slug";

export function ProductForm({
  product,
  collections,
}: {
  product: AdminProduct | null;
  collections: AdminCollection[];
}) {
  const [state, action] = useActionState(saveProduct, IDLE);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));

  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={action} className="space-y-6 pb-24">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Notice ok={state.ok} message={state.message} />

      <Card title="The basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amber Oud Jar"
              required
            />
          </Field>

          <Field label="Collection">
            <Select name="collection_slug" defaultValue={product?.collection_slug ?? ""} required>
              <option value="" disabled>
                Choose one…
              </option>
              {collections.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Web address" hint="Fills itself from the name. Change only if you need to.">
            <Input
              name="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="amber-oud-jar"
            />
          </Field>

          <Field label="One-line hook" className="sm:col-span-2">
            <Input name="tagline" defaultValue={product?.tagline ?? ""} placeholder="Warm, resinous, a little smoky" />
          </Field>

          <Field label="Description" className="sm:col-span-2">
            <Textarea
              name="description"
              defaultValue={product?.description ?? ""}
              placeholder="What it smells like, who it suits, anything a buyer would otherwise ask you on a call."
            />
          </Field>
        </div>
      </Card>

      <Card title="Photos" hint="The first photo is the one buyers see on the grid. Drag order with the arrows.">
        <div className="space-y-7">
          <ImageUploader
            name="images"
            label="Product photos"
            hint="Square or portrait works best. Up to 8 MB each."
            initial={product?.images ?? []}
            multiple
          />
          <ImageUploader
            name="size_chart_image"
            label="Size guide image"
            hint="Optional. A drawing or photo showing the measurements."
            initial={product?.size_chart_image ? [product.size_chart_image] : []}
            multiple={false}
            folder="size-charts"
          />
        </div>
      </Card>

      <Card
        title="Pricing"
        hint="There is no minimum order, so start your first slab at 1 piece — that is the single-piece rate."
      >
        <PriceTiers name="price_tiers" initial={product?.price_tiers ?? []} />
      </Card>

      <Card title="Specification">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Fragrance">
            <Input name="fragrance" defaultValue={product?.fragrance ?? ""} placeholder="Amber, Oud, Sandalwood" />
          </Field>
          <Field label="Wax">
            <Input name="wax_type" defaultValue={product?.wax_type ?? ""} placeholder="Soy & Coconut blend" />
          </Field>
          <Field label="Wick">
            <Input name="wick_type" defaultValue={product?.wick_type ?? ""} placeholder="Cotton, single" />
          </Field>
          <Field label="Burn time (hours)">
            <Input type="number" name="burn_time_hours" min={0} defaultValue={product?.burn_time_hours ?? 0} />
          </Field>
          <Field label="Height (cm)">
            <Input type="number" step="0.1" name="height_cm" min={0} defaultValue={product?.height_cm ?? 0} />
          </Field>
          <Field label="Diameter (cm)">
            <Input type="number" step="0.1" name="diameter_cm" min={0} defaultValue={product?.diameter_cm ?? 0} />
          </Field>
          <Field label="Net weight (grams)">
            <Input type="number" name="weight_grams" min={0} defaultValue={product?.weight_grams ?? 0} />
          </Field>
          <Field label="Packing">
            <Input name="packaging" defaultValue={product?.packaging ?? ""} placeholder="Kraft box, 12 pcs per carton" />
          </Field>
        </div>
      </Card>

      <Card title="Where it shows">
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            name="in_stock"
            label="Ready stock"
            hint="Turn off for made-to-order designs."
            defaultChecked={product?.in_stock ?? true}
          />
          <Toggle
            name="featured"
            label="Show on the home page"
            hint="Pick your best sellers."
            defaultChecked={product?.featured ?? false}
          />
          <Field label="Position in list" hint="Lower number shows first." className="sm:col-span-2">
            <Input type="number" name="sort_order" defaultValue={product?.sort_order ?? 0} />
          </Field>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-end gap-3 px-5 py-4 sm:px-8">
          <Link
            href="/admin/products"
            className="rounded-full border border-line px-6 py-3 text-[0.9rem] text-ink transition-colors hover:border-ink"
          >
            Cancel
          </Link>
          <SubmitButton>{product ? "Save changes" : "Publish candle"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
