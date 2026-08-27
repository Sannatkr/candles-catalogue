"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Loader2, MapPin, X } from "lucide-react";
import { FragrancePicker } from "@/components/fragrance-picker";
import { InstagramIcon } from "@/components/instagram-icon";
import { track } from "@/lib/analytics";
import { CUSTOMISE_FROM } from "@/lib/booking-config";
import { placeBooking } from "@/lib/bookings";
import {
  compactQty,
  instagramChatLink,
  isValidInstagramHandle,
  money,
  onMobileDevice,
} from "@/lib/format";
import { lookupPincode } from "@/lib/pincode";
import type { Product } from "@/lib/types";

/**
 * The bulk path. Ten pieces and up is a conversation, not a checkout — the rate
 * gets confirmed, a fragrance gets chosen, freight gets worked out.
 *
 * Only three things are actually required: a name, a pincode, and one way to
 * reach the buyer. That last one is either a phone number or an Instagram
 * handle — asking for both is how a form loses people, and either one is enough
 * to answer them.
 */

const FIELD =
  "w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-ink/50 focus:outline-none";

export function EnquiryDialog({
  product,
  fragrances,
  instagramHandle,
  businessName,
  initialQty,
  unitPrice,
  onClose,
}: {
  product: Product;
  fragrances: string[];
  instagramHandle: string;
  businessName: string;
  initialQty: number;
  unitPrice: number;
  onClose: () => void;
}) {
  const [qty] = useState(initialQty);
  const [fragrance, setFragrance] = useState(product.fragrance || fragrances[0] || "");
  const [pincode, setPincode] = useState("");
  const [lookup, setLookup] = useState<{ pincode: string; state: string | null; district: string } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const total = unitPrice * qty;
  const canPickFragrance = qty >= CUSTOMISE_FROM;
  const onPhone = onMobileDevice();

  // Ten digits, however they typed it — spaces, +91, dashes.
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const phoneOk = phoneDigits.length === 10;
  const instagramOk = Boolean(instagram.trim()) && isValidInstagramHandle(instagram);
  const reachable = phoneOk || instagramOk;
  const pincodeOk = /^\d{6}$/.test(pincode);
  const canSubmit = Boolean(name.trim()) && reachable && pincodeOk && !busy;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (!pincodeOk) return;
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
  }, [pincode, pincodeOk]);

  const resolved = lookup?.pincode === pincode ? lookup : null;
  const lookingUp = pincodeOk && !resolved;

  // A fresh object every render would make every memo below it useless.
  const place = useMemo(
    () => (resolved?.state ? { state: resolved.state, district: resolved.district } : null),
    [resolved],
  );

  const productUrl =
    typeof window === "undefined" ? "" : `${window.location.origin}/products/${product.slug}`;

  const summary = useMemo(
    () =>
      [
        `Bulk enquiry — ${businessName}`,
        ``,
        `Candle: ${product.name}`,
        productUrl,
        ``,
        `Quantity: ${compactQty(qty)} pcs`,
        `Rate quoted: ${money(unitPrice)} per piece`,
        `Order value: ${money(total)}`,
        canPickFragrance ? `Fragrance: ${fragrance}` : null,
        ``,
        `Name: ${name}`,
        instagramOk ? `Instagram: @${instagram.replace(/^@/, "")}` : null,
        phoneOk ? `Phone: ${phoneDigits}` : null,
        `Delivery: ${pincode}${place ? ` — ${place.district}, ${place.state}` : ""}`,
        address ? `Address: ${address}` : null,
        note ? `Note: ${note}` : null,
        done && done !== "PREVIEW" ? `` : null,
        done && done !== "PREVIEW" ? `Reference: ${done}` : null,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    [
      businessName, product.name, productUrl, qty, unitPrice, total, canPickFragrance, fragrance,
      name, instagramOk, instagram, phoneOk, phoneDigits, pincode, place, address, note, done,
    ],
  );

  const autoCopied = useRef(false);
  useEffect(() => {
    if (done === null || autoCopied.current) return;
    autoCopied.current = true;
    navigator.clipboard
      ?.writeText(summary)
      .then(() => setCopied(true))
      .catch(() => {});
  }, [done, summary]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");

    const result = await placeBooking({
      productSlug: product.slug,
      productName: product.name,
      productImage: product.images[0] ?? null,
      quantity: qty,
      unitPrice,
      fragrance: canPickFragrance ? fragrance : null,
      pincode,
      state: place ? `${place.district ? `${place.district}, ` : ""}${place.state}` : null,
      buyerName: name,
      buyerContact: instagramOk ? instagram : "",
      phone: phoneOk ? phoneDigits : "",
      note: [address ? `Address: ${address}` : null, note || null].filter(Boolean).join("\n") || null,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    track("bulk_quote_submitted", {
      product: product.slug,
      qty,
      unit_price: unitPrice,
      value: total,
      reachable_by: instagramOk && phoneOk ? "both" : instagramOk ? "instagram" : "phone",
    });
    setDone(result.reference ?? "");
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
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
        aria-label={`Reserve ${product.name}`}
        className="flex max-h-[92dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[22px] bg-canvas sm:rounded-[22px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4 sm:px-7">
          <p className="font-display text-[1.2rem] text-ink">
            {done !== null ? "Reserved" : "Reserve your slot"}
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
          <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-7">
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6efe3] text-[#3d5730]">
                <Check size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[1.35rem] leading-snug text-ink">Slot held.</p>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
                  {compactQty(qty)} × {product.name}
                  {done && done !== "PREVIEW" && (
                    <>
                      {" "}
                      — reference <span className="text-ink">{done}</span>
                    </>
                  )}
                  . We come back with the confirmed rate and lead time.
                </p>
              </div>
            </div>

            {instagramOk ? (
              <div className="mt-6 rounded-[16px] border border-ember/35 bg-ember-wash/60 px-5 py-6 text-center">
                <p className="font-display text-[1.15rem] text-ink">Want it moving today?</p>
                <p className="mx-auto mt-2.5 max-w-[34ch] text-[0.925rem] leading-relaxed text-ink-soft">
                  Your enquiry is {copied ? "copied" : "ready to copy"} —{" "}
                  {onPhone ? "open the chat and" : "open our profile, press Message, then"}{" "}
                  <span className="mx-0.5 inline-block rounded-[6px] bg-ember px-2 py-0.5 font-medium tracking-wide text-canvas uppercase">
                    paste
                  </span>{" "}
                  it in.
                </p>

                <div aria-hidden className="mt-5 flex flex-col items-center -space-y-2.5">
                  {[0, 1, 2].map((i) => (
                    <ChevronDown
                      key={i}
                      size={26}
                      strokeWidth={2.6}
                      className="chevron-fall text-ember"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>

                <a
                  href={instagramChatLink(instagramHandle)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={copySummary}
                  className="cta-pulse mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-4 text-[0.98rem] font-medium text-canvas transition-colors hover:bg-ember"
                >
                  <InstagramIcon size={17} />
                  {onPhone ? "Open Instagram & paste" : "Open Instagram"}
                </a>

                <button
                  type="button"
                  onClick={copySummary}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[0.82rem] text-ember-deep transition-colors hover:bg-ember-wash"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Details copied" : "Copy details"}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-[16px] border border-line bg-surface px-5 py-6 text-center">
                <p className="font-display text-[1.1rem] text-ink">We will call you</p>
                <p className="mx-auto mt-2 max-w-[34ch] text-[0.9rem] leading-relaxed text-ink-soft">
                  On {phoneDigits}, within one working day. Nothing else to do.
                </p>
              </div>
            )}

            <p className="mt-6 text-[0.8rem] font-medium text-ink">Your enquiry</p>
            <pre className="mt-2 max-h-40 overflow-y-auto rounded-[12px] border border-line bg-surface p-4 text-[0.8rem] leading-relaxed whitespace-pre-wrap text-ink-soft">
              {summary}
            </pre>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-full border border-line px-6 py-3 text-[0.875rem] text-ink transition-colors hover:border-ink"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <div className="flex items-center gap-4">
              {product.images[0] && (
                <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[12px] bg-canvas-deep">
                  <Image src={product.images[0]} alt="" fill sizes="68px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-[1.1rem] text-ink">{product.name}</p>
                <p className="mt-0.5 text-[0.85rem] text-ink-soft tabular-nums">
                  {compactQty(qty)} pcs · {money(unitPrice)} each
                </p>
              </div>
              <span className="ml-auto shrink-0 text-right">
                <span className="block font-display text-[1.2rem] text-ink tabular-nums">
                  {money(total)}
                </span>
                <span className="block text-[0.72rem] text-ink-faint">indicative</span>
              </span>
            </div>

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

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[0.82rem] font-medium text-ink">Your name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={`mt-2.5 ${FIELD}`}
                />
              </label>

              {/* One of these two, not both. The heading says so once, rather
                  than every field carrying an "optional" that means nothing. */}
              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-[0.82rem] font-medium text-ink">How should we reach you?</span>
                  <span
                    className={`text-[0.75rem] ${reachable ? "text-[#3d5730]" : "text-ink-faint"}`}
                  >
                    {reachable ? "That works" : "Either one is enough"}
                  </span>
                </div>

                <div className="mt-2.5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[0.75rem] text-ink-faint">Phone</span>
                    <input
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className={FIELD}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[0.75rem] text-ink-faint">Instagram</span>
                    <span className="relative flex items-center">
                      <span className="pointer-events-none absolute left-4 text-[0.95rem] text-ink-faint">
                        @
                      </span>
                      <input
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value.replace(/\s/g, ""))}
                        placeholder="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className={`${FIELD} pl-9`}
                      />
                    </span>
                  </label>
                </div>

                {instagram && !instagramOk && (
                  <p className="mt-2 text-[0.75rem] text-ember-deep">
                    Letters, numbers, dots and underscores only — no spaces.
                  </p>
                )}
                {phone && !phoneOk && (
                  <p className="mt-2 text-[0.75rem] text-ember-deep">
                    That needs to be a 10-digit mobile number.
                  </p>
                )}
              </div>

              <label className="block">
                <span className="text-[0.82rem] font-medium text-ink">Delivery pincode</span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
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
                      <MapPin size={12} className="shrink-0 text-ember" />
                      <span className="truncate">
                        {place.district ? `${place.district}, ` : ""}
                        {place.state}
                      </span>
                    </>
                  ) : (
                    "Sets your freight cost."
                  )}
                </span>
              </label>

              <label className="block">
                <span className="text-[0.82rem] font-medium text-ink">
                  Address <span className="font-normal text-ink-faint">— optional</span>
                </span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Add it now or later"
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
                  placeholder="Delivery date, custom colours, mixed designs, custom label…"
                  className={`mt-2.5 resize-none leading-relaxed ${FIELD}`}
                />
              </label>
            </div>

            {error && <p className="mt-5 text-[0.85rem] text-ember-deep">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember disabled:opacity-40"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy ? "Sending…" : "Reserve my slot"}
            </button>

            <p className="mt-3.5 text-center text-[0.78rem] leading-relaxed text-ink-faint">
              No payment now. We confirm the rate and lead time before anything is due.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
