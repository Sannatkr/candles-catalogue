"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { celebrateUnlock, originOf } from "@/lib/celebrate";
import { money } from "@/lib/format";
import { amountToGift, giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";

/**
 * The offer, said where people are actually choosing candles.
 *
 * Baymard's testing found up to 27% of shoppers never see a promotion that
 * lives only in a site-wide banner, and NN/g's eyetracking explains why:
 * anything shaped like an ad, in a place ads live, is skipped along with the
 * ads. So this is a card in the reading flow, built from the shop's own
 * materials — gold, warm paper, the same radii as everything else — rather
 * than a coloured strip pinned above the masthead.
 *
 * Two variants. `card` is the full treatment for the home, collection and
 * listing pages. `compact` is one quiet line under Add to Cart, which stays
 * plain on purpose: beside the buy button a decorated block competes with the
 * thing the shopper came to press.
 */
export function GiftProgress({ variant = "card" }: { variant?: "card" | "compact" }) {
  const { subtotal, giftSlug, ready } = useCart();
  const config = useGiftConfig();
  const box = useRef<HTMLElement>(null);
  const wasUnlocked = useRef(false);
  const seenFirst = useRef(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const unlocked = giftUnlocked(config, subtotal);
  const missing = amountToGift(config, subtotal);
  const pct = Math.min(100, (subtotal / Math.max(1, config.threshold)) * 100);
  const started = ready && subtotal > 0;

  /**
   * The threshold is usually crossed here, not in the bag — someone taps "Add
   * to bag" and that is the moment they earn it. Celebrating only in the cart
   * means the good news arrives late, on a screen they may not open for another
   * ten minutes. The first read of localStorage is ignored, so arriving with a
   * full bag is never mistaken for crossing the line.
   */
  useEffect(() => {
    if (!ready || !config.enabled) return;
    const crossedJustNow = seenFirst.current && unlocked && !wasUnlocked.current;
    wasUnlocked.current = unlocked;
    seenFirst.current = true;
    if (!crossedJustNow) return;

    celebrateUnlock(originOf(box.current));
    setJustUnlocked(true);
    const t = window.setTimeout(() => setJustUnlocked(false), 700);
    return () => window.clearTimeout(t);
  }, [unlocked, ready, config.enabled]);

  if (!config.enabled || config.threshold <= 0) return null;

  /* ------------------------------------------------------- compact line -- */
  if (variant === "compact") {
    return (
      <p
        ref={box as React.RefObject<HTMLParagraphElement>}
        className="mt-3 flex items-start gap-2 text-[0.82rem] leading-relaxed text-ink-soft"
      >
        <Gift size={14} className="mt-0.5 shrink-0 text-[#b8860b]" />
        <span>
          {!started ? (
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

  /* --------------------------------------------------------------- card -- */
  return (
    <div
      ref={box as React.RefObject<HTMLDivElement>}
      className={`gift-card-in gift-sheen-surface relative rounded-[16px] border px-5 py-5 sm:px-6 ${
        justUnlocked ? "gift-reward" : ""
      } ${
        unlocked
          ? "border-[#c9a227]/45 bg-[linear-gradient(118deg,#fdf7e9_0%,#f8eed6_52%,#f2e1bb_100%)]"
          : "border-line bg-[linear-gradient(118deg,#fdfaf4_0%,#faf5ea_100%)]"
      }`}
    >
      {/* A gold bloom behind the mark, so the card has depth rather than a flat fill. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-10 h-44 w-44 rounded-full bg-[#e5c07b]/30 blur-3xl"
      />

      <div className="relative flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#7a5b12] ${
            unlocked
              ? "bg-[linear-gradient(135deg,#f7e6bd,#dfb44f)] shadow-sm"
              : "bg-[linear-gradient(135deg,#f6efdd,#ecdcb4)]"
          }`}
        >
          {unlocked ? <Sparkles size={21} /> : <Gift size={20} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-semibold tracking-[0.13em] text-[#9a7515] uppercase">
            {unlocked ? "Unlocked" : "Free candle"}
          </p>

          <p className="mt-1.5 font-display text-[1.15rem] leading-snug text-ink sm:text-[1.28rem]">
            {!started ? (
              <>Spend {money(config.threshold)}, pick any candle free</>
            ) : unlocked ? (
              giftSlug ? (
                <>Your free candle is chosen</>
              ) : (
                <>You&rsquo;ve earned a free candle</>
              )
            ) : (
              <>
                <span className="tabular-nums">{money(missing)}</span> away from a free candle
              </>
            )}
          </p>

          <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">
            {unlocked && !giftSlug ? (
              <>Choose whichever one you like — it will not be charged.</>
            ) : config.surpriseEnabled ? (
              <>{config.surpriseLabel} goes in the box as well.</>
            ) : (
              <>Yours to choose, on every order over {money(config.threshold)}.</>
            )}
          </p>
        </div>

        {unlocked && !giftSlug && (
          <Link
            href="/cart"
            className="hidden shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] whitespace-nowrap text-canvas transition-transform duration-200 hover:scale-[1.03] hover:bg-ember sm:inline-flex"
          >
            Pick yours
          </Link>
        )}
      </div>

      {/* The bar. scaleX rather than width, so the fill runs on the compositor
          and never triggers layout while someone is scrolling past it. */}
      {started && !unlocked && (
        <div className="relative mt-4">
          <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#efe6d2]">
            <div
              className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#d98b4a,#e5c07b,#d4a24c)] transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `scaleX(${Math.max(0.02, pct / 100)})` }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress towards your free candle"
            />
          </div>
          <span
            aria-hidden
            className="gift-pulse absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4a24c] transition-[left] duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ left: `${pct}%` }}
          />
        </div>
      )}

      {unlocked && !giftSlug && (
        <Link
          href="/cart"
          className="relative mt-4 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-[0.88rem] text-canvas transition-colors hover:bg-ember sm:hidden"
        >
          Pick yours
        </Link>
      )}
    </div>
  );
}
