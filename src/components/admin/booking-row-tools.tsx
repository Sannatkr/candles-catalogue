"use client";

import { useState } from "react";
import { FileText, Pencil } from "lucide-react";
import { BookingEdit } from "@/components/admin/booking-edit";
import { BookingMessage } from "@/components/admin/booking-message";
import { BookingRowActions } from "@/components/admin/booking-row-actions";
import { BookingShipButton } from "@/components/admin/booking-ship-button";
import type { AdminBooking } from "@/lib/admin/queries";
import type { BookingStatus } from "@/lib/admin/booking-status";
import type { Product } from "@/lib/types";

export function BookingRowTools({
  booking,
  businessName,
  paymentsReady,
  products,
}: {
  booking: AdminBooking;
  businessName: string;
  paymentsReady: boolean;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1.5">
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

      <BookingShipButton booking={booking} />

      <BookingRowActions
        id={booking.id}
        status={booking.status as BookingStatus}
        label={booking.productName}
      />

      {open && (
        <BookingMessage
          booking={booking}
          businessName={businessName}
          paymentsReady={paymentsReady}
          onClose={() => setOpen(false)}
        />
      )}

      {editing && (
        <BookingEdit booking={booking} products={products} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
