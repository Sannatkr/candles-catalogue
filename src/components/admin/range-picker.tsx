"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { DatePicker, todayIso } from "@/components/admin/date-picker";
import { signalNavigate } from "@/components/admin/top-progress";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

/**
 * The period the revenue screen reports on: quick presets, or any two dates
 * from the calendar. A press shows a spinner on the pill until the new
 * figures arrive, so nothing feels ignored.
 */
export function RangePicker({ range, from, to }: { range: string; from: string; to: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  function go(next: Record<string, string | null>, key: string) {
    const query = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => (v === null ? query.delete(k) : query.set(k, v)));
    setTarget(key);
    signalNavigate();
    start(() => router.push(`/admin/revenue?${query.toString()}`));
  }

  const busy = (key: string) => pending && target === key;

  return (
    <div className="flex flex-col gap-4 border-y border-line py-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => go({ range: p.key, from: null, to: null }, p.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[0.85rem] transition-colors ${
              range === p.key
                ? "border-ink bg-ink text-canvas"
                : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
            }`}
          >
            {busy(p.key) && <Loader2 size={13} className="animate-spin" />}
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-[158px]">
          <DatePicker value={customFrom} onChange={setCustomFrom} max={customTo || todayIso()} size="sm" clearable={false} placeholder="From" />
        </div>
        <ArrowRight size={14} className="text-ink-faint" />
        <div className="w-[158px]">
          <DatePicker value={customTo} onChange={setCustomTo} min={customFrom} max={todayIso()} size="sm" clearable={false} placeholder="To" />
        </div>
        <button
          type="button"
          disabled={!customFrom || !customTo}
          onClick={() => go({ range: "custom", from: customFrom, to: customTo }, "custom")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.825rem] transition-colors disabled:opacity-40 ${
            range === "custom" ? "bg-ink text-canvas" : "border border-line text-ink hover:border-ink"
          }`}
        >
          {busy("custom") && <Loader2 size={13} className="animate-spin" />}
          Apply
        </button>
      </div>
    </div>
  );
}
