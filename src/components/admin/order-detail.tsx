"use client";

import Image from "next/image";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, Trash2, X } from "lucide-react";
import { deleteOrder, saveOrderTracking, updateOrderDetails } from "@/lib/admin/actions";
import { IDLE } from "@/lib/admin/action-state";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/admin/order-status";
import type { AdminOrder } from "@/lib/admin/queries";
import { money } from "@/lib/format";

const FIELD =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[0.9rem] text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none";
const LABEL = "text-[0.78rem] font-medium text-ink";

export function OrderDetail({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const [state, save, saving] = useActionState(updateOrderDetails, IDLE);
  const status = order.status as OrderStatus;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  function remove() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("id", order.id);
      await deleteOrder(fd);
      onClose();
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const pieces = order.items.reduce((s, i) => s + i.qty, 0);
  const placed = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.reference}`}
        className="flex max-h-[92dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[20px] bg-canvas sm:rounded-[20px]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <p className="font-display text-[1.15rem] whitespace-nowrap text-ink">{order.reference}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[0.68rem] tracking-wide uppercase ${ORDER_STATUS_STYLE[status] ?? ""}`}
            >
              {ORDER_STATUS_LABEL[status] ?? order.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-ink-soft transition-colors hover:text-ink"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Items — read-only. The lines and prices were fixed at checkout. */}
          <ul className="space-y-3">
            {order.items.map((item, i) => (
              <li key={`${item.slug}-${i}`} className="flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
                  {item.image && <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.95rem] text-ink">{item.name}</p>
                  <p className="text-[0.78rem] text-ink-faint tabular-nums">
                    {item.qty} × {money(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-[0.9rem] text-ink tabular-nums">{money(item.total)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-line-soft pt-4 text-[0.875rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">{pieces} pcs · placed</dt>
              <dd className="text-ink">{placed}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="text-ink tabular-nums">{order.shipping === 0 ? "Free" : money(order.shipping)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink">Total</dt>
              <dd className="font-medium text-ink tabular-nums">{money(order.total)}</dd>
            </div>
            {order.razorpayPaymentId && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Razorpay</dt>
                <dd className="truncate text-[0.8rem] text-ink-faint">{order.razorpayPaymentId}</dd>
              </div>
            )}
            {order.rapidshypOrderId && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">RapidShyp</dt>
                <dd className="truncate text-[0.8rem] text-ink-faint">{order.rapidshypOrderId}</dd>
              </div>
            )}
          </dl>

          {/* Editable — who it is for and where it goes. */}
          <form action={save} className="mt-7">
            <input type="hidden" name="id" value={order.id} />
            <p className="eyebrow">Buyer &amp; delivery</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={LABEL}>Full name</span>
                <input name="buyer_name" defaultValue={order.buyerName} className={`mt-1.5 ${FIELD}`} />
              </label>

              <label className="block">
                <span className={LABEL}>Phone</span>
                <input name="phone" defaultValue={order.phone} inputMode="tel" className={`mt-1.5 ${FIELD}`} />
              </label>

              <label className="block">
                <span className={LABEL}>Email</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={order.email ?? ""}
                  className={`mt-1.5 ${FIELD}`}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={LABEL}>Address</span>
                <input
                  name="address_line1"
                  defaultValue={order.addressLine1}
                  placeholder="Flat / house number, building, street"
                  className={`mt-1.5 ${FIELD}`}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="sr-only">Area or landmark</span>
                <input
                  name="address_line2"
                  defaultValue={order.addressLine2 ?? ""}
                  placeholder="Area, landmark — optional"
                  className={FIELD}
                />
              </label>

              <label className="block">
                <span className={LABEL}>Town or city</span>
                <input name="city" defaultValue={order.city ?? ""} className={`mt-1.5 ${FIELD}`} />
              </label>

              <label className="block">
                <span className={LABEL}>State</span>
                <input name="state" defaultValue={order.state ?? ""} className={`mt-1.5 ${FIELD}`} />
              </label>

              <label className="block">
                <span className={LABEL}>Pincode</span>
                <input
                  name="pincode"
                  defaultValue={order.pincode}
                  inputMode="numeric"
                  maxLength={6}
                  className={`mt-1.5 ${FIELD}`}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={LABEL}>Delivery note</span>
                <textarea
                  name="note"
                  defaultValue={order.note ?? ""}
                  rows={2}
                  className={`mt-1.5 resize-none leading-relaxed ${FIELD}`}
                />
              </label>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-[0.875rem] text-canvas transition-colors hover:bg-ember disabled:opacity-50"
              >
                {state.ok && !saving ? <Check size={15} /> : null}
                {saving ? "Saving…" : "Save changes"}
              </button>
              {state.message && (
                <span className={`text-[0.8rem] ${state.ok ? "text-[#3d5730]" : "text-ember-deep"}`}>
                  {state.message}
                </span>
              )}
            </div>
          </form>

          {/* Tracking — typed in by hand until a courier account is wired up. */}
          <form action={saveOrderTracking} className="mt-7 border-t border-line-soft pt-6">
            <input type="hidden" name="id" value={order.id} />
            <p className="eyebrow">Tracking</p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <input
                name="carrier"
                defaultValue={order.carrier ?? ""}
                placeholder="Delhivery, Bluedart…"
                className={FIELD}
              />
              <input
                name="trackingNumber"
                defaultValue={order.trackingNumber ?? ""}
                placeholder="AWB number"
                className={FIELD}
              />
              <input
                name="trackingUrl"
                defaultValue={order.trackingUrl ?? ""}
                placeholder="Tracking link — optional"
                className={`sm:col-span-2 ${FIELD}`}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full border border-line px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink"
              >
                Save tracking
              </button>
              <span className="text-[0.75rem] text-ink-faint">Saving an AWB number marks the order shipped.</span>
            </div>
          </form>

          {/* Delete — permanent, so it asks first. */}
          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={remove}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full bg-ember-deep px-5 py-2.5 text-[0.85rem] text-canvas transition-opacity disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deleting ? "Deleting…" : "Delete for good"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[0.85rem] text-ink-soft transition-colors hover:text-ink"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 text-[0.85rem] text-ink-faint transition-colors hover:text-ember-deep"
              >
                <Trash2 size={14} />
                Delete this order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}
