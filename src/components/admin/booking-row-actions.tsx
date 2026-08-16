"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { deleteBooking, setBookingStatus } from "@/lib/admin/actions";
import { BOOKING_STATUSES, STATUS_LABEL, type BookingStatus } from "@/lib/admin/booking-status";

const MENU_WIDTH = 216;

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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // The table scrolls sideways, which would clip an absolutely positioned menu.
  // Rendering it in a portal at fixed coordinates keeps it above everything.
  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 12);
      const below = rect.bottom + 8;
      const menuHeight = menuRef.current?.offsetHeight ?? 260;
      const flip = below + menuHeight > window.innerHeight - 12;
      setCoords({ top: flip ? Math.max(12, rect.top - menuHeight - 8) : below, left: Math.max(12, left) });
    };

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setConfirming(false);
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu = open && coords && (
    <div
      ref={menuRef}
      style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
      className="fixed z-[200] overflow-hidden rounded-[12px] border border-line bg-canvas shadow-[0_20px_48px_-14px_rgba(30,25,19,0.34)]"
    >
      <p className="border-b border-line-soft px-3.5 py-2 text-[0.68rem] tracking-[0.12em] text-ink-faint uppercase">
        Move to
      </p>

      {BOOKING_STATUSES.filter((s) => s !== status).map((next) => (
        <form key={next} action={setBookingStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={next} />
          <button
            type="submit"
            className="flex w-full items-baseline gap-1.5 px-3.5 py-2.5 text-left text-[0.875rem] text-ink transition-colors hover:bg-canvas-deep"
          >
            {STATUS_LABEL[next]}
            {next === "paid" && <span className="text-[0.7rem] text-ink-faint">counts as revenue</span>}
          </button>
        </form>
      ))}

      <div className="border-t border-line-soft">
        {confirming ? (
          <form action={deleteBooking} className="flex items-center gap-2 px-3.5 py-2.5">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="rounded-full bg-ember-deep px-3 py-1.5 text-[0.78rem] text-canvas"
            >
              Delete for good
            </button>
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
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for ${label}`}
        aria-expanded={open}
        className={`rounded-full border p-2 transition-colors ${
          open ? "border-ink text-ink" : "border-line text-ink-soft hover:border-ink hover:text-ink"
        }`}
      >
        <MoreHorizontal size={16} />
      </button>

      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
