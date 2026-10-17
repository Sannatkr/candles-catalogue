"use client";

import Image from "next/image";
import { useState } from "react";
import type { RowState } from "@/components/admin/booking-row-actions";
import { BookingRowTools } from "@/components/admin/booking-row-tools";
import { itemsLabel, itemsOf } from "@/lib/admin/booking-items";
import type { AdminBooking } from "@/lib/admin/queries";
import { SOURCE_LABEL, STATUS_LABEL, STATUS_STYLE, type BookingStatus } from "@/lib/admin/booking-status";
import { compactQty, money } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * One enquiry in the table. A client row so it can dim itself while a change
 * saves and slide away when deleted, without waiting for the page to come
 * back from the server.
 */
export function BookingRow({
  booking: b,
  businessName,
  paymentsReady,
  products,
  autoEdit,
}: {
  booking: AdminBooking;
  businessName: string;
  paymentsReady: boolean;
  products: Product[];
  autoEdit: boolean;
}) {
  const [rowState, setRowState] = useState<RowState>(null);
  const status = b.status as BookingStatus;
  const items = itemsOf(b);
  const first = items[0];

  return (
    <tr
      className={`group border-b border-line-soft align-middle transition-colors last:border-0 hover:bg-canvas-deep/25 ${
        rowState === "busy" ? "row-busy" : rowState === "leaving" ? "row-leave" : ""
      } ${autoEdit ? "bg-ember-wash/40" : ""}`}
    >
      <td className="sticky left-0 z-10 border-r border-line-soft bg-canvas px-4 py-3.5 transition-colors group-hover:bg-[#f7f2e8]">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-canvas-deep">
            {(first?.image ?? b.productImage) && (
              <Image src={first?.image ?? b.productImage!} alt="" fill sizes="44px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[0.9rem] text-ink" title={items.map((i) => i.name).join(", ")}>
              {itemsLabel(items)}
            </p>
            <p className="text-[0.75rem] text-ink-faint">
              {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {b.fragrance && ` · ${b.fragrance}`}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 text-right text-[0.9rem] text-ink tabular-nums">{compactQty(b.quantity)}</td>
      <td className="px-4 py-3.5 text-right text-[0.9rem] whitespace-nowrap text-ink-soft tabular-nums">
        {items.length > 1 ? "Mixed" : money(b.unitPrice)}
      </td>
      <td className="px-4 py-3.5 text-right text-[0.9rem] font-medium whitespace-nowrap text-ink tabular-nums">
        {money(b.totalPrice)}
      </td>

      <td className="max-w-[170px] px-4 py-3.5">
        <p className="truncate text-[0.875rem] text-ink">
          {b.buyerContact ? `@${b.buyerContact.replace(/^@/, "")}` : b.buyerName || "—"}
        </p>
        <p className="truncate text-[0.78rem] text-ink-faint">
          {[b.buyerContact ? b.buyerName : null, b.phone].filter(Boolean).join(" · ") || "—"}
        </p>
      </td>

      <td className="max-w-[150px] px-4 py-3.5">
        <p className="text-[0.875rem] text-ink tabular-nums">{b.pincode || "—"}</p>
        {b.state && (
          <p className="truncate text-[0.78rem] text-ink-faint" title={b.state}>
            {b.state}
          </p>
        )}
      </td>

      <td className="px-4 py-3.5 text-[0.8rem] whitespace-nowrap text-ink-soft">{SOURCE_LABEL[b.source] ?? b.source}</td>

      <td className="max-w-[190px] px-4 py-3.5">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-[0.7rem] tracking-wide whitespace-nowrap uppercase ${
            STATUS_STYLE[status] ?? STATUS_STYLE.cancelled
          }`}
        >
          {STATUS_LABEL[status] ?? b.status}
        </span>
        {b.note && (
          <p className="mt-1.5 truncate text-[0.75rem] text-ink-faint" title={b.note}>
            “{b.note}”
          </p>
        )}
      </td>

      <td className="px-4 py-3.5 text-right">
        <BookingRowTools
          booking={b}
          businessName={businessName}
          paymentsReady={paymentsReady}
          products={products}
          autoEdit={autoEdit}
          onState={setRowState}
        />
      </td>
    </tr>
  );
}
