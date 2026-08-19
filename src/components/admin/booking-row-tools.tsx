"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { BookingMessage } from "@/components/admin/booking-message";
import { BookingRowActions } from "@/components/admin/booking-row-actions";
import type { AdminBooking } from "@/lib/admin/queries";
import type { BookingStatus } from "@/lib/admin/booking-status";

export function BookingRowTools({
  booking,
  businessName,
  paymentsReady,
}: {
  booking: AdminBooking;
  businessName: string;
  paymentsReady: boolean;
}) {
  const [open, setOpen] = useState(false);

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
    </div>
  );
}
