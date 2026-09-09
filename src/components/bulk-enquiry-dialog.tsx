"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { FragrancePicker } from "@/components/fragrance-picker";
import { InstagramIcon } from "@/components/instagram-icon";
import { track } from "@/lib/analytics";
import { CUSTOMISE_FROM } from "@/lib/booking-config";
import { bulkCatalogue, placeBulkEnquiry, type BulkChoice } from "@/lib/bulk";
import {
  compactQty,
  instagramChatLink,
  isValidInstagramHandle,
  money,
  onMobileDevice,
} from "@/lib/format";
import { lookupPincode } from "@/lib/pincode";

/**
 * The bulk enquiry form: pick the candles, say how many of each, leave a way to
 * be reached.
 *
 * This replaces the old "chat with us" links that dropped a buyer into an empty
 * Instagram DM. An empty DM asks the buyer to compose the enquiry themselves,
 * and most of them never did — the ones who wrote at all wrote "price?". The
 * picker asks the two questions that make a quote possible (which candles, how
 * many) in the one place where the buyer is already looking at the range.
 *
 * Instagram is still here, but afterwards: the enquiry is saved first, then the
 * whole thing is copied to the clipboard so they can paste it into the chat if
 * they want an answer tonight.
 */

const FIELD =
  "w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-ink/50 focus:outline-none";

