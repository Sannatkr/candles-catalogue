"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { deleteBooking, setBookingStatus } from "@/lib/admin/actions";
import { BOOKING_STATUSES, STATUS_LABEL, type BookingStatus } from "@/lib/admin/booking-status";

export function BookingRowActions({
  id,
  status,
  label,
}: {
  id: string;
  status: BookingStatus;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for ${label}`}
        aria-expanded={open}
        className="rounded-full border border-line p-2 text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-52 overflow-hidden rounded-[12px] border border-line bg-canvas shadow-[0_18px_44px_-12px_rgba(30,25,19,0.28)]">
          <p className="border-b border-line-soft px-3.5 py-2 text-[0.7rem] tracking-[0.12em] text-ink-faint uppercase">
            Move to
          </p>

          {BOOKING_STATUSES.filter((s) => s !== status).map((next) => (
            <form key={next} action={setBookingStatus}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={next} />
              <button
                type="submit"
                className="w-full px-3.5 py-2.5 text-left text-[0.875rem] text-ink transition-colors hover:bg-canvas-deep"
              >
                {STATUS_LABEL[next]}
                {next === "paid" && (
                  <span className="ml-1.5 text-[0.72rem] text-ink-faint">counts as revenue</span>
                )}
              </button>
            </form>
          ))}

          <div className="border-t border-line-soft">
            {confirming ? (
              <form action={deleteBooking} className="flex items-center gap-2 px-3.5 py-2.5">
                <button
                  type="submit"
                  className="rounded-full bg-ember-deep px-3 py-1.5 text-[0.78rem] text-canvas"
                >
                  Delete for good
                </button>
                <input type="hidden" name="id" value={id} />
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-[0.78rem] text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[0.875rem] text-ember-deep transition-colors hover:bg-ember-wash"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
