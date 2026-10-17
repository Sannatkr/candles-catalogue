"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, PenLine, Plus, Search } from "lucide-react";
import { AnchoredPopover } from "@/components/admin/popover";
import { money } from "@/lib/format";
import { singlePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/** What a line points at: a catalogue candle by slug, or a custom name. */
export type CandleChoice = { slug: string; name: string; custom: boolean };

/**
 * Picks a candle by sight. A photograph, the name and the price for every
 * design, a search box that filters as you type, and at the top the option to
 * type in something that is not in the catalogue at all — a stall sells what
 * it sells.
 *
 * As a field (`mode="field"`) the trigger shows the chosen candle; as a button
 * (`mode="add"`) it just adds a line, which is what the editor wants.
 */
export function CandlePicker({
  products,
  value,
  onChange,
  mode = "field",
  addLabel = "Add from catalogue",
}: {
  products: Product[];
  value?: CandleChoice;
  onChange: (choice: CandleChoice) => void;
  mode?: "field" | "add";
  addLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchor = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const chosen = value && !value.custom ? bySlug.get(value.slug) : undefined;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.includes(q)) ||
        p.collectionSlug.replace(/-/g, " ").includes(q),
    );
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const toggle = () => {
    if (!open) setQuery("");
    setOpen((v) => !v);
  };

  const choose = (choice: CandleChoice) => {
    onChange(choice);
    setOpen(false);
  };

  const trigger =
    mode === "add" ? (
      <button
        ref={anchor}
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[0.85rem] text-ink transition-colors hover:border-ink"
      >
        <Plus size={15} />
        {addLabel}
      </button>
    ) : (
      <button
        ref={anchor}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-[10px] border bg-surface px-2.5 py-2 text-left transition-colors ${
          open ? "border-ink/50" : "border-line hover:border-ink/35"
        }`}
      >
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[8px] bg-canvas-deep">
          {chosen?.images[0] ? (
            <Image src={chosen.images[0]} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <PenLine size={15} className="absolute inset-0 m-auto text-ink-faint" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9rem] text-ink">
            {chosen?.name ?? (value?.custom ? value.name || "Custom candle" : "Choose a candle")}
          </span>
          <span className="block truncate text-[0.74rem] text-ink-faint">
            {chosen ? `${money(singlePrice(chosen))} listed` : value?.custom ? "Not in the catalogue" : "Tap to search"}
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    );

  return (
    <>
      {trigger}

      <AnchoredPopover
        anchorRef={anchor}
        open={open}
        onClose={() => setOpen(false)}
        matchWidth={mode === "field"}
        width={360}
      >
        <div className="flex items-center gap-2 border-b border-line-soft px-3 py-2.5">
          <Search size={15} className="shrink-0 text-ink-faint" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (shown[0]) choose({ slug: shown[0].slug, name: shown[0].name, custom: false });
              }
            }}
            placeholder="Search by name…"
            className="w-full bg-transparent text-[0.9rem] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <span className="text-[0.7rem] text-ink-faint tabular-nums">{shown.length}</span>
        </div>

        <ul role="listbox" className="max-h-[340px] overflow-y-auto overscroll-contain py-1">
          <li>
            <button
              type="button"
              onClick={() => choose({ slug: "", name: value?.custom ? value.name : "", custom: true })}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-canvas-deep"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-dashed border-line text-ink-faint">
                <PenLine size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9rem] text-ink">Custom candle</span>
                <span className="block text-[0.74rem] text-ink-faint">Type any name — not in the catalogue</span>
              </span>
            </button>
          </li>

          {shown.map((p) => {
            const active = !value?.custom && value?.slug === p.slug;
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose({ slug: p.slug, name: p.name, custom: false })}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-canvas-deep ${
                    active ? "bg-ember-wash/60" : ""
                  }`}
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[8px] bg-canvas-deep">
                    {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[0.9rem] ${p.inStock ? "text-ink" : "text-ink-faint"}`}>
                      {p.name}
                    </span>
                    <span className="block truncate text-[0.72rem] text-ink-faint capitalize">
                      {p.collectionSlug.replace(/-/g, " ")}
                      {!p.inStock && " · out of stock"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.85rem] text-ink tabular-nums">{money(singlePrice(p))}</span>
                  {active && <Check size={15} className="shrink-0 text-ember" />}
                </button>
              </li>
            );
          })}

          {shown.length === 0 && (
            <li className="px-3 py-6 text-center text-[0.85rem] text-ink-faint">
              Nothing called “{query}”. Add it as a custom candle.
            </li>
          )}
        </ul>
      </AnchoredPopover>
    </>
  );
}
