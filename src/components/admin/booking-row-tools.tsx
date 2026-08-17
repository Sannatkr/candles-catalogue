"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { BookingMessage } from "@/components/admin/booking-message";
import { BookingRowActions } from "@/components/admin/booking-row-actions";
import type { AdminBooking } from "@/lib/admin/queries";
import type { BookingStatus } from "@/lib/admin/booking-status";

export function BookingRowTools({
  booking,
  businessName,
}: {
  booking: AdminBooking;
  businessName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open order for ${booking.productName}`}
        title="Order details and message"
        className="rounded-full border border-line p-2 text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        <MessageSquareText size={16} />
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
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
