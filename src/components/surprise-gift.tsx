"use client";

import { useEffect, useState } from "react";
import { Gift, Sparkles, X } from "lucide-react";

/**
 * The second freebie — the one the buyer does not choose.
 *
 * It gets a card of its own rather than a footnote under the candle, because a
 * gift mentioned in small grey type reads as terms and conditions, not as a
 * present. The tap target is the whole card: on a phone, which is where
 * essentially all of these orders are placed, a small "what's this?" link is
 * a thing you miss, not a thing you press.
 */
export function SurpriseGift({ label, threshold }: { label: string; threshold: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label} — what is it?`}
        className="mt-3 flex w-full items-center gap-3 rounded-[13px] border border-[#c9a227]/35 bg-canvas/70 px-3.5 py-3 text-left transition-colors hover:border-[#c9a227]/70 active:bg-canvas"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f7e6bd,#e5c07b)] text-[#7a5b12]">
          <Gift size={19} />
          <Sparkles size={11} className="absolute -top-0.5 -right-0.5 text-[#b8860b]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[0.92rem] leading-snug font-medium text-ink">{label}</span>
          <span className="mt-0.5 block text-[0.78rem] leading-snug text-ink-soft">
            Packed in with your order — tap to see
          </span>
        </span>

        <span className="shrink-0 rounded-full bg-[#3d5730] px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-canvas">
          FREE
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] overflow-hidden rounded-t-[22px] bg-[linear-gradient(160deg,#fdf6e6_0%,#f7ecd2_60%,#f3e2bd_100%)] sm:rounded-[22px]"
          >
            <div className="relative px-6 pt-8 pb-7 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 rounded-full p-2 text-ink-soft transition-colors hover:bg-canvas/60 hover:text-ink"
              >
                <X size={18} />
              </button>

              <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f7e6bd,#e5c07b)] text-[#7a5b12] shadow-sm">
                <Gift size={34} />
                <Sparkles size={17} className="absolute -top-1 -right-1 text-[#b8860b]" />
              </span>

              <h3 className="mt-5 font-display text-[1.4rem] leading-tight text-ink">{label}</h3>

              <p className="mx-auto mt-3 max-w-[32ch] text-[0.92rem] leading-relaxed text-ink-soft">
                Every order over {threshold} goes out with a little something extra from us — tucked
                in beside your candles.
              </p>
              <p className="mx-auto mt-2.5 max-w-[32ch] text-[0.92rem] leading-relaxed text-ink-soft">
                We choose it fresh each week, so we are not telling you what it is. You will find out
                when you open the box.
              </p>

              <p className="mt-5 text-[0.8rem] tracking-wide text-[#7a5b12]">
                Nothing to do — it is already in your order.
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 w-full rounded-full bg-ink px-6 py-3.5 text-[0.92rem] text-canvas transition-colors hover:bg-ember"
              >
                Lovely
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
