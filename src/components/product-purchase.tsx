"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Gift, Minus, Plus, ShoppingBag } from "lucide-react";
import { EnquiryDialog } from "@/components/enquiry-dialog";
import { InstagramIcon } from "@/components/instagram-icon";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import { GiftProgress } from "@/components/gift-progress";
import { celebrateGift, celebrateUnlock } from "@/lib/celebrate";
import { giftUnlocked } from "@/lib/gift";
import { useGiftConfig } from "@/lib/gift-context";
import { instagramDmLink, money } from "@/lib/format";
import { MAX_ONLINE_QTY, minQtyOf, singlePrice } from "@/lib/pricing";
import { packGramsOf } from "@/lib/shipping";
import type { Product } from "@/lib/types";

/**
 * The buying block on a product page.
 *
 * One price, one quantity, one button. The price per piece never moves; the
 * total is simply price × quantity. Candles sold in sets (the mithai, in tens)
 * start at a set, step by a set, and refuse anything below a set — but any
 * number above it can be typed in, so 35 is fine. Past MAX_ONLINE_QTY the buy
 * button becomes a chat button, because that many is a quote, not a checkout.
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
  const step = minQtyOf(product);
  const unitPrice = singlePrice(product);

  const [qty, setQty] = useState(step);
  /**
   * What is literally in the box while it is being typed in, which is not the
   * same thing as the quantity. Clearing the field has to leave it empty for a
   * moment, and typing "3" on the way to "35" must not be snapped to 10 —
   * so the quantity only follows the box once what is in it is sellable.
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

  const online = qty <= MAX_ONLINE_QTY;
  const total = unitPrice * qty;
  const sets = step > 1 && qty % step === 0 ? qty / step : 0;

  function changeQty(next: number) {
    setQty(Math.max(step, Math.min(9999, next)));
    setDraft(null);
    setAdded(false);
    setShortfall(0);
  }

  function addToCart() {
    const went = cart.add(
      {
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? null,
        unitPrice,
        packWeightGrams: packGramsOf(product),
        minQty: step,
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

  const INSTAGRAM =
    "linear-gradient(95deg, #405DE6 0%, #833AB4 35%, #C13584 60%, #E1306C 80%, #F77737 100%)";
  const chatClass =
    "inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-4 text-[0.95rem] font-medium text-white shadow-sm transition-opacity hover:opacity-90";

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

        {step > 1 && (
          <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-soft">
            Sold in sets of {step} — <span className="text-ink tabular-nums">{money(unitPrice * step)}</span> a
            set. Take as many sets as you like, or any number from {step} up.
          </p>
        )}

        {/* Quantity */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[0.8rem] font-medium text-ink">How many pieces?</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex items-center rounded-full border border-line bg-canvas">
              <button
                type="button"
                onClick={() => changeQty(qty - step)}
                disabled={qty <= step}
                aria-label={step > 1 ? `${step} fewer` : "One fewer"}
                className="flex h-11 w-11 items-center justify-center rounded-l-full text-ink transition-colors hover:bg-canvas-deep disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={step}
                max={9999}
                step={step}
                value={draft ?? String(qty)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = Number(raw);
                  setDraft(raw);
                  setAdded(false);
                  // Follow the box only once it holds something sellable. Below
                  // the minimum it may just be half-typed — "3" on its way to "35".
                  if (raw.trim() !== "" && Number.isFinite(parsed) && parsed >= step) {
                    setQty(Math.min(9999, Math.floor(parsed)));
                  }
                }}
                onBlur={() => {
                  // Left below the minimum on purpose? Then they get the minimum.
                  const parsed = Number(draft);
                  if (draft !== null && Number.isFinite(parsed) && parsed >= 1 && parsed < step) setQty(step);
                  setDraft(null);
                }}
                aria-label="Quantity"
                className="h-11 w-[4.5rem] [appearance:textfield] border-x border-line bg-transparent text-center text-[1rem] text-ink tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => changeQty(qty + step)}
                disabled={qty >= 9999}
                aria-label={step > 1 ? `${step} more` : "One more"}
                className="flex h-11 w-11 items-center justify-center rounded-r-full text-ink transition-colors hover:bg-canvas-deep disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Plus size={16} />
              </button>
            </div>

            <span className="text-[0.9rem] text-ink-soft tabular-nums">
              {money(total)}
              <span className="text-ink-faint">
                {" "}
                for {qty} {qty === 1 ? "piece" : "pieces"}
                {sets > 0 && ` · ${sets} ${sets === 1 ? "set" : "sets"}`}
              </span>
            </span>
          </div>

          {step > 1 && (
            <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-soft">
              The buttons add or remove a set of {step}. Type in the box for any other number of {step} or more.
            </p>
          )}
        </div>

        {/* The one action that matters — it follows the quantity. */}
        <div className="mt-6">
          {online ? (
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
                  You can buy up to {MAX_ONLINE_QTY} of one design online, so {shortfall} did not fit. For more
                  than that, chat with us and we quote you directly.
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

              {/* Straight to the Instagram chat, the same way the header's Enquire
                  goes — bulk is a conversation, not a form. */}
              <a
                href={instagramDmLink(instagramHandle)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("bulk_chat_clicked", { product: product.slug, qty })}
                style={{ backgroundImage: INSTAGRAM }}
                className={`mt-2.5 ${chatClass}`}
              >
                <InstagramIcon size={18} />
                Buying in bulk? Chat with us
              </a>
            </>
          ) : (
            <button type="button" onClick={openEnquiry} style={{ backgroundImage: INSTAGRAM }} className={chatClass}>
              <InstagramIcon size={18} />
              Chat for {qty} pieces
            </button>
          )}

          <p className="mt-3 text-center text-[0.78rem] leading-relaxed text-ink-faint">
            {online
              ? "Secure checkout. Dispatched in 2–4 working days."
              : "No payment now. We confirm your rate, fragrance and delivery date first."}
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
