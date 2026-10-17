"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnchoredPopover } from "@/components/admin/popover";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** yyyy-mm-dd from local calendar parts — never through UTC, which shifts the day. */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const todayIso = () => isoDate(new Date());

const parse = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** "18 Oct 2026", or the placeholder. */
export function prettyDate(iso: string, fallback = "Pick a date") {
  const d = parse(iso);
  return d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : fallback;
}

/**
 * A calendar that drops down from a button, in the admin's own colours.
 *
 * It carries its value in a hidden input, so a plain <form action> reads it
 * like any other field. Today is ringed; the chosen day is filled; days past
 * `max` or before `min` are faded and cannot be pressed. "Today" and "Clear"
 * sit in the footer because they are the two things reached for most.
 */
export function DatePicker({
  value,
  onChange,
  name,
  min,
  max,
  placeholder = "Pick a date",
  clearable = true,
  size = "md",
  className = "",
}: {
  value: string;
  onChange: (iso: string) => void;
  name?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  clearable?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const selected = parse(value);
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const openAt = () => {
    const base = selected ?? today;
    setView({ y: base.getFullYear(), m: base.getMonth() });
    setOpen(true);
  };

  const allowed = (d: Date) => {
    const iso = isoDate(d);
    if (min && iso < min) return false;
    if (max && iso > max) return false;
    return true;
  };

  const step = (by: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + by, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  // The grid: leading blanks, then every day of the month.
  const first = new Date(view.y, view.m, 1);
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: count }, (_, i) => new Date(view.y, view.m, i + 1)),
  ];

  const pick = (d: Date) => {
    onChange(isoDate(d));
    setOpen(false);
  };

  const pad = size === "sm" ? "px-3.5 py-2 text-[0.825rem]" : "px-3.5 py-2.5 text-[0.9rem]";

  return (
    <>
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <button
        ref={anchor}
        type="button"
        onClick={() => (open ? setOpen(false) : openAt())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex w-full items-center gap-2.5 rounded-[10px] border bg-surface text-left transition-colors ${pad} ${
          open ? "border-ink/50" : "border-line hover:border-ink/35"
        } ${className}`}
      >
        <CalendarDays size={15} className="shrink-0 text-ink-faint" />
        <span className={`flex-1 truncate tabular-nums ${selected ? "text-ink" : "text-ink-faint"}`}>
          {prettyDate(value, placeholder)}
        </span>
        {clearable && selected && (
          <span
            role="button"
            aria-label="Clear date"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }
            }}
            className="-mr-1 rounded-full p-1 text-ink-faint hover:bg-canvas-deep hover:text-ink"
          >
            <X size={13} />
          </span>
        )}
      </button>

      <AnchoredPopover anchorRef={anchor} open={open} onClose={() => setOpen(false)} width={296}>
        <div role="dialog" aria-label="Choose a date" className="p-3">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous month"
              className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="font-display text-[0.98rem] text-ink">
              {MONTHS[view.m]} <span className="text-ink-soft">{view.y}</span>
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next month"
              className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 text-center">
            {DAYS.map((d, i) => (
              <span key={i} className="py-1 text-[0.66rem] font-medium tracking-[0.1em] text-ink-faint">
                {d}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`b${i}`} />;
              const iso = isoDate(d);
              const isToday = iso === isoDate(today);
              const isSel = selected ? iso === isoDate(selected) : false;
              const ok = allowed(d);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!ok}
                  onClick={() => pick(d)}
                  aria-label={prettyDate(iso)}
                  aria-pressed={isSel}
                  className={`mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-[0.85rem] tabular-nums transition-colors ${
                    isSel
                      ? "bg-ink text-canvas"
                      : isToday
                        ? "text-ember ring-1 ring-ember/60 hover:bg-ember-wash"
                        : "text-ink hover:bg-canvas-deep"
                  } disabled:cursor-not-allowed disabled:text-ink-faint/60 disabled:ring-0 disabled:hover:bg-transparent`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2.5">
            <button
              type="button"
              onClick={() => allowed(today) && pick(today)}
              disabled={!allowed(today)}
              className="rounded-full border border-line px-3 py-1.5 text-[0.78rem] text-ink transition-colors hover:border-ink disabled:opacity-40"
            >
              Today
            </button>
            {clearable ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-[0.78rem] text-ink-soft transition-colors hover:text-ink"
              >
                Clear
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </AnchoredPopover>
    </>
  );
}
