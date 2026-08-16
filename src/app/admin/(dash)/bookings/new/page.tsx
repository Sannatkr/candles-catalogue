import Link from "next/link";
import { BookingForm } from "@/components/admin/booking-form";
import { getProducts, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  if (products.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-line bg-canvas p-10 text-center">
        <p className="font-display text-[1.25rem] text-ink">Add a candle first</p>
        <p className="mx-auto mt-2 max-w-[42ch] text-[0.9rem] leading-relaxed text-ink-soft">
          A booking has to point at a product, so there needs to be at least one.
        </p>
        <Link
          href="/admin/products/new"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[0.9rem] text-canvas transition-colors hover:bg-ember"
        >
          Add a candle
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">Offline order</p>
      <h1 className="mt-3 mb-8 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Add a booking
      </h1>
      <BookingForm products={products} fragrances={settings.fragrances} />
    </>
  );
}
