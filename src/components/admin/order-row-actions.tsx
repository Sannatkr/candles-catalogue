"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { RowState } from "@/components/admin/booking-row-actions";
import { MENU_HEADING, MENU_ITEM, RowMenu } from "@/components/admin/row-menu";
import { deleteOrder, setOrderStatus } from "@/lib/admin/actions";
import { MANAGE_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/admin/order-status";

export function OrderRowActions({
  id,
  status,
  label,
  onState,
}: {
  id: string;
  status: OrderStatus;
  label: string;
  onState: (state: RowState) => void;
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const run = (state: RowState, work: () => Promise<unknown>) => {
    onState(state);
    start(async () => {
      try {
        await work();
      } finally {
        if (state === "busy") onState(null);
      }
    });
  };

  const form = (fields: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    return fd;
  };

  return (
    <RowMenu label={label} busy={pending} onClose={() => setConfirming(false)}>
      {(close) => (
        <>
          <p className={MENU_HEADING}>Mark as</p>

          {MANAGE_STATUSES.filter((s) => s !== status).map((next) => (
            <button
              key={next}
              type="button"
              className={MENU_ITEM}
              onClick={() => {
                close();
                run("busy", () => setOrderStatus(form({ id, status: next })));
              }}
            >
              {ORDER_STATUS_LABEL[next]}
            </button>
          ))}

          <div className="border-t border-line-soft">
            {confirming ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    close();
                    run("leaving", () => deleteOrder(form({ id })));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ember-deep px-3 py-1.5 text-[0.78rem] text-canvas"
                >
                  {pending && <Loader2 size={12} className="animate-spin" />}
                  Delete for good
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-[0.78rem] text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={`${MENU_ITEM} text-ember-deep hover:bg-ember-wash`}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </RowMenu>
  );
}
