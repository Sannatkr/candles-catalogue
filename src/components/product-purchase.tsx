"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { EnquiryDialog } from "@/components/enquiry-dialog";
import { InstagramIcon } from "@/components/instagram-icon";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import { GiftProgress } from "@/components/gift-progress";
import { celebrateGift, celebrateUnlock } from "@/lib/celebrate";
import { giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";
import { Gift } from "lucide-react";
import { money } from "@/lib/format";
import { bandsFor, priceAtQty, RETAIL_MAX } from "@/lib/pricing";
import { packGramsOf } from "@/lib/shipping";
import type { Product } from "@/lib/types";

/**
 * The buying block on a product page.
 *
 * Quantity is the single source of truth. The price on screen is always the
 * rate for the quantity actually chosen — pick 2 and you pay the single rate,
 * pick 10 and the 10+ rate applies. The bands are quantity shortcuts, and the
 * one that matches the current quantity is the one highlighted, so the price,
 * the band and the number can never disagree.
 */
export function ProductPurchase({
  product,
  fragrances,
  instagramHandle,
  businessName,
}: {
  product: Product;
  fragrances: string[];
  instagramHandle: string;
  businessName: string;
}) {
  const bands = useMemo(() => bandsFor(product), [product]);

  const [qty, setQty] = useState(1);
  /**
   * What is literally in the box while it is being typed in, which is not the
   * same thing as the quantity. Clearing the field has to leave it empty for a
   * moment — clamping on every keystroke means it refills with a 1 the instant
   * you hit backspace, and you can never type a fresh number.
   */
  const [draft, setDraft] = useState<string | null>(null);
  const [enquiry, setEnquiry] = useState(false);
  const [added, setAdded] = useState(false);
  const [shortfall, setShortfall] = useState(0);

  const cart = useCart();
  const giftConfig = useGiftConfig();
  const couldClaimBefore = useRef(false);
  const sawGiftState = useRef(false);

  // Offered here only when it can actually be taken: the bag has earned a gift,
  // this candle is one of the giftable ones, and none has been claimed yet.
  const canClaimFree =
    cart.ready &&
    giftConfig.enabled &&
    product.giftEligible &&
    product.inStock &&
    !cart.giftSlug &&
    giftUnlocked(giftConfig, cart.subtotal);

  // Everything below is derived from the quantity.
  const unitPrice = priceAtQty(product, qty);
  const retail = qty <= RETAIL_MAX;
  const total = unitPrice * qty;
  // The band the current quantity falls in: the highest whose minimum it reaches.
  const activeIndex = bands.reduce((best, b, i) => (qty >= b.minQty ? i : best), 0);
  const activeLabel = bands[activeIndex]?.label ?? "Single";

  const clamp = (value: number) => Math.max(1, Math.min(9999, Math.floor(value)));

  function chooseBand(index: number) {
    const next = bands[index];
    setQty(next.minQty);
    setDraft(null);
    setAdded(false);
    setShortfall(0);
    track("tier_selected", {
      product: product.slug,
      band: next.label,
      unit_price: priceAtQty(product, next.minQty),
    });
  }

  function addToCart() {
    const went = cart.add(
      {
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? null,
        unitPrice,
        packWeightGrams: packGramsOf(product),
      },
      qty,
    );
    setShortfall(qty - went);
    setAdded(went > 0);
    track("add_to_cart", {
      product: product.slug,
      name: product.name,
      qty: went,
      requested: qty,
      unit_price: unitPrice,
      value: unitPrice * went,
    });
  }

  function openEnquiry() {
    setEnquiry(true);
    track("bulk_quote_opened", { product: product.slug, qty, unit_price: unitPrice });
  }

  /**
   * Crossing the threshold on a giftable candle swaps the progress line out for
   * the claim banner — so the line unmounts on the very render that earns the
   * gift and never gets to celebrate. The banner takes that job here instead,
   * which keeps exactly one celebration per crossing.
   */
  useEffect(() => {
    if (!cart.ready) return;
    const crossedJustNow = sawGiftState.current && canClaimFree && !couldClaimBefore.current;
    couldClaimBefore.current = canClaimFree;
    sawGiftState.current = true;
    if (crossedJustNow) celebrateUnlock();
  }, [canClaimFree, cart.ready]);

  return (
    <>
      {canClaimFree && (
        <button
          type="button"
          onClick={() => {
            cart.setGift(product.slug);
            celebrateGift();
          }}
          className="gift-shine relative mt-9 flex w-full items-center gap-3 overflow-hidden rounded-[16px] border border-ember/40 bg-ember-wash px-5 py-4 text-left transition-colors hover:border-ember"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ember-deep">
            <Gift size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[1.02rem] leading-snug text-ink">
              Have this one free
            </span>
            <span className="mt-0.5 block text-[0.82rem] text-ink-soft">
              Your bag has earned a free candle — tap to claim this one.
            </span>
          </span>
        </button>
      )}

      <div className="mt-9 rounded-[16px] border border-line bg-surface p-5 sm:p-6">
        {/* The price, on its own line so nothing can crowd it on a phone. */}
        <p className="eyebrow">Price per piece</p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[2rem] leading-none text-ink tabular-nums">
            {money(unitPrice)}
          </span>
          {product.mrp > unitPrice && (
            <>
              <span className="text-[1.15rem] font-semibold text-[#c0392b] line-through decoration-[#c0392b] decoration-[2px] tabular-nums">
                {money(product.mrp)}
              </span>
              <span className="rounded-md bg-[#e7f4ea] px-2.5 py-1 text-[0.78rem] font-bold tracking-wide whitespace-nowrap text-[#2e7d32]">
                {Math.round(((product.mrp - unitPrice) / product.mrp) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Bands — quantity shortcuts */}
        {bands.length > 1 && (
          <div className="mt-6">
            <p className="text-[0.8rem] font-medium text-ink">Buying more than one?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bands.map((option, i) => (
                <button
                  key={option.minQty}
                  type="button"
                  onClick={() => chooseBand(i)}
                  aria-pressed={i === activeIndex}
                  className={`rounded-full border px-4 py-2 text-[0.85rem] whitespace-nowrap transition-colors ${
                    i === activeIndex
                      ? "border-ink bg-ink text-canvas"
                      : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-soft">
              {retail
                ? "The more you buy, the lower the rate — it updates as you change the number."
                : "This is a bulk quote. We confirm the rate with you before anything is due."}
            </p>
          </div>
        )}

        {/* Quantity */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[0.8rem] font-medium text-ink">
            {retail ? "How many?" : "Roughly how many?"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex items-center rounded-full border border-line bg-canvas">
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setAdded(false);
                  setQty((q) => Math.max(1, q - 1));
                }}
                disabled={qty <= 1}
                aria-label="One fewer"
                className="flex h-11 w-11 items-center justify-center rounded-l-full text-ink transition-colors hover:bg-canvas-deep disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={9999}
                value={draft ?? String(qty)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = Number(raw);

                  // An empty or half-typed box leaves the quantity where it was
                  // rather than guessing at one, so backspacing works.
                  if (raw.trim() === "" || !Number.isFinite(parsed) || parsed < 1) {
                    setDraft(raw);
                    return;
                  }

                  const next = clamp(parsed);
                  setQty(next);
                  setDraft(String(next));
                  setAdded(false);
                }}
                onBlur={() => setDraft(null)}
                aria-label="Quantity"
                className="h-11 w-[4.5rem] [appearance:textfield] border-x border-line bg-transparent text-center text-[1rem] text-ink tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setAdded(false);
                  setQty((q) => Math.min(9999, q + 1));
                }}
                disabled={qty >= 9999}
                aria-label="One more"
                className="flex h-11 w-11 items-center justify-center rounded-r-full text-ink transition-colors hover:bg-canvas-deep disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Plus size={16} />
              </button>
            </div>

            <span className="text-[0.9rem] text-ink-soft tabular-nums">
              {money(total)}
              <span className="text-ink-faint"> total</span>
            </span>
          </div>

          {retail && qty === RETAIL_MAX && (
            <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-soft">
              Need more than {RETAIL_MAX}? Add one more and we switch you to a bulk quote.
            </p>
          )}
        </div>

        {/* The one action that matters — it follows the quantity. */}
        <div className="mt-6">
          {retail ? (
            <>
              <button
                type="button"
                onClick={addToCart}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember"
              >
                {added ? <Check size={17} /> : <ShoppingBag size={17} />}
                {added ? "Added to bag" : "Add to bag"}
              </button>

              {/* Next to the buy action, not in a banner: shoppers must look here
                  to proceed, and up to 27% never see a site-wide strip at all. */}
              {!canClaimFree && <GiftProgress variant="compact" />}

              {shortfall > 0 && (
                <p className="mt-3 rounded-[12px] bg-ember-wash px-4 py-3 text-[0.82rem] leading-relaxed text-ember-deep">
                  You can buy up to {RETAIL_MAX} of one design online, so {shortfall} did not fit. Want more?
                  Increase the number for a bulk quote and we quote you directly.
                </p>
              )}

              {added && (
                <Link
                  href="/cart"
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-7 py-3.5 text-[0.9rem] text-ink transition-colors hover:border-ink"
                >
                  Go to bag ({cart.count})
                </Link>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={openEnquiry}
              style={{
                backgroundImage:
                  "linear-gradient(95deg, #405DE6 0%, #833AB4 35%, #C13584 60%, #E1306C 80%, #F77737 100%)",
              }}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-4 text-[0.95rem] font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <InstagramIcon size={18} />
              Chat for {qty} pieces
            </button>
          )}

          <p className="mt-3 text-center text-[0.78rem] leading-relaxed text-ink-faint">
            {retail
              ? "Secure checkout. Dispatched in 2–4 working days."
              : `${activeLabel} bulk rate · no payment now. We confirm your rate, fragrance and delivery date first.`}
          </p>
        </div>
      </div>

      {enquiry && (
        <EnquiryDialog
          product={product}
          fragrances={fragrances}
          instagramHandle={instagramHandle}
          businessName={businessName}
          initialQty={qty}
          unitPrice={unitPrice}
          onClose={() => setEnquiry(false)}
        />
      )}
    </>
  );
}
