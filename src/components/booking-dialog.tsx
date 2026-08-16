"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, MapPin, X } from "lucide-react";
import { FragrancePicker } from "@/components/fragrance-picker";
import { InstagramIcon } from "@/components/instagram-icon";
import { CUSTOMISE_FROM } from "@/lib/booking-config";
import { placeBooking } from "@/lib/bookings";
import { compactQty, instagramDmLink, money, priceFor } from "@/lib/format";
import { lookupPincode } from "@/lib/pincode";
import type { Product } from "@/lib/types";

const QUICK = [10, 25, 50, 100];

const FIELD =
  "w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-ink/50 focus:outline-none";

export function BookingDialog({
  product,
  fragrances,
  instagramHandle,
  businessName,
  onClose,
}: {
  product: Product;
  fragrances: string[];
  instagramHandle: string;
  businessName: string;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(10);
  const [fragrance, setFragrance] = useState(product.fragrance || fragrances[0] || "");
  const [pincode, setPincode] = useState("");
  // Keyed by the pincode it belongs to, so a stale result never shows against a
  // freshly typed one — and nothing has to be reset synchronously.
  const [lookup, setLookup] = useState<{
    pincode: string;
    state: string | null;
    district: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const unit = useMemo(() => priceFor(product, qty), [product, qty]);
  const total = unit * (Number.isFinite(qty) ? qty : 0);
  const canPickFragrance = qty >= CUSTOMISE_FROM;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Fill in state and district as soon as a full pincode is typed.
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const found = await lookupPincode(pincode, controller.signal);
      if (controller.signal.aborted) return;
      setLookup({ pincode, state: found?.state ?? null, district: found?.district ?? "" });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pincode]);

  const resolved = lookup?.pincode === pincode ? lookup : null;
  const place = resolved?.state ? { state: resolved.state, district: resolved.district } : null;
  const lookingUp = /^\d{6}$/.test(pincode) && !resolved;

  // The dialog only ever mounts after a click, so window is always available.
  const productUrl =
    typeof window === "undefined" ? "" : `${window.location.origin}/products/${product.slug}`;

  const summary = [
    `Order request — ${businessName}`,
    ``,
    `Candle: ${product.name}`,
    productUrl,
    ``,
    `Quantity: ${compactQty(qty)} pcs`,
    `Rate: ${money(unit)} per piece`,
    `Total: ${money(total)}`,
    canPickFragrance ? `Fragrance: ${fragrance}` : null,
    `Delivery: ${pincode}${place ? ` — ${place.district}, ${place.state}` : ""}`,
    ``,
    name ? `Name: ${name}` : null,
    `Contact: ${contact}`,
    note ? `Note: ${note}` : null,
    done && done !== "PREVIEW" ? `` : null,
    done && done !== "PREVIEW" ? `Reference: ${done}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const result = await placeBooking({
      productSlug: product.slug,
      productName: product.name,
      productImage: product.images[0] ?? null,
      quantity: qty,
      unitPrice: unit,
      fragrance: canPickFragrance ? fragrance : null,
      pincode,
      state: place ? `${place.district ? `${place.district}, ` : ""}${place.state}` : null,
      buyerName: name,
      buyerContact: contact,
      note: note || null,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(result.reference ?? "");
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Could not copy. Select the text above instead.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Book ${product.name}`}
        className="flex max-h-[92dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[22px] bg-canvas sm:rounded-[22px]"
      >
        {/* Header sits outside the scroll area so nothing ever slides under it. */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4 sm:px-7">
          <p className="font-display text-[1.2rem] text-ink">
            {done !== null ? "Order noted" : "Book your order"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-ink-soft transition-colors hover:text-ink"
          >
            <X size={19} />
          </button>
        </div>

        {done !== null ? (
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
            <p className="text-[0.95rem] leading-relaxed text-ink-soft">
              We have your request{done && done !== "PREVIEW" ? ` (ref ${done})` : ""}. One last step — send
              it to us on Instagram so we can reply to you there.
            </p>

            <pre className="mt-5 max-h-52 overflow-y-auto rounded-[12px] border border-line bg-surface p-4 text-[0.8rem] leading-relaxed whitespace-pre-wrap text-ink-soft">
              {summary}
            </pre>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copySummary}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3.5 text-[0.9rem] text-ink transition-colors hover:border-ink"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy details"}
              </button>
              <a
                href={instagramDmLink(instagramHandle)}
                target="_blank"
                rel="noreferrer"
                onClick={copySummary}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
              >
                <InstagramIcon size={17} />
                Open Instagram &amp; paste
              </a>
            </div>

            <p className="mt-4 text-[0.78rem] leading-relaxed text-ink-faint">
              The link to this candle is in the message, so we see exactly which one you mean.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
            <div className="flex items-center gap-4">
              {product.images[0] && (
                <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[12px] bg-canvas-deep">
                  <Image src={product.images[0]} alt="" fill sizes="68px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-[1.1rem] text-ink">{product.name}</p>
                <p className="truncate text-[0.85rem] text-ink-soft">{product.tagline}</p>
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-8">
              <p className="text-[0.82rem] font-medium text-ink">How many pieces?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQty(q)}
                    className={`rounded-full border px-4 py-2.5 text-[0.875rem] transition-colors ${
                      qty === q
                        ? "border-ink bg-ink text-canvas"
                        : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                    }`}
                  >
                    {q}+
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={qty || ""}
                  onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
                  aria-label="Exact quantity"
                  className="w-24 rounded-full border border-line bg-surface px-4 py-2.5 text-center text-[0.875rem] text-ink focus:border-ink/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Live price */}
            <div className="mt-5 rounded-[14px] border border-line bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[0.875rem] text-ink-soft">Rate at this quantity</span>
                <span className="font-display text-[1.1rem] text-ink">{money(unit)} each</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line-soft pt-3">
                <span className="text-[0.875rem] text-ink-soft">Estimated total</span>
                <span className="font-display text-[1.35rem] text-ink">{money(total)}</span>
              </div>
            </div>

            {/* Fragrance, once the order is big enough to customise */}
            {canPickFragrance && (
              <div className="mt-6 rounded-[14px] border border-ember-wash bg-ember-wash/45 p-5">
                <p className="text-[0.82rem] font-medium text-ember-deep">
                  Pick your fragrance — free at {CUSTOMISE_FROM}+ pieces
                </p>
                <div className="mt-3">
                  <FragrancePicker options={fragrances} value={fragrance} onChange={setFragrance} />
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.82rem] font-medium text-ink">Delivery pincode</span>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="201301"
                  className={`mt-2.5 ${FIELD}`}
                />
                <span className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-ink-faint">
                  {lookingUp ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Checking…
                    </>
                  ) : place ? (
                    <>
                      <MapPin size={12} className="text-ember" />
                      {place.district ? `${place.district}, ` : ""}
                      {place.state}
                    </>
                  ) : (
                    "We use this to work out freight."
                  )}
                </span>
              </label>

              <label className="block">
                <span className="text-[0.82rem] font-medium text-ink">Phone or Instagram</span>
                <input
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="@yourhandle"
                  className={`mt-2.5 ${FIELD}`}
                />
                <span className="mt-2 block text-[0.75rem] text-ink-faint">So we can send the quote.</span>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-[0.82rem] font-medium text-ink">
                  Your name <span className="font-normal text-ink-faint">— optional</span>
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nice to know who we are talking to"
                  className={`mt-2.5 ${FIELD}`}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-[0.82rem] font-medium text-ink">
                  Anything else? <span className="font-normal text-ink-faint">— optional</span>
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Delivery date, a better price, custom colours, mixed designs, custom label…"
                  className={`mt-2.5 resize-none leading-relaxed ${FIELD}`}
                />
              </label>
            </div>

            {error && <p className="mt-5 text-[0.85rem] text-ember-deep">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy ? "Sending…" : "Confirm order request"}
            </button>

            <p className="mt-3.5 text-center text-[0.78rem] leading-relaxed text-ink-faint">
              This is a request, not a payment. We confirm the rate and lead time before anything is due.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
