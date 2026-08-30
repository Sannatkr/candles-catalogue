"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Gift, PartyPopper, Sparkles } from "lucide-react";
import { GiftPicker } from "@/components/gift-picker";
import { SurpriseGift } from "@/components/surprise-gift";
import { useCart } from "@/lib/cart";
import { celebrateGift, celebrateUnlock, originOf } from "@/lib/celebrate";
import { money } from "@/lib/format";
import { amountToGift, giftUnlocked, resolveGift, surpriseIncluded } from "@/lib/gift";
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
  const box = useRef<HTMLDivElement>(null);
  const wasUnlocked = useRef(false);
  // The cart is read from localStorage after mount, so the first truthful look
  // at it arrives as a change. Without this the banner would treat "arrived on
  // the page with a full bag" as "just earned a gift" and throw confetti on
  // every single visit — which is how a nice moment becomes an irritation.
  const seenFirst = useRef(false);

  const unlocked = giftUnlocked(config, subtotal);
  const gift = resolveGift(config, products, subtotal, giftSlug);
  const missing = amountToGift(config, subtotal);
  const surprise = surpriseIncluded(config, subtotal);

  // Celebrate the crossing, not the state — otherwise every re-render throws
  // paper. The first pass only records where we started.
  useEffect(() => {
    if (!ready) return;
    const crossedJustNow = seenFirst.current && unlocked && !wasUnlocked.current;
    if (crossedJustNow && !readOnly) celebrateUnlock(originOf(box.current));
    wasUnlocked.current = unlocked;
    seenFirst.current = true;
  }, [unlocked, ready, readOnly]);

  if (!ready || !config.enabled || products.length === 0) return null;

  // Claimed, then the bag shrank back under the line. Say so plainly here
  // rather than letting it vanish silently at payment.
  const losing = Boolean(giftSlug) && !unlocked;
  const progress = Math.min(100, (subtotal / Math.max(1, config.threshold)) * 100);

  return (
    <>
      <div
        ref={box}
        className={`relative overflow-hidden rounded-[16px] px-4 py-4 sm:px-5 ${
          gift
            ? "border border-[#c9a227]/45 bg-[linear-gradient(135deg,#fdf6e6_0%,#f7ecd2_55%,#f3e2bd_100%)]"
            : unlocked || losing
              ? "border border-ember/40 bg-[linear-gradient(135deg,#fdf1e7_0%,#f9e3d0_100%)]"
              : "border border-line bg-surface"
        }`}
      >
        {/* A soft gold bloom behind the celebratory states — warmth, not a flat block of colour. */}
        {(gift || unlocked || losing) && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#e5c07b]/35 blur-3xl"
          />
        )}

        <div className="relative">
          {/* --- earned and chosen --- */}
          {gift ? (
            <>
              <div className="flex items-center gap-3.5">
                <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep ring-2 ring-[#c9a227]/40">
                  <Image src={gift.images[0]} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.09em] text-[#8a6a1f] uppercase">
                    <PartyPopper size={13} className="shrink-0" /> Your free candle
                  </p>
                  <p className="mt-1 font-display text-[1.05rem] leading-snug text-ink">{gift.name}</p>
                  <p className="mt-0.5 text-[0.82rem] tabular-nums">
                    <s className="text-ink-faint">{money(singlePrice(gift))}</s>{" "}
                    <b className="font-semibold text-[#3d5730]">FREE</b>
                  </p>
                </div>
              </div>

              {!readOnly && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="flex-1 rounded-full border border-[#c9a227]/50 bg-canvas px-4 py-2.5 text-[0.82rem] text-ink transition-colors hover:border-ink"
                  >
                    Change candle
                  </button>
                  <button
                    type="button"
                    onClick={() => setGift(null)}
                    className="rounded-full px-4 py-2.5 text-[0.82rem] text-ink-faint transition-colors hover:text-ember-deep"
                  >
                    Remove
                  </button>
                </div>
              )}

              {surprise && <SurpriseGift label={config.surpriseLabel} threshold={money(config.threshold)} />}
            </>
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
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-[#b8860b] shadow-sm">
                  <Sparkles size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1.08rem] leading-snug text-ink">
                    You&rsquo;ve unlocked a free candle
                  </p>
                  <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ink-soft">
                    Pick any one you like — it&rsquo;s on us.
                  </p>
                </div>
                {readOnly ? (
                  <a
                    href="/cart"
                    className="w-full shrink-0 rounded-full bg-ink px-5 py-3 text-center text-[0.88rem] text-canvas transition-colors hover:bg-ember sm:w-auto sm:py-2.5"
                  >
                    Pick it in your bag
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="w-full shrink-0 rounded-full bg-ink px-5 py-3 text-[0.88rem] text-canvas shadow-sm transition-transform hover:scale-[1.02] hover:bg-ember sm:w-auto sm:py-2.5"
                  >
                    Pick my candle
                  </button>
                )}
              </div>

              {surprise && <SurpriseGift label={config.surpriseLabel} threshold={money(config.threshold)} />}
            </>
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
                  {config.surpriseEnabled && <> — plus {config.surpriseLabel.toLowerCase()}</>}
                </p>
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas-deep"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#d98b4a,#e5c07b)] transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {picking && !readOnly && (
        <GiftPicker
          products={products}
          chosen={giftSlug}
          onPick={(slug) => {
            setGift(slug);
            setPicking(false);
            celebrateGift(originOf(box.current));
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}

