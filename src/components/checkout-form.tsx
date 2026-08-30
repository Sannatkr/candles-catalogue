"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, MapPin, ShieldCheck } from "lucide-react";
import { track } from "@/lib/analytics";
import { GiftBanner } from "@/components/gift-banner";
import { useCart } from "@/lib/cart";
import { resolveGift, surpriseIncluded } from "@/lib/gift";
import { instagramChatLink, money } from "@/lib/format";
import { abandonOrder, confirmPayment, startCheckout } from "@/lib/orders";
import { lookupPincode } from "@/lib/pincode";
import { shippingCost } from "@/lib/shipping";
import { singlePrice } from "@/lib/pricing";
import type { GiftConfig, Product, ShippingConfig } from "@/lib/types";

/**
 * Address, then payment. Razorpay's own sheet handles the card details — this
 * page never sees a card number, and the amount it is asked to charge is the
 * one the server worked out, not the one in localStorage.
 */

const FIELD =
  "w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-ink/50 focus:outline-none";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; contact: string; email?: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export function CheckoutForm({
  configured,
  instagramHandle,
  shippingConfig,
  giftConfig,
  giftProducts,
}: {
  configured: boolean;
  instagramHandle: string;
  shippingConfig: ShippingConfig;
  giftConfig: GiftConfig;
  giftProducts: Product[];
}) {
  const router = useRouter();
  const cart = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [lookup, setLookup] = useState<{ pincode: string; state: string; district: string } | null>(null);
  const [city, setCity] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const pincodeOk = /^\d{6}$/.test(pincode);
  const resolved = lookup?.pincode === pincode ? lookup : null;
  const lookingUp = pincodeOk && !resolved;

  // Flat delivery, free over a subtotal but only while the parcel stays light.
  const gift = resolveGift(giftConfig, giftProducts, cart.subtotal, cart.giftSlug);
  const surprise = surpriseIncluded(giftConfig, cart.subtotal) && giftProducts.length > 0;
  const shipping = shippingCost(shippingConfig, { grams: cart.weightGrams, subtotal: cart.subtotal });
  const total = cart.subtotal + shipping;

  useEffect(() => {
    if (!pincodeOk) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const found = await lookupPincode(pincode, controller.signal);
      if (controller.signal.aborted || !found) return;
      setLookup({ pincode, state: found.state, district: found.district });
      // Only fill the town if the buyer has not typed their own.
      setCity((current) => current.trim() || found.district);
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pincode, pincodeOk]);

  const begun = useRef(false);
  useEffect(() => {
    if (begun.current || !cart.ready || !cart.lines.length) return;
    begun.current = true;
    track("begin_checkout", { value: cart.subtotal, items: cart.lines.length, pieces: cart.count });
  }, [cart.ready, cart.lines.length, cart.subtotal, cart.count]);

  const canSubmit =
    Boolean(name.trim()) &&
    phoneDigits.length === 10 &&
    pincodeOk &&
    Boolean(city.trim()) &&
    address1.trim().length >= 6 &&
    cart.lines.length > 0 &&
    agreed &&
    !busy;

  if (!cart.ready) return <div className="mt-10 h-40" aria-hidden />;

  if (!cart.lines.length) {
    return (
      <div className="mt-10 rounded-[18px] border border-line bg-surface px-6 py-14 text-center">
        <p className="font-display text-[1.25rem] text-ink">Your bag is empty</p>
        <Link
          href="/products"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-[0.925rem] text-canvas transition-colors hover:bg-ember"
        >
          Browse the range
        </Link>
      </div>
    );
  }

  // Submitted from the form on a phone, clicked from the summary on a desktop —
  // hence the wider event type.
  async function pay(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");

    const started = await startCheckout({
      lines: cart.lines.map((l) => ({ slug: l.slug, qty: l.qty })),
      giftSlug: cart.giftSlug,
      buyerName: name,
      phone,
      email,
      instagram: "",
      pincode,
      state: resolved?.state ?? "",
      city,
      addressLine1: address1,
      addressLine2: address2,
      note,
    });

    if (!started.ok) {
      setBusy(false);
      setError(started.message);
      return;
    }

    if (!window.Razorpay) {
      setBusy(false);
      setError("The payment window could not load. Check your connection and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: started.keyId,
      amount: started.amount,
      currency: "INR",
      name: "Sugandha Candles",
      description: started.reference,
      order_id: started.razorpayOrderId,
      prefill: {
        name: started.buyerName,
        contact: started.phone,
        email: started.email || undefined,
      },
      notes: { reference: started.reference },
      theme: { color: "#b5643c" },
      handler: async (response) => {
        const confirmed = await confirmPayment({
          orderId: started.orderId,
          reference: started.reference,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });

        if (!confirmed.ok) {
          setBusy(false);
          setError(confirmed.message);
          return;
        }

        track("purchase", {
          reference: started.reference,
          value: started.amount / 100,
          items: cart.lines.length,
          pieces: cart.count,
        });
        cart.clear();
        router.push(`/orders/${started.orderId}?ref=${started.reference}`);
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          void abandonOrder(started.orderId, started.reference);
          track("checkout_dismissed", { reference: started.reference });
        },
      },
    });

    checkout.open();
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />

      {!configured && (
        <div className="mt-8 rounded-[14px] border border-ember/40 bg-ember-wash px-5 py-4 text-[0.875rem] leading-relaxed text-ember-deep">
          Online payment is not switched on yet.{" "}
          <a
            href={instagramChatLink(instagramHandle)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Message us on Instagram
          </a>{" "}
          and we will take the order by hand.
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <form onSubmit={pay} className="min-w-0">
          <p className="eyebrow">Where it goes</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[0.82rem] font-medium text-ink">Full name</span>
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who is receiving this"
                className={`mt-2.5 ${FIELD}`}
              />
            </label>

            <label className="block">
              <span className="text-[0.82rem] font-medium text-ink">Phone</span>
              <input
                required
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className={`mt-2.5 ${FIELD}`}
              />
              <span className="mt-2 block text-[0.75rem] text-ink-faint">
                {phone && phoneDigits.length !== 10
                  ? "That needs to be 10 digits."
                  : "The courier calls this number."}
              </span>
            </label>

            <label className="block">
              <span className="text-[0.82rem] font-medium text-ink">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`mt-2.5 ${FIELD}`}
              />
              <span className="mt-1.5 block text-[0.75rem] leading-relaxed text-ink-faint">
                Your receipt goes here, and it is how you sign in later to see this order.
              </span>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-[0.82rem] font-medium text-ink">Address</span>
              <input
                required
                autoComplete="address-line1"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="Flat / house number, building, street"
                className={`mt-2.5 ${FIELD}`}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="sr-only">Area or landmark</span>
              <input
                autoComplete="address-line2"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="Area, landmark — optional"
                className={FIELD}
              />
            </label>

            <label className="block">
              <span className="text-[0.82rem] font-medium text-ink">Pincode</span>
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
                ) : resolved ? (
                  <>
                    <MapPin size={12} className="shrink-0 text-ember" />
                    <span className="truncate">{resolved.state}</span>
                  </>
                ) : (
                  "We fill in the rest."
                )}
              </span>
            </label>

            <label className="block">
              <span className="text-[0.82rem] font-medium text-ink">Town or city</span>
              <input
                required
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Noida"
                className={`mt-2.5 ${FIELD}`}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-[0.82rem] font-medium text-ink">
                Delivery note <span className="font-normal text-ink-faint">— optional</span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Gate code, best time to deliver, gift message…"
                className={`mt-2.5 resize-none leading-relaxed ${FIELD}`}
              />
            </label>
          </div>

          {error && (
            <p className="mt-6 rounded-[12px] border border-ember/40 bg-ember-wash px-4 py-3 text-[0.875rem] leading-relaxed text-ember-deep">
              {error}
            </p>
          )}

          <label className="mt-6 flex items-start gap-2.5 text-[0.82rem] leading-relaxed text-ink-soft lg:hidden">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
            />
            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
                Terms &amp; Conditions
              </a>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || !scriptReady || !configured}
            className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember disabled:opacity-40 lg:hidden"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {busy ? "Opening payment…" : `Pay ${money(total)}`}
          </button>
        </form>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[18px] border border-line bg-surface p-5 sm:p-6">
            <p className="eyebrow">Your order</p>

            <ul className="mt-4 space-y-4">
              {cart.lines.map((line) => (
                <li key={line.slug} className="flex items-center gap-3.5">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
                    {line.image && (
                      <Image src={line.image} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9rem] text-ink">{line.name}</span>
                    <span className="block text-[0.78rem] text-ink-faint tabular-nums">
                      {line.qty} × {money(line.unitPrice)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.9rem] text-ink tabular-nums">
                    {money(line.qty * line.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <GiftBanner config={giftConfig} products={giftProducts} shipping={shippingConfig} readOnly />
            </div>

            <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[0.925rem]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="text-ink tabular-nums">{money(cart.subtotal)}</dd>
              </div>
              {gift && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="truncate text-ink-soft">
                    {gift.name} <span className="text-ink-faint">(gift)</span>
                  </dt>
                  <dd className="shrink-0 tabular-nums">
                    <s className="text-ink-faint">{money(singlePrice(gift))}</s>{" "}
                    <b className="font-semibold text-[#3d5730]">FREE</b>
                  </dd>
                </div>
              )}
              {surprise && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="truncate text-ink-soft">
                    {giftConfig.surpriseLabel} <span className="text-ink-faint">(gift)</span>
                  </dt>
                  <dd className="shrink-0 font-semibold text-[#3d5730]">FREE</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="text-ink tabular-nums">
                  {shipping === 0 ? <span className="text-[#3d5730]">Free</span> : money(shipping)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <dt className="text-ink">Total</dt>
                <dd className="font-display text-[1.4rem] text-ink tabular-nums">{money(total)}</dd>
              </div>
            </dl>

            <label className="mt-5 hidden items-start gap-2.5 text-[0.82rem] leading-relaxed text-ink-soft lg:flex">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
              />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
                  Terms &amp; Conditions
                </a>
                .
              </span>
            </label>

            <button
              type="button"
              onClick={pay}
              disabled={!canSubmit || !scriptReady || !configured}
              className="mt-4 hidden w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember disabled:opacity-40 lg:inline-flex"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {busy ? "Opening payment…" : `Pay ${money(total)}`}
            </button>

            <p className="mt-4 flex items-start gap-2 text-[0.78rem] leading-relaxed text-ink-faint">
              <ShieldCheck size={14} className="mt-px shrink-0" />
              Card, UPI and netbanking through Razorpay. We never see your card details.
            </p>
          </div>

          <Link
            href="/cart"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-[0.875rem] text-ink-soft transition-colors hover:text-ink"
          >
            Back to bag
          </Link>
        </div>
      </div>
    </>
  );
}
