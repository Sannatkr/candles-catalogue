"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, Gift, Search, X } from "lucide-react";
import { money } from "@/lib/format";
import { singlePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/**
 * The gift chooser. Deliberately its own screen rather than a trip to the
 * catalogue: only a handful of candles may be given away, and letting a buyer
 * loose in the full range means most of what they click cannot be had free —
 * which reads as a bait, not a gift.
 */
export function GiftPicker({
  products,
  chosen,
  onPick,
  onClose,
}: {
  products: Product[];
  chosen: string | null;
  onPick: (slug: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  // Escape closes, and the page behind must not scroll under the sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.tagline, p.fragrance, ...p.keywords].join(" ").toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your free candle"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[22px] bg-canvas sm:rounded-[22px]"
      >
        <div className="flex items-start gap-4 border-b border-line px-5 py-5 sm:px-7">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ember-wash text-ember-deep">
            <Gift size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[1.25rem] text-ink">Pick your free candle</h2>
            <p className="mt-0.5 text-[0.85rem] text-ink-soft">
              On us — it will not be charged. You can still add more candles after this.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {products.length > 6 && (
          <div className="border-b border-line px-5 py-3 sm:px-7">
            <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5">
              <Search size={15} className="shrink-0 text-ink-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candles…"
                className="w-full bg-transparent text-[0.9rem] text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {results.length === 0 ? (
            <p className="py-10 text-center text-[0.9rem] text-ink-soft">
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {results.map((product) => {
                const isChosen = product.slug === chosen;
                return (
                  <li key={product.slug}>
                    <button
                      type="button"
                      onClick={() => onPick(product.slug)}
                      className={`group w-full overflow-hidden rounded-[14px] border text-left transition-colors ${
                        isChosen ? "border-ember bg-ember-wash" : "border-line bg-surface hover:border-ink"
                      }`}
                    >
                      <span className="relative block aspect-4/5 overflow-hidden bg-canvas-deep">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 45vw, 220px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                        {isChosen && (
                          <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ember text-canvas">
                            <Check size={15} />
                          </span>
                        )}
                      </span>
                      <span className="block px-3 py-2.5">
                        <span className="block truncate text-[0.85rem] leading-snug text-ink">
                          {product.name}
                        </span>
                        <span className="mt-1 block text-[0.78rem] tabular-nums">
                          <s className="text-ink-faint">{money(singlePrice(product))}</s>{" "}
                          <b className="font-semibold text-[#3d5730]">FREE</b>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
