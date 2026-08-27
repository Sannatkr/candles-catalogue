"use client";

import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { Card, Field, Input, Select, Textarea } from "@/components/admin/ui";
import { itemsLabel, itemsOf } from "@/lib/admin/booking-items";
import { generateInvoicePdf, type InvoiceData, invoiceTotals } from "@/lib/admin/invoice";
import type { AdminBooking, AdminOrder } from "@/lib/admin/queries";
import { money } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function financialYear() {
  const d = new Date();
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

export function InvoiceGenerator({
  settings,
  orders,
  bookings,
}: {
  settings: SiteSettings;
  orders: AdminOrder[];
  bookings: AdminBooking[];
}) {
  const [data, setData] = useState<InvoiceData>({
    sellerName: settings.businessName,
    sellerAddress: settings.addressLines.join("\n"),
    sellerPhone: "",
    sellerEmail: settings.email,
    sellerGstin: "",
    invoiceNo: `SC/${financialYear()}/001`,
    invoiceDate: todayISO(),
    isGst: false,
    gstRate: 18,
    interState: false,
    buyerName: "",
    buyerAddress: "",
    buyerPhone: "",
    buyerGstin: "",
    lines: [{ description: "", hsn: "", qty: 1, rate: 0 }],
    discount: 0,
    shipping: 0,
    notes: "",
  });

  const set = (patch: Partial<InvoiceData>) => setData((d) => ({ ...d, ...patch }));
  const setLine = (i: number, patch: Partial<InvoiceData["lines"][number]>) =>
    setData((d) => ({ ...d, lines: d.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  const addLine = () =>
    setData((d) => ({ ...d, lines: [...d.lines, { description: "", hsn: "", qty: 1, rate: 0 }] }));
  const removeLine = (i: number) =>
    setData((d) => ({ ...d, lines: d.lines.length > 1 ? d.lines.filter((_, idx) => idx !== i) : d.lines }));

  function loadOrder(id: string) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    set({
      buyerName: o.buyerName,
      buyerAddress: [o.addressLine1, o.addressLine2, [o.city, o.state].filter(Boolean).join(", "), o.pincode]
        .filter(Boolean)
        .join("\n"),
      buyerPhone: o.phone,
      lines: o.items.length
        ? o.items.map((i) => ({ description: i.name, hsn: "", qty: i.qty, rate: i.unitPrice }))
        : data.lines,
      shipping: o.shipping,
      notes: `Against order ${o.reference}`,
    });
  }

  function loadBooking(id: string) {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    const items = itemsOf(b);
    // The enquiry's final price may be a discount off the line total (someone
    // haggled). Carry that gap in as a discount so the invoice charges the same.
    const lineSum = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const discount = Math.max(0, Math.round(lineSum - b.totalPrice));
    set({
      buyerName: b.buyerName || (b.buyerContact ? `@${b.buyerContact.replace(/^@/, "")}` : ""),
      buyerAddress: [b.pincode, b.state].filter(Boolean).join("\n"),
      buyerPhone: b.phone || "",
      lines: items.length
        ? items.map((i) => ({ description: i.name, hsn: "", qty: i.qty, rate: i.unitPrice }))
        : data.lines,
      discount,
      shipping: 0,
      notes: `Against enquiry ${b.id.slice(0, 8).toUpperCase()}`,
    });
  }

  const t = invoiceTotals(data);

  const numberField =
    "w-24 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[0.9rem] text-ink focus:border-ink/40 focus:outline-none";

  return (
    <div className="space-y-6 pb-16">
      {/* Start from an existing record */}
      <Card title="Start from" hint="Optional — pull a buyer and items from an order or enquiry, then edit anything.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="An order">
            <Select defaultValue="" onChange={(e) => e.target.value && loadOrder(e.target.value)}>
              <option value="">Blank invoice</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.reference} · {o.buyerName} · {money(o.total)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="An enquiry">
            <Select defaultValue="" onChange={(e) => e.target.value && loadBooking(e.target.value)}>
              <option value="">Blank invoice</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {itemsLabel(itemsOf(b))} · {b.buyerName || b.buyerContact || "—"}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Invoice details */}
      <Card title="Invoice details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Invoice number">
            <Input value={data.invoiceNo} onChange={(e) => set({ invoiceNo: e.target.value })} />
          </Field>
          <Field label="Date">
            <Input type="date" value={data.invoiceDate} onChange={(e) => set({ invoiceDate: e.target.value })} />
          </Field>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-3">
          <input
            type="checkbox"
            checked={data.isGst}
            onChange={(e) => set({ isGst: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#b45f2b]"
          />
          <span>
            <span className="block text-[0.875rem] text-ink">GST tax invoice</span>
            <span className="mt-0.5 block text-[0.75rem] text-ink-faint">
              Adds GSTIN, HSN and the tax breakup. Only issue while GST registration is active.
            </span>
          </span>
        </label>

        {data.isGst && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="GST rate (%)">
              <Input
                type="number"
                min={0}
                step="1"
                value={data.gstRate}
                onChange={(e) => set({ gstRate: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Your GSTIN">
              <Input
                value={data.sellerGstin}
                onChange={(e) => set({ sellerGstin: e.target.value.toUpperCase() })}
                placeholder="09XXXXXXXXXX1ZT"
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={data.interState}
                onChange={(e) => set({ interState: e.target.checked })}
                className="h-4 w-4 accent-[#b45f2b]"
              />
              <span className="text-[0.85rem] text-ink">
                Buyer is in another state (IGST instead of CGST + SGST)
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* From / Bill to */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="From">
          <div className="space-y-4">
            <Field label="Name">
              <Input value={data.sellerName} onChange={(e) => set({ sellerName: e.target.value })} />
            </Field>
            <Field label="Address">
              <Textarea
                value={data.sellerAddress}
                onChange={(e) => set({ sellerAddress: e.target.value })}
                className="min-h-[80px]"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={data.sellerPhone} onChange={(e) => set({ sellerPhone: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={data.sellerEmail} onChange={(e) => set({ sellerEmail: e.target.value })} />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Bill to">
          <div className="space-y-4">
            <Field label="Name">
              <Input value={data.buyerName} onChange={(e) => set({ buyerName: e.target.value })} />
            </Field>
            <Field label="Address">
              <Textarea
                value={data.buyerAddress}
                onChange={(e) => set({ buyerAddress: e.target.value })}
                className="min-h-[80px]"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={data.buyerPhone} onChange={(e) => set({ buyerPhone: e.target.value })} />
              </Field>
              {data.isGst && (
                <Field label="Buyer GSTIN">
                  <Input
                    value={data.buyerGstin}
                    onChange={(e) => set({ buyerGstin: e.target.value.toUpperCase() })}
                  />
                </Field>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Items */}
      <Card title="Items">
        <div className="space-y-3">
          {data.lines.map((line, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2.5 rounded-[12px] border border-line-soft bg-surface p-3">
              <label className="min-w-[180px] flex-1">
                <span className="mb-1 block text-[0.72rem] text-ink-faint">Description</span>
                <Input value={line.description} onChange={(e) => setLine(i, { description: e.target.value })} />
              </label>
              {data.isGst && (
                <label>
                  <span className="mb-1 block text-[0.72rem] text-ink-faint">HSN</span>
                  <input
                    value={line.hsn}
                    onChange={(e) => setLine(i, { hsn: e.target.value })}
                    className="w-24 rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-[0.9rem] text-ink focus:border-ink/40 focus:outline-none"
                  />
                </label>
              )}
              <label>
                <span className="mb-1 block text-[0.72rem] text-ink-faint">Qty</span>
                <input
                  type="number"
                  min={0}
                  value={line.qty}
                  onChange={(e) => setLine(i, { qty: Number(e.target.value) || 0 })}
                  className={`${numberField} bg-canvas w-20`}
                />
              </label>
              <label>
                <span className="mb-1 block text-[0.72rem] text-ink-faint">Rate</span>
                <input
                  type="number"
                  min={0}
                  value={line.rate}
                  onChange={(e) => setLine(i, { rate: Number(e.target.value) || 0 })}
                  className={`${numberField} bg-canvas`}
                />
              </label>
              <div className="pb-2.5 text-right">
                <span className="mb-1 block text-[0.72rem] text-ink-faint">Amount</span>
                <span className="block text-[0.9rem] text-ink tabular-nums">
                  {money((line.qty || 0) * (line.rate || 0))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeLine(i)}
                aria-label="Remove line"
                className="mb-1.5 rounded-full p-2 text-ink-faint transition-colors hover:text-ember-deep"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="mt-3 inline-flex items-center gap-1.5 text-[0.875rem] text-ember transition-colors hover:text-ember-deep"
        >
          <Plus size={15} />
          Add a line
        </button>

        <div className="mt-6 grid gap-5 border-t border-line-soft pt-5 sm:grid-cols-2">
          <Field label="Discount (₹)">
            <Input
              type="number"
              min={0}
              value={data.discount}
              onChange={(e) => set({ discount: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Delivery (₹)">
            <Input
              type="number"
              min={0}
              value={data.shipping}
              onChange={(e) => set({ shipping: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea
              value={data.notes}
              onChange={(e) => set({ notes: e.target.value })}
              className="min-h-[70px]"
              placeholder="Payment terms, thank-you note, anything for the buyer."
            />
          </Field>
        </div>
      </Card>

      {/* Summary + download */}
      <div className="rounded-[16px] border border-line bg-canvas p-6 sm:p-7">
        <dl className="ml-auto max-w-sm space-y-2 text-[0.925rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="text-ink tabular-nums">{money(t.subtotal)}</dd>
          </div>
          {t.discount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Discount</dt>
              <dd className="text-ink tabular-nums">− {money(t.discount)}</dd>
            </div>
          )}
          {data.isGst && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Taxable</dt>
                <dd className="text-ink tabular-nums">{money(t.taxable)}</dd>
              </div>
              {t.igst > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">IGST ({t.rate}%)</dt>
                  <dd className="text-ink tabular-nums">{money(t.igst)}</dd>
                </div>
              ) : (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">CGST ({t.rate / 2}%)</dt>
                    <dd className="text-ink tabular-nums">{money(t.cgst)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">SGST ({t.rate / 2}%)</dt>
                    <dd className="text-ink tabular-nums">{money(t.sgst)}</dd>
                  </div>
                </>
              )}
            </>
          )}
          {t.shipping > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="text-ink tabular-nums">{money(t.shipping)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-line pt-2">
            <dt className="font-display text-[1.1rem] text-ink">Total</dt>
            <dd className="font-display text-[1.3rem] text-ink tabular-nums">{money(t.grand)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => generateInvoicePdf(data)}
            className="inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[0.95rem] text-canvas transition-colors hover:bg-ember"
          >
            <Download size={17} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
