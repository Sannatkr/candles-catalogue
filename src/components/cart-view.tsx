"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { GiftBanner } from "@/components/gift-banner";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { resolveGift, surpriseIncluded } from "@/lib/gift";
import { RETAIL_MAX, singlePrice } from "@/lib/pricing";
import { shippingCost } from "@/lib/shipping";
import type { GiftConfig, Product, ShippingConfig } from "@/lib/types";

export function CartView({
  shippingConfig,
  giftConfig,
  giftProducts,
}: {
  shippingConfig: ShippingConfig;
  giftConfig: GiftConfig;
  giftProducts: Product[];
}) {
  const { lines, ready, count, subtotal, weightGrams, giftSlug, setQty, remove } = useCart();

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

  // The gift is excluded from both the subtotal and the weight above, so it can
  // neither unlock itself nor tip the parcel past the free-delivery limit.
  const gift = resolveGift(giftConfig, giftProducts, subtotal, giftSlug);
  const surprise = surpriseIncluded(giftConfig, subtotal) && giftProducts.length > 0;
  const shipping = shippingCost(shippingConfig, { grams: weightGrams, subtotal });
  const total = subtotal + shipping;
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
        <GiftBanner config={giftConfig} products={giftProducts} shipping={shippingConfig} />
      </div>

      <ul className="divide-y divide-line-soft border-y border-line-soft lg:col-start-1 lg:row-span-2 lg:row-start-1">
        {lines.map((line) => (
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
                {money(line.unitPrice)} each
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-3">
                <div className="flex items-center rounded-full border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setQty(line.slug, line.qty - 1)}
                    aria-label={`One fewer ${line.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-l-full text-ink transition-colors hover:bg-canvas-deep"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-9 text-center text-[0.9rem] text-ink tabular-nums">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(line.slug, line.qty + 1)}
                    disabled={line.qty >= RETAIL_MAX}
                    aria-label={`One more ${line.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-r-full text-ink transition-colors hover:bg-canvas-deep disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span className="text-[0.95rem] text-ink tabular-nums">
                  {money(line.unitPrice * line.qty)}
                </span>
              </div>

              {line.qty >= RETAIL_MAX && (
                <p className="mt-2.5 text-[0.78rem] leading-relaxed text-ember-deep">
                  {RETAIL_MAX} is the most you can buy online.{" "}
                  <Link href={`/products/${line.slug}`} className="underline underline-offset-2">
                    Ask for a bulk rate
                  </Link>{" "}
                  instead.
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
        ))}
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
            {gift && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="truncate text-ink-soft">
                  {gift.name} <span className="text-ink-faint">(gift)</span>
                </dt>
                <dd className="shrink-0 tabular-nums">
                  <s className="text-ink-faint">{money(singlePrice(gift))}</s>{" "}
                  <b className="font-semibold text-[#3d5730]">FREE</b>
                </dd>
              </div>
            )}
{surprise && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="truncate text-ink-soft">
                  {giftConfig.surpriseLabel} <span className="text-ink-faint">(gift)</span>
                </dt>
                <dd className="shrink-0 font-semibold text-[#3d5730]">FREE</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="text-ink tabular-nums">
                {shipping === 0 ? <span className="text-[#3d5730]">Free</span> : money(shipping)}
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
          Buying {RETAIL_MAX + 1} or more of one candle? Open that candle and pick a bulk band — the rate
          drops and we quote you directly.
        </p>
      </div>
    </div>
  );
}
