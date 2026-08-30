"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Gift, Sparkles } from "lucide-react";
import { Confetti } from "@/components/confetti";
import { GiftPicker } from "@/components/gift-picker";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { amountToGift, giftUnlocked, resolveGift } from "@/lib/gift";
import { singlePrice } from "@/lib/pricing";
import type { GiftConfig, Product } from "@/lib/types";

/**
 * The free-candle offer, in its four honest states: not yet earned, just
 * earned, chosen, and about-to-be-lost. Shared by the bag and the checkout so
 * the promise never reads differently on the screen where money changes hands.
 */
export function GiftBanner({
  config,
  products,
  readOnly = false,
}: {
  config: GiftConfig;
  products: Product[];
  /** Checkout shows the state but sends people back to the bag to change it. */
  readOnly?: boolean;
}) {
  const { subtotal, giftSlug, setGift, ready } = useCart();
  const [picking, setPicking] = useState(false);
  const [fire, setFire] = useState(0);
  const wasUnlocked = useRef(false);

  const unlocked = giftUnlocked(config, subtotal);
  const gift = resolveGift(config, products, subtotal, giftSlug);
  const missing = amountToGift(config, subtotal);

  // Celebrate the crossing, not the state — otherwise every re-render throws
  // paper. The first pass only records where we started.
  useEffect(() => {
    if (!ready) return;
    if (unlocked && !wasUnlocked.current) setFire((n) => n + 1);
    wasUnlocked.current = unlocked;
  }, [unlocked, ready]);

  if (!ready || !config.enabled || products.length === 0) return null;

  // Claimed, then the bag shrank back under the line. Say so plainly here
  // rather than letting it vanish silently at payment.
  const losing = Boolean(giftSlug) && !unlocked;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-[16px] border px-4 py-4 sm:px-5 ${
          gift
            ? "border-[#cfe0c8] bg-[#eef3ea]"
            : unlocked || losing
              ? "border-ember/35 bg-ember-wash"
              : "border-line bg-surface"
        }`}
      >
        <Confetti fire={fire} />

        {/* --- earned and chosen --- */}
        {gift ? (
          <div className="flex items-center gap-3.5">
            <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
              <Image src={gift.images[0]} alt="" fill sizes="48px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[0.75rem] font-medium tracking-[0.06em] text-[#3d5730] uppercase">
                <Gift size={13} /> Your free candle
              </p>
              <p className="mt-1 truncate font-display text-[1.02rem] text-ink">{gift.name}</p>
              <p className="mt-0.5 text-[0.8rem] tabular-nums">
                <s className="text-ink-faint">{money(singlePrice(gift))}</s>{" "}
                <b className="font-semibold text-[#3d5730]">FREE</b>
              </p>
            </div>
            {!readOnly && (
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  className="rounded-full border border-[#cfe0c8] bg-canvas px-3.5 py-1.5 text-[0.78rem] text-ink transition-colors hover:border-ink"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => setGift(null)}
                  className="px-1 text-[0.72rem] text-ink-faint transition-colors hover:text-ember-deep"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : losing ? (
          /* --- chosen, but the bag dropped back under the line --- */
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ember-deep">
              <Gift size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] leading-snug font-medium text-ember-deep">
                Add {money(missing)} more to keep your free candle
              </p>
              <p className="mt-0.5 text-[0.79rem] leading-relaxed text-ink-soft">
                Your bag is under {money(config.threshold)}, so the gift will come off at payment.
              </p>
            </div>
          </div>
        ) : unlocked ? (
          /* --- earned, not yet chosen --- */
          <div className="gift-pop flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ember-deep">
              <Sparkles size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.05rem] leading-snug text-ink">
                You&rsquo;ve unlocked a free candle
              </p>
              <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ink-soft">
                Pick any one below — it&rsquo;s on us.
              </p>
            </div>
            {readOnly ? (
              <a
                href="/cart"
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] text-canvas transition-colors hover:bg-ember"
              >
                Pick it in your bag
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] text-canvas transition-colors hover:bg-ember"
              >
                Pick my candle
              </button>
            )}
          </div>
        ) : (
          /* --- not there yet: the nudge --- */
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-deep text-ink-soft">
                <Gift size={16} />
              </span>
              <p className="text-[0.9rem] leading-snug text-ink">
                Add <b className="tabular-nums">{money(missing)}</b> more and pick a{" "}
                <b>free candle</b>
              </p>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas-deep"
              role="progressbar"
              aria-valuenow={Math.min(100, Math.round((subtotal / config.threshold) * 100))}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-ember transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, (subtotal / config.threshold) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {picking && !readOnly && (
        <GiftPicker
          products={products}
          chosen={giftSlug}
          onPick={(slug) => {
            setGift(slug);
            setPicking(false);
            setFire((n) => n + 1);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}
