"use client";

import { useState } from "react";
import { money } from "@/lib/format";

/**
 * Chart hues, validated with the dataviz palette checker against the admin
 * surface (#faf6ef): lightness band, chroma floor, CVD separation, normal-vision
 * separation and contrast all pass. Do not swap these by eye.
 */
const EMBER = "#b45f2b";
const INDIGO = "#3d6bb3";

const GRID = "var(--color-line)";

function niceCeiling(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/* ------------------------------------------------- revenue over time ------ */

export type Bucket = { label: string; sublabel: string; value: number };

export function RevenueColumns({ buckets }: { buckets: Bucket[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = niceCeiling(Math.max(...buckets.map((b) => b.value), 0));
  const peak = buckets.reduce((best, b, i) => (b.value > (buckets[best]?.value ?? 0) ? i : best), 0);
  const ticks = [1, 0.5, 0];

  if (buckets.every((b) => b.value === 0)) {
    return (
      <p className="py-16 text-center text-[0.9rem] text-ink-faint">
        Nothing marked paid in this period yet.
      </p>
    );
  }

  return (
    <div className="relative pt-6">
      <div className="flex gap-4">
        {/* Y axis */}
        <div className="relative h-[200px] w-12 shrink-0">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-[0.7rem] text-ink-faint tabular-nums"
              style={{ top: `${(1 - t) * 100}%` }}
            >
              {t === 0 ? "0" : money(Math.round(max * t)).replace(/^₹/, "₹")}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute inset-x-0 h-px"
              style={{ top: `${(1 - t) * 100}%`, background: GRID }}
            />
          ))}

          <div className="relative flex h-[200px] items-end gap-[2px]">
            {buckets.map((b, i) => {
              const height = max ? (b.value / max) * 100 : 0;
              const active = hover === i;
              return (
                <div
                  key={`${b.label}-${i}`}
                  className="group relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div
                    className="w-full max-w-[24px] rounded-t-[4px] transition-opacity"
                    style={{
                      height: `${Math.max(height, b.value > 0 ? 1.5 : 0)}%`,
                      background: EMBER,
                      opacity: hover === null || active ? 1 : 0.42,
                    }}
                  />

                  {active && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-[9px] border border-line bg-canvas px-3 py-2 shadow-[0_12px_30px_-10px_rgba(30,25,19,0.3)]">
                      <p className="text-[0.72rem] text-ink-faint">{b.sublabel}</p>
                      <p className="mt-0.5 text-[0.9rem] font-medium text-ink">{money(b.value)}</p>
                    </div>
                  )}

                  {/* One direct label, on the best day — the rest live in the tooltip. */}
                  {i === peak && b.value > 0 && hover === null && (
                    <span
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[0.7rem] text-ink-soft tabular-nums"
                      style={{ bottom: `calc(${Math.max(height, 1.5)}% + 6px)` }}
                    >
                      {money(b.value)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex gap-[2px]">
            {buckets.map((b, i) => (
              <span
                key={`${b.label}-label-${i}`}
                className="flex-1 truncate text-center text-[0.68rem] text-ink-faint"
              >
                {buckets.length > 16 && i % 2 === 1 ? "" : b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ top products ------ */

export function TopProducts({ rows }: { rows: { name: string; value: number; qty: number }[] }) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-[0.9rem] text-ink-faint">No paid orders yet.</p>;
  }

  const max = Math.max(...rows.map((r) => r.value));

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.name}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="truncate text-[0.875rem] text-ink">{row.name}</span>
            <span className="shrink-0 text-[0.875rem] text-ink tabular-nums">{money(row.value)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-[4px] bg-canvas-deep">
              <div
                className="h-full rounded-[4px]"
                style={{ width: `${max ? (row.value / max) * 100 : 0}%`, background: EMBER }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-[0.75rem] text-ink-faint tabular-nums">
              {row.qty} pcs
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------- source split ----- */

export function SourceSplit({
  website,
  manual,
  labelA = "Website",
  labelB = "Added by you",
}: {
  website: number;
  manual: number;
  labelA?: string;
  labelB?: string;
}) {
  const total = website + manual;
  if (total === 0) {
    return <p className="py-10 text-center text-[0.9rem] text-ink-faint">No paid orders yet.</p>;
  }

  const series = [
    { label: labelA, value: website, color: EMBER },
    { label: labelB, value: manual, color: INDIGO },
  ];

  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]">
        {series.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className="h-full first:rounded-l-[4px] last:rounded-r-[4px]"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4 space-y-2.5">
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-[0.875rem] text-ink-soft">{s.label}</span>
            <span className="text-[0.875rem] text-ink tabular-nums">{money(s.value)}</span>
            <span className="w-12 text-right text-[0.78rem] text-ink-faint tabular-nums">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
