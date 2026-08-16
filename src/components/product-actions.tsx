"use client";

import { useState } from "react";
import { MessagesSquare, ShoppingBag } from "lucide-react";
import { BookingDialog } from "@/components/booking-dialog";
import { instagramDmLink } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductActions({
  product,
  fragrances,
  instagramHandle,
  businessName,
}: {
  product: Product;
  fragrances: string[];
  instagramHandle: string;
  businessName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[0.95rem] text-canvas transition-colors hover:bg-ember"
        >
          <ShoppingBag size={17} />
          Book your order
        </button>

        <a
          href={instagramDmLink(instagramHandle)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line px-7 py-4 text-[0.95rem] text-ink transition-colors hover:border-ink"
        >
          <MessagesSquare size={17} />
          Ask about bulk pricing
        </a>
      </div>

      <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-faint">
        Booking takes a minute and costs nothing. Buying in volume, or want something changed? Message us —
        the listed rates are a starting point.
      </p>

      {open && (
        <BookingDialog
          product={product}
          fragrances={fragrances}
          instagramHandle={instagramHandle}
          businessName={businessName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
