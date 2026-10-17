"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CandlePicker } from "@/components/admin/candle-picker";
import { DatePicker, todayIso } from "@/components/admin/date-picker";
import { PincodeHint, usePincodeFill } from "@/components/admin/pincode-fill";
import { Card, Field, Input, Notice, Select, SubmitButton, Textarea } from "@/components/admin/ui";
import { IDLE } from "@/lib/admin/action-state";
import { createBooking } from "@/lib/admin/actions";
import { BOOKING_STATUSES, STATUS_LABEL } from "@/lib/admin/booking-status";
import { money } from "@/lib/format";
import { singlePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/**
 * A line is a catalogue candle (slug) or a custom one (name only). Rate is
 * kept as text so an empty box can mean "use the listed price".
 */
type Line = { slug: string; name: string; custom: boolean; qty: number; rate: string };

const fresh = (products: Product[]): Line => ({
  slug: products[0]?.slug ?? "",
  name: products[0]?.name ?? "",
  custom: false,
  qty: 1,
  rate: "",
});

export function BookingForm({ products, fragrances }: { products: Product[]; fragrances: string[] }) {
  const [state, action] = useActionState(createBooking, IDLE);
  const [lines, setLines] = useState<Line[]>([fresh(products)]);
  const [status, setStatus] = useState("paid");
  const [paidOn, setPaidOn] = useState(todayIso());
  const [pincode, setPincode] = useState("");
  const [place, setPlace] = useState("");
  const pin = usePincodeFill(pincode, place, setPlace);

  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const needsPaidDate = status === "paid" || status === "fulfilled";

  const priced = lines.map((line) => {
    const product = line.custom ? undefined : bySlug.get(line.slug);
    // Suggest the listed price, but let it be overwritten — an offline deal is
    // exactly where the listed price stops applying.
    const suggested = product ? singlePrice(product) : 0;
    const rate = line.rate === "" ? suggested : Number(line.rate);
    const unitPrice = Number.isFinite(rate) ? rate : 0;
    return { ...line, product, suggested, unitPrice, total: Math.round(unitPrice * line.qty) };
  });

  const pieces = priced.reduce((sum, l) => sum + (l.qty || 0), 0);
  const orderTotal = priced.reduce((sum, l) => sum + l.total, 0);

  const update = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line, idx) => (idx === i ? { ...line, ...patch } : line)));

  // What the server needs: a slug for a catalogue candle, a name for a custom
  // one. Names and photos for catalogue lines are looked up there, so an order
  // can never carry a stale product name.
  const payload = priced.map((l) => ({
    slug: l.custom ? "" : l.slug,
    name: l.custom ? l.name.trim() : "",
    qty: l.qty,
    unitPrice: l.unitPrice,
  }));

  return (
    <form action={action} className="space-y-6 pb-24">
      <Notice ok={state.ok} message={state.message} />

      <Card
        title="What was sold"
        hint="For orders taken offline — on Instagram, at a stall, over a call. Add a row per candle, or type in one that is not on the site."
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
                    <span className="block space-y-2">
                      <CandlePicker
                        products={products}
                        value={{ slug: line.slug, name: line.name, custom: line.custom }}
                        onChange={(choice) =>
                          update(i, {
                            slug: choice.slug,
                            name: choice.name,
                            custom: choice.custom,
                            rate: choice.custom ? line.rate : "",
                          })
                        }
                      />
                      {line.custom && (
                        <Input
                          value={line.name}
                          onChange={(e) => update(i, { name: e.target.value })}
                          placeholder="Name of the candle"
                          autoFocus
                          required
                        />
                      )}
                    </span>
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
                      placeholder={line.custom ? "₹" : String(line.suggested || "")}
                      required={line.custom}
                    />
                  </Field>

                  <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end sm:pb-2.5">
                    <span className="text-[0.9rem] text-ink tabular-nums">{money(line.total)}</span>
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={lines.length === 1}
                      aria-label={`Remove ${line.name || "this line"}`}
                      className="rounded-full p-2 text-ink-faint transition-colors hover:text-ember-deep disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {line.suggested > 0 && line.unitPrice !== line.suggested && (
                  <p className="mt-2 text-[0.75rem] text-ink-faint">
                    Listed rate is {money(line.suggested)}.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, fresh(products)])}
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
          <Field label="Address" hint="Needed only if it ships." className="sm:col-span-2">
            <Textarea
              name="address"
              className="min-h-[72px]"
              placeholder="Flat / house no., building, street, area"
            />
          </Field>
          <Field label="Pincode" hint="Fills in the city and state.">
            <Input
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <PincodeHint hint={pin.hint} looking={pin.looking} />
          </Field>
          <Field label="City or state">
            <Input
              name="state"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Greater Noida, Uttar Pradesh"
            />
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
              <DatePicker name="paid_on" value={paidOn} onChange={setPaidOn} max={todayIso()} clearable={false} />
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
