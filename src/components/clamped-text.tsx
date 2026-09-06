"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A paragraph held to two lines, with a "Read more" only when there is more
 * to read. Nobody comes to a candle page for the prose — the price, the size
 * and the scent are above this; the story is here for the few who want it.
 *
 * "Is there more?" is answered by laying the same text out twice: once clamped
 * and once in full but invisible, and comparing heights. Scroll metrics are not
 * trusted for this — the standard `line-clamp` discards the clipped lines, so
 * scrollHeight no longer says anything about them.
 */
export function ClampedText({ text, className = "" }: { text: string; className?: string }) {
  const clampedRef = useRef<HTMLParagraphElement>(null);
  const fullRef = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const clamped = clampedRef.current;
    const full = fullRef.current;
    if (!clamped || !full) return;
    const measure = () => {
      // Not laid out yet (still inside a Reveal that has not shown): try again
      // when the observer fires, rather than deciding on a zero.
      if (full.clientHeight === 0) return;
      setOverflows(full.clientHeight > clamped.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(full);
    observer.observe(clamped);
    return () => observer.disconnect();
  }, [text, open]);

  const prose = "leading-relaxed text-ink-soft";

  return (
    <div className={`relative ${className}`}>
      <p ref={clampedRef} className={`${prose} ${open ? "" : "line-clamp-2"}`}>
        {text}
      </p>
      <p ref={fullRef} aria-hidden className={`${prose} pointer-events-none invisible absolute inset-x-0 top-0`}>
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1.5 text-[0.85rem] text-ember underline-offset-2 transition-colors hover:text-ember-deep hover:underline"
        >
          {open ? "Less" : "Read more"}
        </button>
      )}
    </div>
  );
}
