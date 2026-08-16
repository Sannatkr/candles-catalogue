"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export function FragrancePicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-[12px] border bg-surface px-4 py-3 text-left transition-colors ${
          open ? "border-ink" : "border-line hover:border-ink/40"
        }`}
      >
        <span className="min-w-0">
          <span className="block truncate text-[0.95rem] text-ink">{value || "Choose a fragrance"}</span>
          <span className="mt-0.5 block text-[0.72rem] text-ink-faint">
            {options.length} to choose from
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-ink-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[14px] border border-line bg-canvas shadow-[0_18px_44px_-12px_rgba(30,25,19,0.28)]">
          <div className="flex items-center gap-2 border-b border-line-soft px-3.5 py-2.5">
            <Search size={15} className="shrink-0 text-ink-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fragrance…"
              className="w-full bg-transparent text-[0.9rem] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>

          <ul role="listbox" className="max-h-[232px] overflow-y-auto p-1.5">
            {matches.length === 0 && (
              <li className="px-3 py-6 text-center text-[0.85rem] text-ink-faint">
                Nothing by that name. Ask us — we blend to order.
              </li>
            )}
            {matches.map((option) => {
              const selected = option === value;
              return (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-[9px] px-3 py-2.5 text-left text-[0.9rem] transition-colors ${
                      selected ? "bg-ink text-canvas" : "text-ink hover:bg-canvas-deep"
                    }`}
                  >
                    {option}
                    {selected && <Check size={15} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
