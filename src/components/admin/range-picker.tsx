"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

export function RangePicker({ range, from, to }: { range: string; from: string; to: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  function go(next: Record<string, string | null>) {
    const query = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => (v === null ? query.delete(k) : query.set(k, v)));
    router.push(`/admin/revenue?${query.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => go({ range: p.key, from: null, to: null })}
            className={`rounded-full border px-4 py-2 text-[0.85rem] transition-colors ${
              range === p.key
                ? "border-ink bg-ink text-canvas"
                : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={customFrom}
          max={customTo}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="rounded-full border border-line bg-surface px-3.5 py-2 text-[0.825rem] text-ink focus:border-ink/50 focus:outline-none"
        />
        <span className="text-[0.8rem] text-ink-faint">to</span>
        <input
          type="date"
          value={customTo}
          min={customFrom}
          onChange={(e) => setCustomTo(e.target.value)}
          className="rounded-full border border-line bg-surface px-3.5 py-2 text-[0.825rem] text-ink focus:border-ink/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => go({ range: "custom", from: customFrom, to: customTo })}
          className={`rounded-full px-4 py-2 text-[0.825rem] transition-colors ${
            range === "custom"
              ? "bg-ink text-canvas"
              : "border border-line text-ink hover:border-ink"
          }`}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
