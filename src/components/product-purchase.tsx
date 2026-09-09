"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { BulkEnquiryDialog } from "@/components/bulk-enquiry-dialog";
import { InstagramIcon } from "@/components/instagram-icon";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import { celebrateUnlock, originOf } from "@/lib/celebrate";
import { money } from "@/lib/format";
import {
  freeShipQtyOf,
  maxQtyOf,
  minQtyOf,
  singlePrice,
  slabsFor,
  unitPriceAt,
} from "@/lib/pricing";
import { useBulkTiers } from "@/lib/shop-config";
import { packGramsOf } from "@/lib/shipping";
import type { Product } from "@/lib/types";

/**
 * The buying block on a product page.
 *
 * Three things move with the quantity, and they are the whole point of it: the
 * price per piece, which steps down the bulk ladder; free delivery, which this
 * candle earns at its own quantity; and the button itself, which stops being a
 * checkout and becomes an enquiry once the parcel will not hold any more.
 *
 * The ladder is shown in full, including the rungs this candle cannot reach
 * online. A peacock urli stops at 7 in a parcel, but the buyer asking for 100
 * of them is the buyer worth having — the greyed rungs are what tells them the
 * rate keeps falling and that there is a form for it.
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
  const cap = maxQtyOf(product);
  const freeShipAt = freeShipQtyOf(product);
  const tiers = useBulkTiers();
  const slabs = slabsFor(product, tiers);
  const basePrice = singlePrice(product);

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

  const unitPrice = unitPriceAt(product, tiers, qty);
  const online = qty <= cap;
  const total = unitPrice * qty;
  const saving = (basePrice - unitPrice) * qty;
  const sets = step > 1 && qty % step === 0 ? qty / step : 0;
  const shipsFree = freeShipAt > 0 && qty >= freeShipAt && online;
  const toFreeShip = freeShipAt > 0 && online ? Math.max(0, freeShipAt - qty) : 0;

  const freeShipRef = useRef<HTMLParagraphElement | null>(null);
  const wasFree = useRef(false);

  /**
   * The bulk action wears the Instagram gradient wherever it appears — the
   * owner's own brand colour for "talk to us", and the one thing on this page
   * that must not read as a second Add to bag. It opens the enquiry form, and
   * the form's last step hands the buyer to the Instagram chat.
   */
  const INSTAGRAM =
    "linear-gradient(95deg, #405DE6 0%, #833AB4 35%, #C13584 60%, #E1306C 80%, #F77737 100%)";
  const bulkClass =
    "insta-pulse inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-4 text-[0.95rem] font-medium text-white shadow-sm transition-opacity hover:opacity-90";

  function changeQty(next: number) {
    setQty(Math.max(step, Math.min(100000, next)));
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
        basePrice,
        packWeightGrams: packGramsOf(product),
        minQty: step,
        maxQty: cap,
        freeShipQty: freeShipAt,
        bulkPricing: product.bulkPricing,
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

  /** The one moment worth a celebration: the quantity that earns free delivery. */
  useEffect(() => {
    if (shipsFree && !wasFree.current) celebrateUnlock(originOf(freeShipRef.current));
    wasFree.current = shipsFree;
  }, [shipsFree]);

  return (
    <>
      <div className="mt-9 rounded-[16px] border border-line bg-surface p-5 sm:p-6">
        {/* The price, on its own line so nothing can crowd it on a phone. */}
        <p className="eyebrow">
          {unitPrice < basePrice ? `Price per piece at ${qty}` : "Price per piece"}
        </p>

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

        {/* The ladder. Shown whole, including what this candle cannot ship. */}
        {slabs.length > 0 && (
          <div className="mt-5 border-t border-line pt-5">
            <p className="text-[0.8rem] font-medium text-ink">Buying more? The price comes down.</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {slabs.map((slab) => {
                const live = online && qty >= slab.minQty;
                return (
                  <li key={slab.minQty}>
                    {/* Tapping a rung IS the quantity picker. On a candle whose
                        ceiling sits below the rung this sets a quantity the
                        checkout will not take, which is deliberate: the buy
                        button turns into the quote button and the buyer lands
                        exactly where that quantity has to be handled. */}
                    <button
                      type="button"
                      onClick={() => changeQty(slab.minQty)}
                      aria-pressed={live}
                      className={`w-full rounded-[12px] border px-3 py-2.5 text-center transition-colors ${
                        live
                          ? "border-ember bg-ember-wash/60"
                          : slab.online
                            ? "border-line bg-canvas hover:border-ink"
                            : "border-dashed border-line bg-canvas hover:border-ink"
                      }`}
                    >
                      <span className="block text-[0.72rem] tracking-wide text-ink-faint tabular-nums">
                        {slab.minQty}+ pcs
                      </span>
                      <span
                        className={`mt-1 block text-[0.95rem] tabular-nums ${
                          slab.online ? "text-ink" : "text-ink-faint"
                        }`}
                      >
                        {money(slab.unitPrice)}
                      </span>
                      <span className="mt-0.5 block text-[0.68rem] text-ink-faint">
                        {slab.online ? `${slab.percentOff}% off` : "On enquiry"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {slabs.some((s) => !s.online) && (
              <p className="mt-2.5 text-[0.78rem] leading-relaxed text-ink-faint">
                Up to {cap} of this design go through the checkout. Past that we quote you — and the
                rate keeps falling.
              </p>
            )}
          </div>
        )}

        {!product.bulkPricing && (
          <p className="mt-4 text-[0.82rem] leading-relaxed text-ink-soft">
            One fixed price on this one, whatever the quantity — it is already at its bulk rate.
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
                max={100000}
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
                    setQty(Math.min(100000, Math.floor(parsed)));
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
                aria-label={step > 1 ? `${step} more` : "One more"}
                className="flex h-11 w-11 items-center justify-center rounded-r-full text-ink transition-colors hover:bg-canvas-deep"
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

          {saving > 0 && online && (
            <p className="mt-3 text-[0.82rem] text-[#3d5730] tabular-nums">
              Bulk rate applied — you save {money(saving)} on this line.
            </p>
          )}

          {step > 1 && (
            <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-soft">
              The buttons add or remove a set of {step}. Type in the box for any other number of {step} or more.
            </p>
          )}

          {/* Free delivery, earned by this one design. */}
          {freeShipAt > 0 && (
            <p
              ref={freeShipRef}
              className={`mt-4 flex items-start gap-2.5 rounded-[12px] px-4 py-3 text-[0.82rem] leading-relaxed ${
                shipsFree ? "free-ship-pop bg-[#e6efe3] text-[#3d5730]" : "bg-canvas-deep text-ink-soft"
              }`}
            >
              <Truck size={15} className="mt-0.5 shrink-0" />
              {shipsFree ? (
                <span>
                  <b className="font-semibold">Delivery is on us.</b> {qty} pieces of this design ships
                  free, anywhere in India.
                </span>
              ) : (
                <span>
                  Add {toFreeShip} more — {freeShipAt} of this design and delivery is free.
                </span>
              )}
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

              {shortfall > 0 && (
                <p className="mt-3 rounded-[12px] bg-ember-wash px-4 py-3 text-[0.82rem] leading-relaxed text-ember-deep">
                  You can buy up to {cap} of this design online, so {shortfall} did not fit. For more
                  than that, send a bulk enquiry and we quote you directly.
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

              <button
                type="button"
                onClick={openEnquiry}
                style={{ backgroundImage: INSTAGRAM }}
                className={`mt-2.5 ${bulkClass}`}
              >
                <InstagramIcon size={18} />
                Buying in bulk? Get a quote
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openEnquiry}
              style={{ backgroundImage: INSTAGRAM }}
              className={bulkClass}
            >
              <InstagramIcon size={18} />
              Get a quote for {qty} pieces
            </button>
          )}

          <p className="mt-3 text-center text-[0.78rem] leading-relaxed text-ink-faint">
            {online
              ? "Secure checkout. Dispatched in 2–4 working days."
              : `More than ${cap} of this design is a quote, not a checkout. No payment now — we confirm your rate, fragrance and delivery date first.`}
          </p>
        </div>
      </div>

      {enquiry && (
        <BulkEnquiryDialog
          fragrances={fragrances}
          instagramHandle={instagramHandle}
          businessName={businessName}
          initialPicks={[{ slug: product.slug, qty: Math.max(step, qty) }]}
          onClose={() => setEnquiry(false)}
        />
      )}
    </>
  );
}