export function BulkEnquiryDialog({
  fragrances,
  instagramHandle,
  businessName,
  initialPicks,
  onClose,
}: {
  fragrances: string[];
  instagramHandle: string;
  businessName: string;
  /** Opened from a product page? Start with that candle already chosen. */
  initialPicks?: { slug: string; qty: number }[];
  onClose: () => void;
}) {
  const [catalogue, setCatalogue] = useState<BulkChoice[] | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>(() =>
    Object.fromEntries((initialPicks ?? []).map((p) => [p.slug, p.qty])),
  );
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<"pick" | "details">("pick");

  const [fragrance, setFragrance] = useState(fragrances[0] ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [pincode, setPincode] = useState("");
  const [lookup, setLookup] = useState<{ pincode: string; state: string | null; district: string } | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onPhone = onMobileDevice();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // The catalogue is not on the page — the picker asks for it when it opens.
  useEffect(() => {
    let live = true;
    bulkCatalogue()
      .then((rows) => live && setCatalogue(rows))
      .catch(() => live && setCatalogue([]));
    return () => {
      live = false;
    };
  }, []);

  const pincodeOk = /^\d{6}$/.test(pincode);
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
  const place = useMemo(
    () => (resolved?.state ? { state: resolved.state, district: resolved.district } : null),
    [resolved],
  );

  const chosen = useMemo(
    () => (catalogue ?? []).filter((c) => (picks[c.slug] ?? 0) > 0),
    [catalogue, picks],
  );
  const pieces = chosen.reduce((sum, c) => sum + (picks[c.slug] ?? 0), 0);
  const value = chosen.reduce((sum, c) => sum + (picks[c.slug] ?? 0) * c.basePrice, 0);
  const canPickFragrance = pieces >= CUSTOMISE_FROM;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!catalogue) return [];
    if (!q) return catalogue;
    return catalogue.filter((c) => c.name.toLowerCase().includes(q));
  }, [catalogue, query]);

  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const phoneOk = phoneDigits.length === 10;
  const instagramOk = Boolean(instagram.trim()) && isValidInstagramHandle(instagram);
  const reachable = phoneOk || instagramOk;
  const canSubmit = Boolean(name.trim()) && reachable && pincodeOk && pieces > 0 && !busy;

  function setQty(slug: string, qty: number, step: number) {
    setPicks((prev) => {
      const next = { ...prev };
      if (qty < step) delete next[slug];
      else next[slug] = Math.min(100000, qty);
      return next;
    });
  }

  const summary = useMemo(
    () =>
      [
        `Bulk enquiry — ${businessName}`,
        ``,
        ...chosen.map((c) => `${compactQty(picks[c.slug] ?? 0)} × ${c.name}`),
        ``,
        `Total: ${compactQty(pieces)} pcs`,
        `Indicative value: ${money(value)}`,
        canPickFragrance ? `Fragrance: ${fragrance}` : null,
        ``,
        `Name: ${name}`,
        instagramOk ? `Instagram: @${instagram.replace(/^@/, "")}` : null,
        phoneOk ? `Phone: ${phoneDigits}` : null,
        `Delivery: ${pincode}${place ? ` — ${place.district}, ${place.state}` : ""}`,
        note ? `Note: ${note}` : null,
        done && done !== "PREVIEW" ? `` : null,
        done && done !== "PREVIEW" ? `Reference: ${done}` : null,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    [
      businessName, chosen, picks, pieces, value, canPickFragrance, fragrance, name,
      instagramOk, instagram, phoneOk, phoneDigits, pincode, place, note, done,
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

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      setError("Could not copy. Select the text above instead.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");

    const result = await placeBulkEnquiry({
      picks: chosen.map((c) => ({ slug: c.slug, qty: picks[c.slug] ?? 0 })),
      fragrance: canPickFragrance ? fragrance : null,
      buyerName: name,
      phone: phoneOk ? phoneDigits : "",
      instagram: instagramOk ? instagram : "",
      pincode,
      state: place ? `${place.district ? `${place.district}, ` : ""}${place.state}` : null,
      note: note || null,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    track("bulk_enquiry_submitted", {
      designs: chosen.length,
      qty: pieces,
      value,
      reachable_by: instagramOk && phoneOk ? "both" : instagramOk ? "instagram" : "phone",
    });
    setDone(result.reference ?? "");
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bulk enquiry"
        className="flex max-h-[94dvh] w-full max-w-[680px] flex-col overflow-hidden rounded-t-[22px] bg-canvas sm:rounded-[22px]"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-5 py-4 sm:px-7">
          {step === "details" && done === null && (
            <button
              type="button"
              onClick={() => setStep("pick")}
              aria-label="Back to the candles"
              className="-ml-2 rounded-full p-2 text-ink-soft transition-colors hover:text-ink"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <p className="font-display text-[1.2rem] text-ink">
            {done !== null ? "Enquiry sent" : step === "pick" ? "Bulk enquiry" : "Where do we send the quote?"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 ml-auto rounded-full p-2 text-ink-soft transition-colors hover:text-ink"
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
                <p className="font-display text-[1.35rem] leading-snug text-ink">We have it.</p>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
                  {compactQty(pieces)} pieces across {chosen.length}{" "}
                  {chosen.length === 1 ? "design" : "designs"}
                  {done && done !== "PREVIEW" && (
                    <>
                      {" "}
                      — reference <span className="text-ink">{done}</span>
                    </>
                  )}
                  . We come back with the rate, the lead time and the freight.
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
        ) : step === "pick" ? (
          <>
            <div className="shrink-0 px-5 pt-5 sm:px-7">
              <p className="text-[0.9rem] leading-relaxed text-ink-soft">
                Choose the candles and say how many of each. Mixed orders are welcome — most
                corporate and wedding orders are.
              </p>
              <label className="mt-4 relative block">
                <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the range"
                  aria-label="Search the range"
                  className={`${FIELD} pl-11`}
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {catalogue === null ? (
                <p className="flex items-center gap-2 py-10 text-center text-[0.9rem] text-ink-faint">
                  <Loader2 size={15} className="animate-spin" />
                  Loading the range…
                </p>
              ) : shown.length === 0 ? (
                <p className="py-10 text-center text-[0.9rem] text-ink-faint">
                  Nothing matches “{query}”.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {shown.map((c) => {
                    const qty = picks[c.slug] ?? 0;
                    const step = Math.max(1, c.minQty);
                    return (
                      <li key={c.slug}>
                        <div
                          className={`overflow-hidden rounded-[14px] border transition-colors ${
                            qty > 0 ? "border-ember bg-ember-wash/40" : "border-line bg-surface"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(c.slug, qty > 0 ? 0 : step, step)}
                            className="block w-full text-left"
                          >
                            <span className="relative block aspect-4/5 bg-canvas-deep">
                              {c.image && (
                                <Image
                                  src={c.image}
                                  alt=""
                                  fill
                                  sizes="(max-width: 640px) 45vw, 200px"
                                  className="object-cover"
                                />
                              )}
                              {qty > 0 && (
                                <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-ember text-canvas">
                                  <Check size={13} />
                                </span>
                              )}
                            </span>
                            <span className="block px-3 pt-2.5">
                              <span className="block truncate text-[0.82rem] leading-snug text-ink">
                                {c.name}
                              </span>
                              <span className="mt-0.5 block text-[0.75rem] text-ink-faint tabular-nums">
                                {money(c.basePrice)}
                                {step > 1 && ` · sets of ${step}`}
                              </span>
                            </span>
                          </button>

                          {qty > 0 && (
                            <div className="flex items-center justify-between gap-1 px-2 pt-2 pb-2.5">
                              <button
                                type="button"
                                onClick={() => setQty(c.slug, qty - step, step)}
                                aria-label={`Fewer ${c.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-canvas text-ink"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={step}
                                step={step}
                                value={qty}
                                onChange={(e) => setQty(c.slug, Math.floor(Number(e.target.value) || 0), step)}
                                aria-label={`How many ${c.name}`}
                                className="h-8 w-full min-w-0 [appearance:textfield] rounded-[8px] border border-line bg-canvas text-center text-[0.85rem] text-ink tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => setQty(c.slug, qty + step, step)}
                                aria-label={`More ${c.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-canvas text-ink"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="shrink-0 border-t border-line bg-canvas px-5 py-4 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.85rem] text-ink-soft tabular-nums">
                  {pieces > 0 ? (
                    <>
                      {compactQty(pieces)} pcs
                      <span className="text-ink-faint">
                        {" "}
                        · {chosen.length} {chosen.length === 1 ? "design" : "designs"} ·{" "}
                        {money(value)}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-faint">Nothing picked yet</span>
                  )}
                </p>
                <button
                  type="button"
                  disabled={pieces === 0}
                  onClick={() => {
                    setStep("details");
                    track("bulk_enquiry_picked", { designs: chosen.length, qty: pieces });
                  }}
                  className="shrink-0 rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
              <p className="mt-2 text-[0.72rem] text-ink-faint">
                Indicative only — your quoted rate comes back with the freight and lead time.
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <ul className="divide-y divide-line-soft rounded-[14px] border border-line bg-surface px-4">
              {chosen.map((c) => (
                <li key={c.slug} className="flex items-center gap-3 py-2.5">
                  {c.image && (
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[8px] bg-canvas-deep">
                      <Image src={c.image} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[0.85rem] text-ink">{c.name}</span>
                  <span className="shrink-0 text-[0.82rem] text-ink-soft tabular-nums">
                    {compactQty(picks[c.slug] ?? 0)} pcs
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[0.8rem] text-ink-faint tabular-nums">
              {compactQty(pieces)} pieces · {money(value)} indicative
            </p>

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

              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-[0.82rem] font-medium text-ink">How should we reach you?</span>
                  <span className={`text-[0.75rem] ${reachable ? "text-[#3d5730]" : "text-ink-faint"}`}>
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
                  When do you need it? <span className="font-normal text-ink-faint">— optional</span>
                </span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Date, branding, custom colours…"
                  className={`mt-2.5 ${FIELD}`}
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
              {busy ? "Sending…" : "Send my enquiry"}
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
