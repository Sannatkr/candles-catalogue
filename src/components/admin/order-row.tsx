"use client";

import Image from "next/image";
import { useState } from "react";
import { OrderDetail } from "@/components/admin/order-detail";
import { OrderRowActions } from "@/components/admin/order-row-actions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/admin/order-status";
import type { AdminOrder } from "@/lib/admin/queries";
import { compactQty, money } from "@/lib/format";

/**
 * Shared by the table header and every row so the columns line up. Kept as an
 * inline style rather than a Tailwind arbitrary class so it always applies —
 * a dynamically-built `grid-cols-[…]` string is not something the CSS build can
 * be relied on to find.
 */
export const ORDER_GRID = "minmax(0,1.8fr) 0.7fr 1.15fr 0.95fr 0.9fr 1fr 2.25rem";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderRow({ order }: { order: AdminOrder }) {
  const [open, setOpen] = useState(false);
  const status = order.status as OrderStatus;
  const pieces = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="border-b border-line-soft last:border-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        style={{ gridTemplateColumns: ORDER_GRID }}
        className="grid cursor-pointer items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-canvas-deep/25"
      >
        {/* Order — buyer, reference, a peek at the candles */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex -space-x-2.5">
            {order.items.slice(0, 3).map((item, i) => (
              <span
                key={`${item.slug}-${i}`}
                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[8px] border-2 border-canvas bg-canvas-deep"
              >
                {item.image && <Image src={item.image} alt="" fill sizes="36px" className="object-cover" />}
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[0.95rem] text-ink">{order.buyerName}</p>
            <p className="truncate text-[0.76rem] text-ink-faint">{order.reference}</p>
          </div>
        </div>

        <div className="text-right text-[0.9rem] text-ink-soft tabular-nums">{compactQty(pieces)}</div>

        <div className="min-w-0">
          <p className="truncate text-[0.875rem] text-ink">{order.city ?? "—"}</p>
          <p className="truncate text-[0.76rem] text-ink-faint tabular-nums">{order.pincode}</p>
        </div>

        <div className="text-[0.8rem] whitespace-nowrap text-ink-soft">{when(order.createdAt)}</div>

        <div className="text-right text-[0.925rem] font-medium text-ink tabular-nums">{money(order.total)}</div>

        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-[0.68rem] tracking-wide whitespace-nowrap uppercase ${ORDER_STATUS_STYLE[status] ?? ""}`}
          >
            {ORDER_STATUS_LABEL[status] ?? order.status}
          </span>
        </div>

        <div className="justify-self-end">
          <OrderRowActions id={order.id} status={status} label={order.reference} />
        </div>
      </div>

      {open && <OrderDetail order={order} onClose={() => setOpen(false)} />}
    </div>
  );
}
