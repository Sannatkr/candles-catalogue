"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Field, Input, Notice, Select, SubmitButton, Textarea } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { createBooking } from "@/lib/admin/actions";
import { BOOKING_STATUSES, STATUS_LABEL } from "@/lib/admin/booking-status";
import { money, priceFor } from "@/lib/format";
import type { Product } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

/** Rate is kept as text so an empty box can mean "use the listed slab rate". */
type Line = { slug: string; qty: number; rate: string };

export function BookingForm({ products, fragrances }: { products: Product[]; fragrances: string[] }) {
  const [state, action] = useActionState(createBooking, IDLE);
  const [lines, setLines] = useState<Line[]>([{ slug: products[0]?.slug ?? "", qty: 1, rate: "" }]);
  const [status, setStatus] = useState("paid");

  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const needsPaidDate = status === "paid" || status === "fulfilled";

  const priced = lines.map((line) => {
    const product = bySlug.get(line.slug);
    // Suggest the slab rate for the quantity, but let it be overwritten — an
    // offline deal is exactly where the listed rate stops applying.
    const suggested = product ? priceFor(product, line.qty) : 0;
    const rate = line.rate === "" ? suggested : Number(line.rate);
    const unitPrice = Number.isFinite(rate) ? rate : 0;
    return { ...line, product, suggested, unitPrice, total: Math.round(unitPrice * line.qty) };
  });

  const pieces = priced.reduce((sum, l) => sum + (l.qty || 0), 0);
  const orderTotal = priced.reduce((sum, l) => sum + l.total, 0);

  const update = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line, idx) => (idx === i ? { ...line, ...patch } : line)));

  // Only the three things the server needs; names and photos are looked up there
  // so the order can never carry a stale product name.
  const payload = priced.map((l) => ({ slug: l.slug, qty: l.qty, unitPrice: l.unitPrice }));

  return (
    <form action={action} className="space-y-6 pb-24">
      <Notice ok={state.ok} message={state.message} />

      <Card
        title="What was sold"
        hint="For orders taken offline — on Instagram, at a stall, over a call. Add a row per candle."
      >
        <input type="hidden" name="items" value={JSON.stringify(payload)} readOnly />

        <div className="space-y-3">
          {priced.map((line, i) => {
            // A wide screen labels the columns once at the top. A phone stacks
            // the rows, so every line has to label its own boxes.
            const labelOnPhone = i > 0 ? "sm:[&>span:first-child]:hidden" : "";
            return (
            <div key={i} className="rounded-[12px] border border-line bg-surface p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_auto] sm:items-end">
                <Field label="Candle" className={`col-span-2 sm:col-span-1 ${labelOnPhone}`}>
                  <Select
                    value={line.slug}
                    onChange={(e) => update(i, { slug: e.target.value, rate: "" })}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Qty" className={labelOnPhone}>
                  <Input
                    type="number"
                    min={1}
                    value={line.qty || ""}
                    onChange={(e) => update(i, { qty: Math.max(0, Number(e.target.value)) })}
                    required
                  />
                </Field>

                <Field label="Rate each" className={labelOnPhone}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.rate}
                    onChange={(e) => update(i, { rate: e.target.value })}
                    placeholder={String(line.suggested || "")}
                  />
                </Field>

                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end sm:pb-2.5">
                  <span className="text-[0.9rem] text-ink tabular-nums">{money(line.total)}</span>
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={lines.length === 1}
                    aria-label={`Remove ${line.product?.name ?? "this line"}`}
                    className="rounded-full p-2 text-ink-faint transition-colors hover:text-ember-deep disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {line.suggested > 0 && line.unitPrice !== line.suggested && (
                <p className="mt-2 text-[0.75rem] text-ink-faint">
                  Listed rate at {line.qty} pcs is {money(line.suggested)}.
                </p>
              )}
            </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            setLines((prev) => [...prev, { slug: products[0]?.slug ?? "", qty: 1, rate: "" }])
          }
          className="mt-3 inline-flex items-center gap-1.5 text-[0.85rem] text-ember transition-colors hover:text-ember-deep"
        >
          <Plus size={15} />
          Add another candle
        </button>

        <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
          <p className="text-[0.8rem] text-ink-faint">
            {lines.length} {lines.length === 1 ? "candle" : "candles"} · {pieces} pcs
          </p>
          <p className="font-display text-[1.35rem] text-ink tabular-nums">{money(orderTotal)}</p>
        </div>
      </Card>

      <Card title="Who bought it" hint="All optional — fill in whatever you have.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name">
            <Input name="buyer_name" placeholder="Walk-in, or a shop name" />
          </Field>
          <Field label="Instagram username">
            <Input name="buyer_contact" placeholder="without the @" autoCapitalize="none" />
          </Field>
          <Field label="Phone">
            <Input name="phone" inputMode="tel" />
          </Field>
          <Field label="Pincode">
            <Input name="pincode" inputMode="numeric" maxLength={6} />
          </Field>
          <Field label="City or state">
            <Input name="state" placeholder="Greater Noida, Uttar Pradesh" />
          </Field>
          <Field label="Fragrance" hint="For the whole order.">
            <Select name="fragrance" defaultValue="">
              <option value="">Not recorded</option>
              {fragrances.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
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
