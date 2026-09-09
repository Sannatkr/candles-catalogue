"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Card, Field, Input, Notice, Select, SubmitButton, Textarea, Toggle } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { saveProduct } from "@/lib/admin/actions";
import type { AdminCollection, AdminProduct } from "@/lib/admin/queries";
import { slugify } from "@/lib/slug";
import type { BulkTier } from "@/lib/types";

export function ProductForm({
  product,
  collections,
  tiers,
}: {
  product: AdminProduct | null;
  collections: AdminCollection[];
  /** The ladder from Settings, so each rung gets a price box of its own. */
  tiers: BulkTier[];
}) {
  const [state, action] = useActionState(saveProduct, IDLE);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  // Kept in state so the automatic rung prices below update as it is typed.
  const [basePrice, setBasePrice] = useState(product?.base_price ?? 0);

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const overrides = product?.tier_prices ?? {};

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

          <Field
            label="Search words"
            hint="Comma separated. What a buyer might type: lotus, diwali, brass, return gift."
            className="sm:col-span-2"
          >
            <Input
              name="keywords"
              defaultValue={(product?.keywords ?? []).join(", ")}
              placeholder="lotus, urli, brass, diwali, gifting"
            />
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
        hint="The price for one piece, and what a rung of the bulk ladder costs. Past the online ceiling the buyer gets the enquiry form instead of the checkout."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price per piece (₹)">
            <Input
              type="number"
              name="base_price"
              min={0}
              step="1"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
              required
            />
          </Field>

          <Field
            label="MRP"
            hint="Shown struck through beside the price. Leave at 0 to show no discount. Only set this to a price you would genuinely sell at."
          >
            <Input type="number" name="mrp" min={0} step="1" defaultValue={product?.mrp ?? 0} />
          </Field>

          <Field
            label="Sold in sets of"
            hint="1 for most candles. 10 for the mithai candles — buyers take 10, 20, 30… or type any number of 10 or more."
          >
            <Input type="number" name="min_qty" min={1} step="1" defaultValue={product?.min_qty ?? 1} />
          </Field>

          <Field
            label="Most that can be bought online"
            hint="Set by how big it is — 7 for a peacock urli, 300 for a mithai set. Past this the buyer gets the bulk enquiry form instead of the checkout."
          >
            <Input type="number" name="max_qty" min={0} step="1" defaultValue={product?.max_qty ?? 0} />
          </Field>

          <Field
            label="Free delivery from (pcs)"
            hint="This many of this one design and the whole order ships free. 0 switches it off — use that on anything heavy where the freight would eat the order."
          >
            <Input
              type="number"
              name="free_ship_qty"
              min={0}
              step="1"
              defaultValue={product?.free_ship_qty ?? 0}
            />
          </Field>

          <Toggle
            name="bulk_pricing"
            label="Bulk slabs apply"
            hint="Off for anything already at its bulk price — the mithai candles sold in sets of ten."
            defaultChecked={product?.bulk_pricing ?? true}
          />

          {tiers.length > 0 && (
            <div className="sm:col-span-2">
              {/* Carries the rungs that are not on screen, so a price set
                  against a rung later removed from Settings is not lost. */}
              <input
                type="hidden"
                name="tier_prices_existing"
                value={JSON.stringify(overrides)}
                readOnly
              />
              <p className="text-[0.82rem] font-medium text-ink">Price at each bulk quantity (₹)</p>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-ink-soft">
                Leave a box empty and that rung follows the percentage in Settings — the greyed
                number is what it works out to. Type a price to fix that rung on this candle only.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {tiers.map((tier) => {
                  const auto = Math.round(basePrice * (1 - tier.percentOff / 100));
                  return (
                    <label key={tier.minQty} className="block">
                      <span className="mb-2 block text-[0.75rem] text-ink-faint tabular-nums">
                        {tier.minQty}+ pcs
                      </span>
                      <Input
                        type="number"
                        name={`tier_price_${tier.minQty}`}
                        min={0}
                        step="1"
                        placeholder={String(auto)}
                        defaultValue={overrides[String(tier.minQty)] ?? ""}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
          <Field label="Height (cm)">
            <Input type="number" step="0.1" name="height_cm" min={0} defaultValue={product?.height_cm ?? 0} />
          </Field>
          <Field label="Diameter (cm)">
            <Input type="number" step="0.1" name="diameter_cm" min={0} defaultValue={product?.diameter_cm ?? 0} />
          </Field>
          <Field
            label="Pack weight (g)"
            hint="What a courier bills for one piece once it is boxed — usually well above the wax weight (a big urli can be 1500–2500 g). Leave 0 to auto-estimate from the size. This sets the shipping cost."
          >
            <Input
              type="number"
              step="1"
              name="pack_weight_grams"
              min={0}
              defaultValue={product?.pack_weight_grams ?? 0}
            />
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
