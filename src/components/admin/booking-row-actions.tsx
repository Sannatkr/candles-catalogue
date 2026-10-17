"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { MENU_HEADING, MENU_ITEM, RowMenu } from "@/components/admin/row-menu";
import { deleteBooking, setBookingStatus } from "@/lib/admin/actions";
import { BOOKING_STATUSES, STATUS_LABEL, type BookingStatus } from "@/lib/admin/booking-status";

export type RowState = "busy" | "leaving" | null;

/**
 * Status moves, a copy, and delete. Every press closes the menu at once and
 * marks the row — dimmed while a change is saving, sliding out when deleted —
 * so the screen answers before the server does.
 */
export function BookingRowActions({
  id,
  status,
  label,
  onState,
  onClone,
}: {
  id: string;
  status: BookingStatus;
  label: string;
  onState: (state: RowState) => void;
  onClone: () => void;
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const run = (state: RowState, work: () => Promise<unknown>) => {
    onState(state);
    start(async () => {
      try {
        await work();
      } finally {
        if (state === "busy") onState(null);
      }
    });
  };

  const form = (fields: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    return fd;
  };

  return (
    <RowMenu label={label} busy={pending} onClose={() => setConfirming(false)}>
      {(close) => (
        <>
          <p className={MENU_HEADING}>Move to</p>

          {BOOKING_STATUSES.filter((s) => s !== status).map((next) => (
            <button
              key={next}
              type="button"
              className={`${MENU_ITEM} items-baseline gap-1.5`}
              onClick={() => {
                close();
                run("busy", () => setBookingStatus(form({ id, status: next })));
              }}
            >
              {STATUS_LABEL[next]}
              {next === "paid" && <span className="text-[0.7rem] text-ink-faint">counts as revenue</span>}
            </button>
          ))}

          <div className="border-t border-line-soft">
            <button
              type="button"
              className={MENU_ITEM}
              onClick={() => {
                close();
                onClone();
              }}
            >
              <Copy size={14} />
              Duplicate
              <span className="ml-auto text-[0.7rem] text-ink-faint">then edit</span>
            </button>
          </div>

          <div className="border-t border-line-soft">
            {confirming ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    close();
                    run("leaving", () => deleteBooking(form({ id })));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ember-deep px-3 py-1.5 text-[0.78rem] text-canvas"
                >
                  {pending && <Loader2 size={12} className="animate-spin" />}
                  Delete for good
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-[0.78rem] text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={`${MENU_ITEM} text-ember-deep hover:bg-ember-wash`}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </RowMenu>
  );
}
