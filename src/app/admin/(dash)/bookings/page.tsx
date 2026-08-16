import Image from "next/image";
import { setBookingStatus } from "@/lib/admin/actions";
import { listBookings } from "@/lib/admin/queries";
import { compactQty, money } from "@/lib/format";

export const dynamic = "force-dynamic";

const NEXT_STATUS: Record<string, { to: string; label: string }> = {
  new: { to: "contacted", label: "Mark contacted" },
  contacted: { to: "confirmed", label: "Mark confirmed" },
  confirmed: { to: "closed", label: "Mark closed" },
  closed: { to: "new", label: "Reopen" },
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-ember-wash text-ember-deep",
  contacted: "bg-canvas-deep text-ink-soft",
  confirmed: "bg-[#eaf0e6] text-[#41552f]",
  closed: "bg-canvas-deep text-ink-faint",
};

export default async function AdminBookingsPage() {
  const bookings = await listBookings();
  const openCount = bookings.filter((b) => b.status === "new").length;

  return (
    <>
      <p className="eyebrow">Orders</p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Bookings
      </h1>
      <p className="mt-3 text-[0.925rem] text-ink-soft">
        {bookings.length === 0
          ? "Nothing booked yet."
          : `${bookings.length} total · ${openCount} still to answer.`}
      </p>

      {bookings.length === 0 ? (
        <p className="mt-10 rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center text-[0.925rem] text-ink-soft">
          When someone uses “Book your order” on the site, it lands here — with the candle, quantity, rate and
          their contact.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-[14px] border border-line bg-canvas p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-canvas-deep">
                  {b.productImage && (
                    <Image src={b.productImage} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[1.05rem] text-ink">{b.productName}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.7rem] tracking-wide uppercase ${
                        STATUS_STYLE[b.status] ?? STATUS_STYLE.closed
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <p className="mt-1 text-[0.875rem] text-ink">
                    {compactQty(b.quantity)} pcs × {money(b.unitPrice)} ={" "}
                    <span className="font-medium">{money(b.totalPrice)}</span>
                  </p>

                  <p className="mt-1.5 text-[0.825rem] text-ink-soft">
                    {b.buyerName || "No name given"} · {b.buyerContact}
                    {b.fragrance && ` · ${b.fragrance}`}
                    {b.pincode && ` · ${b.pincode}`}
                    {b.state && ` (${b.state})`}
                  </p>

                  {b.note && <p className="mt-1.5 text-[0.825rem] text-ink-faint">“{b.note}”</p>}

                  <p className="mt-1.5 text-[0.75rem] text-ink-faint">
                    {new Date(b.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <form action={setBookingStatus} className="shrink-0">
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value={NEXT_STATUS[b.status]?.to ?? "new"} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-2 text-[0.8rem] text-ink transition-colors hover:border-ink"
                  >
                    {NEXT_STATUS[b.status]?.label ?? "Reopen"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
