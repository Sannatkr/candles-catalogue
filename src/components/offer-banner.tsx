"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { amountToGift, giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";
import type { Product } from "@/lib/types";

/**
 * The offer, said properly — a full-width banner for the pages people land on.
 *
 * It shows the actual candles that can be had free rather than a gift icon,
 * for two reasons. A shopper deciding whether ₹1,499 is worth stretching to
 * needs to see what they get; and Raghubir (JCP 2004) found that a gift shown
 * without its real identity and price is valued *less* afterwards — for a shop
 * giving away its own candles, an anonymous "free gift" quietly cheapens the
 * range it came from.
 *
 * State-aware: it is an invitation before the threshold, a progress line
 * during, and a claim button after. One banner, never a stale promise.
 */
export function OfferBanner({ products }: { products: Product[] }) {
  const { subtotal, giftSlug, ready } = useCart();
  const config = useGiftConfig();

  if (!config.enabled || config.threshold <= 0 || products.length === 0) return null;

  const unlocked = giftUnlocked(config, subtotal);
  const missing = amountToGift(config, subtotal);
  const started = ready && subtotal > 0;
  const claimed = unlocked && Boolean(giftSlug);

  // Three is enough to read as "a choice" without becoming a second grid.
  const shown = products.slice(0, 3);

  return (
    <div className="gift-card-in gift-sheen-surface relative overflow-hidden rounded-[20px] border border-[#c9a227]/35 bg-[linear-gradient(112deg,#fdf8ec_0%,#f9efd8_46%,#f3e3bd_100%)]">
      {/* Two soft blooms give the gold some depth instead of a flat wash. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-[#e9c979]/40 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -bottom-24 h-56 w-56 rounded-full bg-[#dfb44f]/25 blur-3xl"
      />

      <div className="relative flex flex-col gap-7 px-6 py-8 sm:px-9 sm:py-10 lg:flex-row lg:items-center lg:gap-12 lg:px-12">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.16em] text-[#96700f] uppercase">
            <Gift size={14} className="shrink-0" />
            {claimed ? "Your gift is in the bag" : unlocked ? "Unlocked" : "A gift on us"}
          </p>

          <h2 className="mt-3 font-display text-[clamp(1.75rem,4.6vw,2.7rem)] leading-[1.1] tracking-[-0.015em] text-ink">
            {claimed ? (
              <>Your free candle is chosen.</>
            ) : unlocked ? (
              <>Your free candle is waiting.</>
            ) : started ? (
              <>
                <span className="tabular-nums">{money(missing)}</span> away from a free candle.
              </>
            ) : (
              <>Pick any candle, free.</>
            )}
          </h2>

          <p className="mt-3.5 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-soft sm:text-[1.02rem]">
            {claimed ? (
              <>
                It goes in the box at no charge
                {config.surpriseEnabled && <>, along with {config.surpriseLabel.toLowerCase()}</>}.
                Change it any time before you pay.
              </>
            ) : unlocked ? (
              <>
                Choose whichever one you like — it will not be charged
                {config.surpriseEnabled && <>, and {config.surpriseLabel.toLowerCase()} goes in too</>}
                .
              </>
            ) : (
              <>
                Spend {money(config.threshold)} and choose one of these to take home free
                {config.surpriseEnabled && <>. {config.surpriseLabel} is tucked in as well</>}.
              </>
            )}
          </p>

          <Link
            href={unlocked ? "/cart" : "/products"}
            className="group mt-6 inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[0.92rem] text-canvas transition-colors hover:bg-ember"
          >
            {unlocked ? (claimed ? "View your bag" : "Pick your candle") : "Start your bag"}
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* The candles themselves, fanned so they read as a set to choose from
            rather than three unrelated thumbnails. */}
        <ul className="flex shrink-0 items-end gap-3 sm:gap-4 lg:gap-5">
          {shown.map((product, i) => (
            <li
              key={product.slug}
              className={i === 1 ? "translate-y-0" : "translate-y-3 sm:translate-y-4"}
            >
              <Link
                href={`/products/${product.slug}`}
                className="group block w-[86px] sm:w-[108px] lg:w-[122px]"
              >
                <span className="relative block aspect-4/5 overflow-hidden rounded-[14px] bg-canvas-deep shadow-[0_8px_24px_-14px_rgba(30,25,19,0.5)] ring-1 ring-[#c9a227]/30">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 90px, 122px"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                  />
                </span>
                {/* Two lines rather than an ellipsis: "Designer Lot…" tells a
                    shopper nothing, and these names are the whole point of
                    showing real candles instead of a gift icon. */}
                <span className="mt-2 line-clamp-2 block text-[0.72rem] leading-snug text-ink-soft sm:text-[0.78rem]">
                  {product.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Progress runs the full width along the base — the goal, drawn as a line
          under everything the banner just promised. */}
      {started && !unlocked && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 block h-[3px] origin-left bg-[linear-gradient(90deg,#d98b4a,#e5c07b,#d4a24c)] transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${Math.min(1, subtotal / config.threshold)})` }}
        />
      )}
    </div>
  );
}
