"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { useCart } from "@/lib/cart";
import { celebrateUnlock, originOf } from "@/lib/celebrate";
import { money } from "@/lib/format";
import { amountToGift, giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";

/**
 * The offer, said where people are actually choosing candles.
 *
 * Baymard's testing found up to 27% of shoppers never see a promotion that
 * lives only in a site-wide banner — and NN/g's eyetracking work explains why:
 * anything shaped like an ad, in a place ads live, gets skipped along with the
 * ads. So this is deliberately styled as page content, not as a coloured
 * full-bleed strip, and it is placed in the reading flow rather than pinned to
 * the top of the window.
 *
 * It also never appears empty-handed: with nothing in the bag it states the
 * offer, and from the first candle onward it shows real progress towards it.
 * (Kivetz et al., JMR 2006 — a goal already under way is pursued harder than
 * one at zero.) The progress shown is the buyer's actual subtotal; nothing is
 * inflated to fake a head start.
 */
export function GiftProgress({ variant = "inline" }: { variant?: "inline" | "compact" }) {
  const { subtotal, giftSlug, ready } = useCart();
  const config = useGiftConfig();
  const box = useRef<HTMLElement>(null);
  const wasUnlocked = useRef(false);
  const seenFirst = useRef(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const unlocked = giftUnlocked(config, subtotal);
  const missing = amountToGift(config, subtotal);
  const pct = Math.min(100, (subtotal / Math.max(1, config.threshold)) * 100);

  /**
   * The threshold is usually crossed here, not in the bag — someone taps "Add to
   * bag" on a product page and that is the moment they earn it. Celebrating only
   * in the cart means the good news arrives late, on a screen they may not open
   * for another ten minutes. As in the bag, the first read of localStorage is
   * ignored so arriving with a full bag is not mistaken for crossing the line.
   */
  useEffect(() => {
    if (!ready || !config.enabled) return;
    const crossedJustNow = seenFirst.current && unlocked && !wasUnlocked.current;
    // Recorded before the early return, or a second pass would celebrate again.
    wasUnlocked.current = unlocked;
    seenFirst.current = true;
    if (!crossedJustNow) return;

    celebrateUnlock(originOf(box.current));
    setJustUnlocked(true);
    const t = window.setTimeout(() => setJustUnlocked(false), 950);
    return () => window.clearTimeout(t);
  }, [unlocked, ready, config.enabled]);

  if (!config.enabled || config.threshold <= 0) return null;

  // Under Add to Cart: one honest line, no box, no colour block. This is the
  // single highest-value place to say it — the buyer has to look here to buy.
  if (variant === "compact") {
    return (
      <p
        ref={box as React.RefObject<HTMLParagraphElement>}
        className={`mt-3 flex items-start gap-2 px-1.5 py-1 text-[0.82rem] leading-relaxed text-ink-soft ${justUnlocked ? "gift-unlocked" : ""}`}
      >
        <Gift size={14} className="mt-0.5 shrink-0 text-[#b8860b]" />
        <span>
          {!ready || subtotal === 0 ? (
            <>
              Spend {money(config.threshold)} and pick a <b className="text-ink">free candle</b>
              {config.surpriseEnabled && <> — plus {config.surpriseLabel.toLowerCase()}</>}.
            </>
          ) : unlocked ? (
            giftSlug ? (
              <>
                Your <b className="text-ink">free candle</b> is in the bag.
              </>
            ) : (
              <>
                You&rsquo;ve earned a <b className="text-ink">free candle</b> —{" "}
                <Link href="/cart" className="underline underline-offset-2 hover:text-ink">
                  pick it in your bag
                </Link>
                .
              </>
            )
          ) : (
            <>
              <b className="text-ink tabular-nums">{money(missing)}</b> more in your bag and you pick
              a <b className="text-ink">free candle</b>.
            </>
          )}
        </span>
      </p>
    );
  }

  // On a listing page: a quiet line above the grid with a thin progress rule.
  return (
    <div
      ref={box as React.RefObject<HTMLDivElement>}
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line-soft px-1.5 py-3.5 ${justUnlocked ? "gift-unlocked" : ""}`}
    >
      <Gift size={15} className="shrink-0 text-[#b8860b]" />

      <p className="min-w-0 flex-1 text-[0.875rem] leading-snug text-ink">
        {!ready || subtotal === 0 ? (
          <>
            Spend {money(config.threshold)} and pick any candle below{" "}
            <b>free</b>
            {config.surpriseEnabled && <> — plus {config.surpriseLabel.toLowerCase()}</>}.
          </>
        ) : unlocked ? (
          giftSlug ? (
            <>
              Your free candle is chosen.{" "}
              <Link href="/cart" className="underline underline-offset-2">
                View bag
              </Link>
            </>
          ) : (
            <>
              <b>You&rsquo;ve earned a free candle.</b>{" "}
              <Link href="/cart" className="underline underline-offset-2">
                Pick yours
              </Link>
            </>
          )
        ) : (
          <>
            <b className="tabular-nums">{money(missing)}</b> more and you pick a candle{" "}
            <b>free</b>.
          </>
        )}
      </p>

      {ready && subtotal > 0 && !unlocked && (
        <span className="h-1 w-full max-w-[160px] shrink-0 overflow-hidden rounded-full bg-canvas-deep sm:w-[160px]">
          <span
            className="block h-full rounded-full bg-[linear-gradient(90deg,#d98b4a,#e5c07b)] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
    </div>
  );
}
