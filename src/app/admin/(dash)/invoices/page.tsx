import { InvoiceGenerator } from "@/components/admin/invoice-generator";
import { listBookings, listOrders } from "@/lib/admin/queries";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const [settings, orders, bookings] = await Promise.all([getSettings(), listOrders(), listBookings()]);

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Invoices
      </h1>
      <p className="mt-2.5 text-[0.925rem] text-ink-soft">
        Fill it in — or start from an order or enquiry — and download a professional PDF. Nothing is stored;
        each invoice is generated on the spot.
      </p>

      <div className="mt-8">
        <InvoiceGenerator settings={settings} orders={orders ?? []} bookings={bookings} />
      </div>
    </>
  );
}
