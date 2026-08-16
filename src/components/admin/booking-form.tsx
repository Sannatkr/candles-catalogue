"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Card, Field, Input, Notice, Select, SubmitButton, Textarea } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { createBooking } from "@/lib/admin/actions";
import { BOOKING_STATUSES, STATUS_LABEL } from "@/lib/admin/booking-status";
import { money, priceFor } from "@/lib/format";
import type { Product } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export function BookingForm({ products, fragrances }: { products: Product[]; fragrances: string[] }) {
  const [state, action] = useActionState(createBooking, IDLE);
  const [slug, setSlug] = useState(products[0]?.slug ?? "");
  const [qty, setQty] = useState(10);
  const [status, setStatus] = useState("paid");
  const [rate, setRate] = useState<string>("");

  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  // Suggest the slab rate for the quantity, but let it be overwritten — an
  // offline deal is exactly where the listed rate stops applying.
  const suggested = product ? priceFor(product, qty) : 0;
  const effective = rate === "" ? suggested : Number(rate);
  const needsPaidDate = status === "paid" || status === "fulfilled";

  return (
    <form action={action} className="space-y-6 pb-24">
      <Notice ok={state.ok} message={state.message} />

      <Card title="What was sold" hint="For orders taken offline — on Instagram, at a stall, over a call.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Candle" className="sm:col-span-2">
            <Select name="product_slug" value={slug} onChange={(e) => setSlug(e.target.value)} required>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Quantity">
            <Input
              type="number"
              name="quantity"
              min={1}
              value={qty || ""}
              onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
              required
            />
          </Field>

          <Field
            label="Rate per piece"
            hint={suggested ? `Listed rate at this quantity is ${money(suggested)}.` : undefined}
          >
            <Input
              type="number"
              name="unit_price"
              min={0}
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder={String(suggested || "")}
              required
            />
          </Field>

          <Field label="Fragrance">
            <Select name="fragrance" defaultValue={product?.fragrance ?? ""}>
              <option value="">Not recorded</option>
              {fragrances.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-end">
            <div className="w-full rounded-[10px] border border-line bg-surface px-4 py-3">
              <p className="text-[0.75rem] text-ink-faint">Order total</p>
              <p className="mt-0.5 font-display text-[1.35rem] text-ink">
                {money((Number.isFinite(effective) ? effective : 0) * qty)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Who bought it" hint="All optional — fill in whatever you have.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name">
            <Input name="buyer_name" placeholder="Walk-in, or a shop name" />
          </Field>
          <Field label="Phone or Instagram">
            <Input name="buyer_contact" />
          </Field>
          <Field label="Pincode">
            <Input name="pincode" inputMode="numeric" maxLength={6} />
          </Field>
          <Field label="City or state">
            <Input name="state" placeholder="Greater Noida, Uttar Pradesh" />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Textarea name="note" className="min-h-[80px]" placeholder="Anything worth remembering." />
          </Field>
        </div>
      </Card>

      <Card title="Status" hint="Paid and Fulfilled are the two that count towards revenue.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Where this order stands">
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>

          {needsPaidDate && (
            <Field label="Payment received on" hint="Revenue is reported against this date.">
              <Input type="date" name="paid_on" defaultValue={today()} max={today()} />
            </Field>
          )}
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-end gap-3 px-5 py-4 sm:px-8">
          <Link
            href="/admin/bookings"
            className="rounded-full border border-line px-6 py-3 text-[0.9rem] text-ink transition-colors hover:border-ink"
          >
            Cancel
          </Link>
          <SubmitButton>Save booking</SubmitButton>
        </div>
      </div>
    </form>
  );
}
