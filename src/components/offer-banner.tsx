"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { BulkEnquiryDialog } from "@/components/bulk-enquiry-dialog";
import { LotusMotif } from "@/components/lotus-motif";
import { track } from "@/lib/analytics";
import type { BulkTier, Product } from "@/lib/types";

/**
 * The offer, at the top of the page, before anything else.
 *
 * What it advertises has changed. It used to dangle a free candle over ₹1,499,
 * which is a retail lever on a business whose money comes from gifting orders —
 * a buyer working out fifty employee gifts was being sold a ₹149 candle. It now
 * leads with the thing that buyer actually wants to know: the rate falls with
 * quantity, the ladder is printed on the page rather than hidden behind "DM for
 * price", and fifty of one design ships free.
 *
 * Home page only, above the hero — an offer nobody scrolls to is an offer
 * nobody has. It is deliberately not repeated on the catalogue or the
 * collection pages: those are where someone browses, and a full-width slab
 * above the grid is a wall between them and the candles.
 *
 * The ground is drawn, not photographed. A darkened, blurred photo reads as a
 * photo someone has hidden; engraved gold linework reads as something made,
 * which is the claim the whole shop rests on — and it costs a few hundred bytes
 * instead of a hero JPEG.
 */
export function OfferBanner({
  showcase,
  tiers,
  fragrances,
  instagramHandle,
  businessName,
}: {
  showcase: Product[];
  tiers: BulkTier[];
  fragrances: string[];
  instagramHandle: string;
  businessName: string;
}) {
  const [enquiry, setEnquiry] = useState(false);
  if (!tiers.length) return null;

  const deepest = tiers[tiers.length - 1];

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
            <Layers size={13} className="shrink-0" />
            Corporate &amp; wedding gifting
          </p>

          <h2 className="mt-3.5 font-display text-[clamp(2rem,5.6vw,3.25rem)] leading-[1.06] tracking-[-0.02em] text-canvas">
            Gifting 25 to 500 people?{" "}
            <em className="text-[#e5c07b] not-italic">The price is on the page.</em>
          </h2>

          <p className="mt-4 max-w-[52ch] text-[0.98rem] leading-relaxed text-canvas/70 sm:text-[1.06rem]">
            No waiting on a quotation to know your budget. The rate per piece falls at every step
            below, up to {deepest.percentOff}% off — and for the bigger pieces, or a mixed order,
            send us the list and we quote you the same working day.
          </p>

          {/* The ladder itself, because printing it is the whole promise. */}
          <ul className="mt-6 flex flex-wrap gap-2">
            {tiers.map((tier) => (
              <li
                key={tier.minQty}
                className="rounded-full border border-[#e5c07b]/35 px-4 py-2 text-[0.82rem] text-canvas/85 tabular-nums"
              >
                {tier.minQty}+ pcs
                <span className="ml-1.5 text-[#e5c07b]">{tier.percentOff}% off</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEnquiry(true);
                track("bulk_banner_clicked", {});
              }}
              className="group inline-flex items-center gap-2.5 rounded-full bg-canvas px-7 py-3.5 text-[0.92rem] text-ink transition-colors hover:bg-[#e5c07b]"
            >
              Get a bulk quote
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>

            <Link
              href="/products"
              className="rounded-full border border-canvas/25 px-6 py-3.5 text-[0.9rem] text-canvas/80 transition-colors hover:border-canvas/60 hover:text-canvas"
            >
              Shop the range
            </Link>
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

      {enquiry && (
        <BulkEnquiryDialog
          fragrances={fragrances}
          instagramHandle={instagramHandle}
          businessName={businessName}
          onClose={() => setEnquiry(false)}
        />
      )}
    </section>
  );
}
