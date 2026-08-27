"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BOOKING_STATUSES, STATUS_LABEL } from "@/lib/admin/booking-status";

type Chip = { value: string; label: string; count: number };

export function BookingFilters({
  source,
  status,
  sourceCounts,
  statusCounts,
}: {
  source: string;
  status: string;
  sourceCounts: Record<string, number>;
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(key: string, value: string) {
    const query = new URLSearchParams(params.toString());
    if (value === "all") query.delete(key);
    else query.set(key, value);
    query.delete("added");
    const qs = query.toString();
    router.push(qs ? `/admin/bookings?${qs}` : "/admin/bookings");
  }

  const sourceChips: Chip[] = [
    { value: "all", label: "All orders", count: sourceCounts.all ?? 0 },
    { value: "website", label: "From the website", count: sourceCounts.website ?? 0 },
    { value: "manual", label: "Added by you", count: sourceCounts.manual ?? 0 },
  ];

  const statusChips: Chip[] = [
    { value: "all", label: "Any status", count: statusCounts.all ?? 0 },
    ...BOOKING_STATUSES.map((s) => ({
      value: s,
      label: STATUS_LABEL[s],
      count: statusCounts[s] ?? 0,
    })).filter((c) => c.count > 0),
  ];

  const row = (chips: Chip[], active: string, key: string, legend: string) => (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[0.7rem] tracking-[0.12em] text-ink-faint uppercase">{legend}</span>
      {chips.map((chip) => {
        const isActive = active === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => go(key, chip.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.825rem] transition-colors ${
              isActive
                ? "border-ink bg-ink text-canvas"
                : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
            }`}
          >
            {chip.label}
            <span className={isActive ? "text-canvas/60" : "text-ink-faint"}>{chip.count}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3 rounded-[14px] border border-line bg-canvas px-4 py-4">
      {row(sourceChips, source, "from", "From")}
      {statusChips.length > 1 && row(statusChips, status, "status", "Status")}
    </div>
  );
}
