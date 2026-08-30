"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { LotusMotif } from "@/components/lotus-motif";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { amountToGift, giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";
import type { Product } from "@/lib/types";

/**
 * The offer, at the top of the page, before anything else.
 *
 * Home page only, placed above the hero — an offer nobody scrolls to is an
 * offer nobody has. It is deliberately not repeated on the catalogue or the
 * collection pages: those are where someone browses, and a full-width slab
 * above the grid is a wall between them and the candles. The sticky bar in the
 * header carries the offer everywhere else. It is dark where the rest of the site is pale, which is what lets it
 * lead without shouting — the contrast does the work that a red SALE strip
 * would otherwise be asked to do, and it reads as the brand rather than as an
 * advert bolted onto it.
 *
 * The ground is drawn, not photographed. A darkened, blurred photo reads as a
 * photo someone has hidden; engraved gold linework reads as something made,
 * which is the claim the whole shop rests on — and it costs a few hundred bytes
 * instead of a hero JPEG.
 *
 * The candles beside the text are the shop's most beautiful pieces, not the
 * giftable ones. That is a line worth walking carefully: the photographs sell
 * the range, the words name the offer, and nothing implies the pictured candle
 * is the free one — promoting one thing and supplying another is "bait and
 * switch", a notified dark pattern under India's CCPA rules. Hence "choose
 * yours from a selection" stated plainly, right where the promise is made.
 */
export function OfferBanner({ showcase }: { showcase: Product[] }) {
  const { subtotal, giftSlug, ready } = useCart();
  const config = useGiftConfig();

  if (!config.enabled || config.threshold <= 0) return null;

  const unlocked = giftUnlocked(config, subtotal);
  const missing = amountToGift(config, subtotal);
  const started = ready && subtotal > 0;
  const claimed = unlocked && Boolean(giftSlug);

  return (
    <section className="relative isolate overflow-hidden bg-ink">
      {/* Depth first: a warm rise from the lower left, so the ground is lit
          rather than flat black. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_8%_110%,rgba(180,95,43,0.30)_0%,transparent_58%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_88%_-10%,rgba(229,192,123,0.20)_0%,transparent_60%)]"
      />

      {/* The rosette, sized off the banner height so it never crops oddly, and
          bled off the right edge the way an engraved border would be. */}
      <LotusMotif className="pointer-events-none absolute top-1/2 right-[-9rem] hidden h-[150%] -translate-y-1/2 text-[#e5c07b]/30 sm:right-[-6rem] sm:block lg:right-[26%]" />
      <LotusMotif className="pointer-events-none absolute -top-16 -right-24 h-[22rem] text-[#e5c07b]/20 sm:hidden" />

      <div className="relative mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-11 sm:px-8 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:py-16">
        <div className="min-w-0 max-w-[46rem] flex-1">
          <p className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.2em] text-[#e5c07b] uppercase">
            <Sparkles size={13} className="shrink-0" />
            {claimed
              ? "Your gift is in the bag"
              : unlocked
                ? "Unlocked"
                : "Now on"}
          </p>

          <h2 className="mt-3.5 font-display text-[clamp(2rem,5.6vw,3.25rem)] leading-[1.06] tracking-[-0.02em] text-canvas">
            {claimed ? (
              <>Your free candle is chosen.</>
            ) : unlocked ? (
              <>
                Your free candle is{" "}
                <em className="text-[#e5c07b] not-italic">waiting</em>.
              </>
            ) : started ? (
              <>
                <span className="tabular-nums">{money(missing)}</span> away from
                a <em className="text-[#e5c07b] not-italic">free candle</em>.
              </>
            ) : (
              <>
                Get a <em className="text-[#e5c07b] not-italic">free candle</em>
                {config.surpriseEnabled && (
                  <>
                    {" "}
                    and a{" "}
                    <em className="text-[#e5c07b] not-italic">surprise gift</em>
                  </>
                )}
                .
              </>
            )}
          </h2>

          <p className="mt-4 max-w-[52ch] text-[0.98rem] leading-relaxed text-canvas/70 sm:text-[1.06rem]">
            {claimed ? (
              <>
                It ships free with your order. You can change it any time before
                you pay.
              </>
            ) : unlocked ? (
              <>
                You have passed {money(config.threshold)} — choose your candle
                in the bag, on us.
              </>
            ) : (
              <>
                On every order over {money(config.threshold)}. Choose yours from
                a selection of our candles at checkout
                {config.surpriseEnabled && (
                  <>, and we tuck the surprise in beside it</>
                )}
                .
              </>
            )}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={unlocked ? "/cart" : "/products"}
              className="group inline-flex items-center gap-2.5 rounded-full bg-canvas px-7 py-3.5 text-[0.92rem] text-ink transition-colors hover:bg-[#e5c07b]"
            >
              {unlocked
                ? claimed
                  ? "View your bag"
                  : "Pick your candle"
                : "Shop the range"}
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            {!unlocked && (
              <Link
                href="/collections"
                className="rounded-full border border-canvas/25 px-6 py-3.5 text-[0.9rem] text-canvas/80 transition-colors hover:border-canvas/60 hover:text-canvas"
              >
                See collections
              </Link>
            )}
          </div>
        </div>

        {/* The range beside the promise — three of the shop's best pieces, so the
            banner looks like what it is selling. */}
        <ul className="flex shrink-0 items-end gap-3 sm:gap-4">
          {showcase.slice(0, 3).map((product, i) => (
            <li
              key={product.slug}
              className={i === 1 ? "" : "translate-y-4 sm:translate-y-5"}
            >
              <Link
                href={`/products/${product.slug}`}
                aria-label={product.name}
                className="group block w-[92px] sm:w-[116px] lg:w-[132px]"
              >
                <span className="relative block aspect-4/5 overflow-hidden rounded-[14px] bg-ink/40 ring-1 ring-[#e5c07b]/35 transition-shadow duration-500 group-hover:ring-[#e5c07b]/70">
                  <Image
                    src={product.images[0]}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 96px, 132px"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* The goal, drawn along the base of the banner. */}
      {started && !unlocked && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 block h-[3px] origin-left bg-[linear-gradient(90deg,#d98b4a,#e5c07b,#f0d9b5)] transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: `scaleX(${Math.min(1, subtotal / config.threshold)})`,
          }}
        />
      )}
    </section>
  );
}
