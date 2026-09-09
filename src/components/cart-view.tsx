"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { MAX_ONLINE_QTY } from "@/lib/pricing";
import { freeShipEarned, shippingCost } from "@/lib/shipping";
import type { ShippingConfig } from "@/lib/types";

export function CartView({ shippingConfig }: { shippingConfig: ShippingConfig }) {
  const { lines, ready, count, subtotal, bulkSaving, weightGrams, setQty, remove } = useCart();

  // Nothing renders until localStorage has been read, or an empty bag flashes
  // for a frame on every visit.
  if (!ready) return <div className="mt-10 h-40" aria-hidden />;

  if (!lines.length) {
    return (
      <div className="mt-10 rounded-[18px] border border-line bg-surface px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-canvas-deep text-ink-faint">
          <ShoppingBag size={22} />
        </span>
        <p className="mt-5 font-display text-[1.3rem] text-ink">Nothing in here yet</p>
        <p className="mx-auto mt-2 max-w-[36ch] text-[0.925rem] leading-relaxed text-ink-soft">
          Pick a candle you like — you can change quantities before you pay.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-[0.925rem] text-canvas transition-colors hover:bg-ember"
        >
          Browse the range
        </Link>
      </div>
    );
  }

  // Free delivery two ways: one design at its own bulk quantity, or the old
  // retail rule — spend enough, stay light enough.
  const freeByQty = freeShipEarned(lines);
  const shipping = shippingCost(shippingConfig, { grams: weightGrams, subtotal, freeByQty });
  const total = subtotal + shipping;

  // The line closest to earning free delivery on its own, so the bag can name
  // one candle and one number rather than listing every near miss.
  const nearestFree = freeByQty
    ? null
    : lines
        .filter((l) => l.freeShipQty > 0 && l.qty < l.freeShipQty && l.freeShipQty <= (l.maxQty || MAX_ONLINE_QTY))
        .sort((a, b) => a.freeShipQty - a.qty - (b.freeShipQty - b.qty))[0] ?? null;
  const canGoFree =
    shippingConfig.freeOverSubtotal > 0 &&
    (shippingConfig.freeUnderGrams <= 0 || weightGrams <= shippingConfig.freeUnderGrams);
  const toFreeShipping = canGoFree ? shippingConfig.freeOverSubtotal - subtotal : 0;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-x-14 lg:gap-y-6">
      {/*
        On a phone this sits above the candles, not under them. The bag is one
        column there, so a banner placed after the list is a banner a buyer with
        six candles never scrolls far enough to see — and it is the one thing on
        this page that makes them add another. On a desktop the explicit grid
        placement puts it back at the top of the right-hand column.
      */}
      <div className="lg:col-start-2 lg:row-start-1">
        {(freeByQty || nearestFree) && (
          <p
            className={`flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[0.85rem] leading-relaxed ${
              freeByQty ? "bg-[#e6efe3] text-[#3d5730]" : "bg-ember-wash text-ember-deep"
            }`}
          >
            <Truck size={16} className="mt-0.5 shrink-0" />
            {freeByQty ? (
              <span>
                <b className="font-semibold">Delivery is on us</b> — you have a bulk quantity in the
                bag.
              </span>
            ) : (
              nearestFree && (
                <span>
                  {nearestFree.freeShipQty - nearestFree.qty} more {nearestFree.name} —{" "}
                  {nearestFree.freeShipQty} of one design and delivery is free.
                </span>
              )
            )}
          </p>
        )}
      </div>

      <ul className="divide-y divide-line-soft border-y border-line-soft lg:col-start-1 lg:row-span-2 lg:row-start-1">
        {lines.map((line) => {
          // Sets step by the set. A single steps by one.
          const step = Math.max(1, line.minQty);
          // Each candle carries its own ceiling — 7 for a peacock urli.
          const cap = Math.max(step, line.maxQty > 0 ? line.maxQty : MAX_ONLINE_QTY);
          return (
          <li key={line.slug} className="flex gap-4 py-5 sm:gap-5">
            <Link
              href={`/products/${line.slug}`}
              className="relative h-[92px] w-[76px] shrink-0 overflow-hidden rounded-[12px] bg-canvas-deep sm:h-[108px] sm:w-[90px]"
            >
              {line.image && (
                <Image src={line.image} alt="" fill sizes="90px" className="object-cover" />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/products/${line.slug}`}
                className="font-display text-[1rem] leading-snug text-ink transition-colors hover:text-ember sm:text-[1.1rem]"
              >
                {line.name}
              </Link>
              <p className="mt-1 text-[0.82rem] text-ink-faint tabular-nums">
                {money(line.unitPrice)} each{step > 1 && ` · sold in sets of ${step}`}
                {line.unitPrice < line.basePrice && (
                  <span className="ml-1.5 text-[#3d5730]">bulk rate</span>
                )}
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-3">
                <div className="flex items-center rounded-full border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setQty(line.slug, line.qty - step)}
                    aria-label={`${step > 1 ? `${step} fewer` : "One fewer"} ${line.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-l-full text-ink transition-colors hover:bg-canvas-deep"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-9 text-center text-[0.9rem] text-ink tabular-nums">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(line.slug, line.qty + step)}
                    disabled={line.qty >= cap}
                    aria-label={`${step > 1 ? `${step} more` : "One more"} ${line.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-r-full text-ink transition-colors hover:bg-canvas-deep disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span className="text-[0.95rem] text-ink tabular-nums">
                  {money(line.unitPrice * line.qty)}
                </span>
              </div>

              {line.qty >= cap && (
                <p className="mt-2.5 text-[0.78rem] leading-relaxed text-ember-deep">
                  {cap} is the most of this design you can buy online.{" "}
                  <Link href={`/products/${line.slug}`} className="underline underline-offset-2">
                    Send a bulk enquiry
                  </Link>{" "}
                  for more.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => remove(line.slug)}
              aria-label={`Remove ${line.name}`}
              className="-mt-1 -mr-2 h-9 w-9 shrink-0 self-start rounded-full text-ink-faint transition-colors hover:bg-canvas-deep hover:text-ink"
            >
              <Trash2 size={15} className="mx-auto" />
            </button>
          </li>
          );
        })}
      </ul>

      <div className="lg:col-start-2 lg:row-start-2 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[18px] border border-line bg-surface p-5 sm:p-6">
          <p className="eyebrow">Summary</p>

          <dl className="mt-4 space-y-3 text-[0.925rem]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">
                Subtotal <span className="text-ink-faint">({count} pcs)</span>
              </dt>
              <dd className="text-ink tabular-nums">{money(subtotal)}</dd>
            </div>
            {bulkSaving > 0 && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">Bulk rate</dt>
                <dd className="shrink-0 font-semibold text-[#3d5730] tabular-nums">
                  −{money(bulkSaving)}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="text-ink tabular-nums">
                {shipping === 0 ? (
                  <span className="text-[#3d5730]">{freeByQty ? "Free — bulk order" : "Free"}</span>
                ) : (
                  money(shipping)
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt className="text-ink">Total</dt>
              <dd className="font-display text-[1.4rem] text-ink tabular-nums">{money(total)}</dd>
            </div>
          </dl>

          {shipping > 0 && weightGrams > shippingConfig.freeUnderGrams && shippingConfig.freeUnderGrams > 0 && (
            <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-faint">
              This is a heavier parcel, so free delivery does not apply — a flat {money(shipping)} covers the
              freight.
            </p>
          )}

          {toFreeShipping > 0 && (
            <p className="mt-4 rounded-[12px] bg-ember-wash px-4 py-3 text-[0.82rem] leading-relaxed text-ember-deep">
              Add {money(toFreeShipping)} more and delivery is on us.
            </p>
          )}

          <Link
            href="/checkout"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember"
          >
            Checkout
          </Link>

          <Link
            href="/products"
            className="mt-2.5 inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-[0.875rem] text-ink-soft transition-colors hover:text-ink"
          >
            Keep looking
          </Link>
        </div>

        <p className="mt-4 px-1 text-[0.78rem] leading-relaxed text-ink-faint">
          Buying in bulk? Tap Bulk enquiry — pick your candles and quantities, and we quote you
          directly.
        </p>
      </div>
    </div>
  );
}
