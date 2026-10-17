"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FileText, Loader2, Pencil } from "lucide-react";
import { BookingEdit } from "@/components/admin/booking-edit";
import { BookingMessage } from "@/components/admin/booking-message";
import { BookingRowActions, type RowState } from "@/components/admin/booking-row-actions";
import { ShipButton } from "@/components/admin/ship-button";
import { signalNavigate } from "@/components/admin/top-progress";
import { cloneBooking, createBookingShipment } from "@/lib/admin/actions";
import type { AdminBooking } from "@/lib/admin/queries";
import type { BookingStatus } from "@/lib/admin/booking-status";
import type { Product } from "@/lib/types";

export function BookingRowTools({
  booking,
  businessName,
  paymentsReady,
  products,
  autoEdit = false,
  onState,
}: {
  booking: AdminBooking;
  businessName: string;
  paymentsReady: boolean;
  products: Product[];
  /** Open the editor the moment the row appears — used for a fresh copy. */
  autoEdit?: boolean;
  onState: (state: RowState) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(autoEdit);
  const [cloning, startClone] = useTransition();
  const [cloneError, setCloneError] = useState("");

  // The ?edit=… that opened this editor has done its job; drop it so a reload
  // does not open it again.
  useEffect(() => {
    if (autoEdit) window.history.replaceState(null, "", "/admin/bookings");
  }, [autoEdit]);

  function clone() {
    setCloneError("");
    onState("busy");
    startClone(async () => {
      const result = await cloneBooking(booking.id);
      onState(null);
      if (!result.ok || !result.id) {
        setCloneError(result.message || "Could not copy.");
        return;
      }
      signalNavigate();
      router.push(`/admin/bookings?edit=${result.id}`);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {cloneError && <span className="text-[0.75rem] text-ember-deep">{cloneError}</span>}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Full details for ${booking.productName}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.8rem] whitespace-nowrap text-ink transition-colors hover:border-ink"
      >
        <FileText size={14} />
        Details
      </button>

      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${booking.productName}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.8rem] whitespace-nowrap text-ink transition-colors hover:border-ink"
      >
        <Pencil size={13} />
        Edit
      </button>

      <ShipButton
        shipmentId={booking.rapidshypOrderId}
        ship={() => createBookingShipment(booking.id)}
      />

      {cloning ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.78rem] whitespace-nowrap text-ink-soft">
          <Loader2 size={13} className="animate-spin" />
          Copying…
        </span>
      ) : (
        <BookingRowActions
          id={booking.id}
          status={booking.status as BookingStatus}
          label={booking.productName}
          onState={onState}
          onClone={clone}
        />
      )}

      {open && (
        <BookingMessage
          booking={booking}
          businessName={businessName}
          paymentsReady={paymentsReady}
          onClose={() => setOpen(false)}
        />
      )}

      {editing && (
        <BookingEdit
          booking={booking}
          products={products}
          fresh={autoEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
