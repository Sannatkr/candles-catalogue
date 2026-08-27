"use client";

import { useState, useTransition } from "react";
import { Check, Truck } from "lucide-react";
import { createBookingShipment } from "@/lib/admin/actions";
import type { AdminBooking } from "@/lib/admin/queries";

/**
 * Creates a RapidShyp shipment for an enquiry, by hand. Two-step (Create →
 * Confirm) because it hits the live courier — one careless click should not book
 * a real pickup.
 */
export function BookingShipButton({ booking }: { booking: AdminBooking }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (booking.rapidshypOrderId) {
    return (
      <span
        title={booking.rapidshypOrderId}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe0c8] bg-[#eef3ea] px-3 py-1.5 text-[0.78rem] whitespace-nowrap text-[#3d5730]"
      >
        <Check size={13} />
        Shipment made
      </span>
    );
  }

  function go() {
    setConfirming(false);
    start(async () => {
      const res = await createBookingShipment(booking.id);
      setMsg({ ok: res.ok, text: res.message });
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      {confirming ? (
        <>
          <button
            type="button"
            onClick={go}
            disabled={pending}
            className="rounded-full bg-ink px-3 py-1.5 text-[0.78rem] whitespace-nowrap text-canvas disabled:opacity-50"
          >
            {pending ? "Creating…" : "Confirm shipment"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-[0.78rem] text-ink-soft hover:text-ink"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setConfirming(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.8rem] whitespace-nowrap text-ink transition-colors hover:border-ink"
        >
          <Truck size={13} />
          Create shipment
        </button>
      )}
      {msg && (
        <span className={`max-w-[200px] truncate text-[0.72rem] ${msg.ok ? "text-[#3d5730]" : "text-ember-deep"}`}>
          {msg.text}
        </span>
      )}
    </span>
  );
}
