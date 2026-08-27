"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, X } from "lucide-react";
import { Select } from "@/components/admin/ui";
import { updateBooking } from "@/lib/admin/actions";
import { IDLE } from "@/lib/admin/action-state";
import { itemsOf } from "@/lib/admin/booking-items";
import type { AdminBooking } from "@/lib/admin/queries";
import { money, priceFor } from "@/lib/format";
import type { Product } from "@/lib/types";

const FIELD =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none";
const LABEL = "text-[0.78rem] font-medium text-ink";

type EditLine = { slug: string; name: string; image: string | null; qty: number; rate: string };

export function BookingEdit({
  booking,
  products,
  onClose,
}: {
  booking: AdminBooking;
  products: Product[];
  onClose: () => void;
}) {
  const [state, save, saving] = useActionState(updateBooking, IDLE);

  const [lines, setLines] = useState<EditLine[]>(() =>
    itemsOf(booking).map((it) => ({
      slug: it.slug,
      name: it.name,
      image: it.image,
      qty: it.qty || 1,
      rate: String(it.unitPrice || ""),
    })),
  );
  const [finalTotal, setFinalTotal] = useState<string>(String(booking.totalPrice || ""));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const setLine = (i: number, patch: Partial<EditLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
  const addCustom = () => setLines((prev) => [...prev, { slug: "", name: "", image: null, qty: 1, rate: "" }]);
  const addProduct = (slug: string) => {
    const p = products.find((x) => x.slug === slug);
    if (!p) return;
    setLines((prev) => [
      ...prev,
      { slug: p.slug, name: p.name, image: p.images[0] ?? null, qty: 1, rate: String(priceFor(p, 1)) },
    ]);
  };

  const subtotal = lines.reduce((s, l) => s + (Number(l.rate) || 0) * (l.qty || 0), 0);
  const payload = lines
    .filter((l) => l.name.trim() && l.qty > 0)
    .map((l) => ({ slug: l.slug, name: l.name.trim(), image: l.image, qty: l.qty, unitPrice: Number(l.rate) || 0 }));
  const finalNum = Number(finalTotal) || 0;

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit enquiry"
        className="flex max-h-[92dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[20px] bg-canvas sm:rounded-[20px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <p className="font-display text-[1.15rem] text-ink">Edit enquiry</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-ink-soft transition-colors hover:text-ink"
          >
            <X size={19} />
          </button>
        </div>

        <form action={save} className="flex-1 overflow-y-auto px-6 py-6">
          <input type="hidden" name="id" value={booking.id} />
          <input type="hidden" name="items" value={JSON.stringify(payload)} readOnly />
          <input type="hidden" name="final_total" value={finalNum > 0 ? finalNum : ""} readOnly />

          {/* Items — any candle, catalogue or not */}
          <p className="eyebrow">Candles</p>
          <div className="mt-3 space-y-2.5">
            {lines.map((line, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2 rounded-[12px] border border-line-soft bg-surface p-2.5">
                <label className="min-w-[150px] flex-1">
                  <span className="mb-1 block text-[0.7rem] text-ink-faint">Candle</span>
                  <input
                    value={line.name}
                    onChange={(e) => setLine(i, { name: e.target.value, slug: line.slug || "" })}
                    placeholder="Any name — catalogue or custom"
                    className="w-full rounded-[9px] border border-line bg-canvas px-3 py-2 text-[0.875rem] text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[0.7rem] text-ink-faint">Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={line.qty || ""}
                    onChange={(e) => setLine(i, { qty: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-16 rounded-[9px] border border-line bg-canvas px-2.5 py-2 text-[0.875rem] text-ink focus:border-ink/40 focus:outline-none"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[0.7rem] text-ink-faint">Rate</span>
                  <input
                    type="number"
                    min={0}
                    value={line.rate}
                    onChange={(e) => setLine(i, { rate: e.target.value })}
                    className="w-20 rounded-[9px] border border-line bg-canvas px-2.5 py-2 text-[0.875rem] text-ink focus:border-ink/40 focus:outline-none"
                  />
                </label>
                <div className="pb-2 text-right">
                  <span className="mb-1 block text-[0.7rem] text-ink-faint">Amount</span>
                  <span className="block text-[0.875rem] text-ink tabular-nums">
                    {money((Number(line.rate) || 0) * (line.qty || 0))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  aria-label="Remove line"
                  className="mb-1 rounded-full p-1.5 text-ink-faint transition-colors hover:text-ember-deep"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addCustom}
              className="inline-flex items-center gap-1.5 text-[0.85rem] text-ember transition-colors hover:text-ember-deep"
            >
              <Plus size={15} />
              Add a custom candle
            </button>
            <Select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) addProduct(e.target.value);
                e.target.value = "";
              }}
              className="w-auto text-[0.85rem]"
            >
              <option value="">Add from catalogue…</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Price — subtotal vs the agreed final (discounts) */}
          <div className="mt-6 rounded-[12px] border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.8rem] text-ink-soft">Lines add up to</span>
              <span className="text-[0.925rem] text-ink tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <span className={LABEL}>Final price charged</span>
                <p className="text-[0.72rem] text-ink-faint">Lower it to give a discount.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={finalTotal}
                  onChange={(e) => setFinalTotal(e.target.value)}
                  className="w-28 rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-right text-[0.95rem] text-ink tabular-nums focus:border-ink/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setFinalTotal(String(subtotal))}
                  className="text-[0.75rem] whitespace-nowrap text-ember transition-colors hover:text-ember-deep"
                >
                  = subtotal
                </button>
              </div>
            </div>
            {finalNum > 0 && finalNum < subtotal && (
              <p className="mt-2 text-right text-[0.75rem] text-[#3d5730]">
                Discount of {money(subtotal - finalNum)} applied.
              </p>
            )}
          </div>

          {/* Buyer & delivery */}
          <p className="eyebrow mt-7">Buyer &amp; delivery</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Buyer name</span>
              <input name="buyer_name" defaultValue={booking.buyerName} className={`mt-1.5 ${FIELD}`} />
            </label>
            <label className="block">
              <span className={LABEL}>Instagram</span>
              <input
                name="buyer_contact"
                defaultValue={booking.buyerContact ? `@${booking.buyerContact.replace(/^@/, "")}` : ""}
                placeholder="@handle"
                className={`mt-1.5 ${FIELD}`}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Phone</span>
              <input name="phone" defaultValue={booking.phone ?? ""} inputMode="tel" className={`mt-1.5 ${FIELD}`} />
            </label>
            <label className="block">
              <span className={LABEL}>Fragrance</span>
              <input name="fragrance" defaultValue={booking.fragrance ?? ""} className={`mt-1.5 ${FIELD}`} />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Address <span className="font-normal text-ink-faint">— for shipping</span></span>
              <textarea
                name="address"
                defaultValue={booking.address ?? ""}
                rows={2}
                placeholder="Flat / house no., building, street, area"
                className={`mt-1.5 resize-none leading-relaxed ${FIELD}`}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Pincode</span>
              <input
                name="pincode"
                defaultValue={booking.pincode ?? ""}
                inputMode="numeric"
                className={`mt-1.5 ${FIELD}`}
              />
            </label>
            <label className="block">
              <span className={LABEL}>City or state</span>
              <input name="state" defaultValue={booking.state ?? ""} className={`mt-1.5 ${FIELD}`} />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Note</span>
              <textarea
                name="note"
                defaultValue={booking.note ?? ""}
                rows={2}
                className={`mt-1.5 resize-none leading-relaxed ${FIELD}`}
              />
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-[0.875rem] text-canvas transition-colors hover:bg-ember disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[0.85rem] text-ink-soft transition-colors hover:text-ink"
            >
              Cancel
            </button>
            {!state.ok && state.message && <span className="text-[0.8rem] text-ember-deep">{state.message}</span>}
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}
