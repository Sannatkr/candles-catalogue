"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { InstagramIcon } from "@/components/instagram-icon";
import { CUSTOMISE_FROM } from "@/lib/booking-config";
import { placeBooking } from "@/lib/bookings";
import { compactQty, instagramDmLink, money, priceFor } from "@/lib/format";
import type { Product } from "@/lib/types";

const QUICK = [10, 25, 50, 100];

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
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const unit = useMemo(() => priceFor(product, qty), [product, qty]);
  const total = unit * (Number.isFinite(qty) ? qty : 0);
  const needsDetail = qty >= CUSTOMISE_FROM;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const summary = [
    `Order request — ${businessName}`,
    ``,
    `Candle: ${product.name}`,
    `Quantity: ${compactQty(qty)} pcs`,
    `Rate: ${money(unit)} per piece`,
    `Total: ${money(total)}`,
    needsDetail ? `Fragrance: ${fragrance}` : null,
    needsDetail ? `Delivery pincode: ${pincode}` : null,
    ``,
    `Name: ${name}`,
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
      fragrance: needsDetail ? fragrance : null,
      pincode: needsDetail ? pincode : null,
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
      className="fixed inset-0 z-100 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Book ${product.name}`}
        className="max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[20px] bg-canvas sm:rounded-[20px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur-md">
          <p className="font-display text-[1.15rem] text-ink">
            {done !== null ? "Order noted" : "Book your order"}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-ink-soft hover:text-ink">
            <X size={19} />
          </button>
        </div>

        {done !== null ? (
          <div className="px-6 py-7">
            <p className="text-[0.95rem] leading-relaxed text-ink-soft">
              We have your request{done && done !== "PREVIEW" ? ` (ref ${done})` : ""}. One last step — send it
              to us on Instagram so we can reply to you there.
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
              Instagram does not let a website fill in a message for you, so the details are copied to your
              clipboard — just paste and send.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-6">
            <div className="flex items-center gap-4">
              {product.images[0] && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
                  <Image src={product.images[0]} alt="" fill sizes="64px" className="object-cover" />
                </div>
              )}
              <div>
                <p className="font-display text-[1.05rem] text-ink">{product.name}</p>
                <p className="text-[0.825rem] text-ink-soft">{product.tagline}</p>
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-7">
              <p className="text-[0.8rem] font-medium text-ink">How many pieces?</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQty(q)}
                    className={`rounded-full border px-4 py-2 text-[0.85rem] transition-colors ${
                      qty === q ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft hover:border-ink/40"
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
                  className="w-28 rounded-full border border-line bg-surface px-4 py-2 text-[0.85rem] text-ink focus:border-ink/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Live price */}
            <div className="mt-5 rounded-[12px] border border-line bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.85rem] text-ink-soft">Rate at this quantity</span>
                <span className="font-display text-[1.1rem] text-ink">{money(unit)} each</span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between border-t border-line-soft pt-2.5">
                <span className="text-[0.85rem] text-ink-soft">Estimated total</span>
                <span className="font-display text-[1.3rem] text-ink">{money(total)}</span>
              </div>
            </div>

            {needsDetail && (
              <div className="mt-5 grid gap-4 rounded-[12px] border border-ember-wash bg-ember-wash/50 p-5 sm:grid-cols-2">
                <p className="text-[0.8rem] text-ember-deep sm:col-span-2">
                  At {CUSTOMISE_FROM}+ pieces you can pick the fragrance, free of charge.
                </p>
                <label className="block">
                  <span className="text-[0.8rem] font-medium text-ink">Fragrance</span>
                  <select
                    value={fragrance}
                    onChange={(e) => setFragrance(e.target.value)}
                    className="mt-2 w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink focus:border-ink/40 focus:outline-none"
                  >
                    {fragrances.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[0.8rem] font-medium text-ink">Delivery pincode</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="201009"
                    className="mt-2 w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink focus:border-ink/40 focus:outline-none"
                  />
                </label>
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.8rem] font-medium text-ink">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink focus:border-ink/40 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[0.8rem] font-medium text-ink">Phone or Instagram</span>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  placeholder="@yourhandle"
                  className="mt-2 w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink focus:border-ink/40 focus:outline-none"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[0.8rem] font-medium text-ink">Anything else? (optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Needed by Diwali, custom label, mixed designs…"
                  className="mt-2 w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink focus:border-ink/40 focus:outline-none"
                />
              </label>
            </div>

            {error && <p className="mt-4 text-[0.85rem] text-ember-deep">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy ? "Sending…" : "Confirm order request"}
            </button>

            <p className="mt-3 text-center text-[0.78rem] text-ink-faint">
              This is a request, not a payment. We confirm the rate and lead time before anything is due.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
