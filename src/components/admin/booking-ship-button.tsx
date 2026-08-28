"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Truck, X } from "lucide-react";
import { createBookingShipment } from "@/lib/admin/actions";
import type { AdminBooking } from "@/lib/admin/queries";

/**
 * Creates a RapidShyp shipment for an enquiry, by hand. Two-step (Create →
 * Confirm) because it hits the live courier — one careless click should not book
 * a real pickup. On success it pops a confirmation dialog and refreshes the list.
 */
export function BookingShipButton({ booking }: { booking: AdminBooking }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [popup, setPopup] = useState<{ ok: boolean; text: string } | null>(null);

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
      setPopup({ ok: res.ok, text: res.message });
    });
  }

  function closePopup() {
    const wasOk = popup?.ok;
    setPopup(null);
    // A made shipment flips the row to the "Shipment made" pill on refresh.
    if (wasOk) router.refresh();
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
            setPopup(null);
            setConfirming(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.8rem] whitespace-nowrap text-ink transition-colors hover:border-ink"
        >
          <Truck size={13} />
          Create shipment
        </button>
      )}

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closePopup}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-canvas p-6 text-center shadow-xl"
          >
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                popup.ok ? "bg-[#eef3ea] text-[#3d5730]" : "bg-[#fbecea] text-ember-deep"
              }`}
            >
              {popup.ok ? <Check size={22} /> : <X size={22} />}
            </div>
            <h3 className="mt-4 text-[1.05rem] font-semibold text-ink">
              {popup.ok ? "Shipment created" : "Couldn't create shipment"}
            </h3>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-soft">{popup.text}</p>
            <button
              type="button"
              onClick={closePopup}
              className="mt-5 w-full rounded-full bg-ink px-4 py-2.5 text-[0.85rem] text-canvas"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
