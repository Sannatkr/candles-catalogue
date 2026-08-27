import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCustomer } from "@/lib/account";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, customer] = await Promise.all([searchParams, getCustomer()]);

  // Only ever bounce to somewhere on this site. An open redirect here would let
  // a link that looks like ours land someone on a page that is not.
  const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (customer) redirect(destination);

  return (
    <div className="mx-auto max-w-[440px] px-5 pt-16 pb-24 sm:px-8">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Sign in
      </h1>
      <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
        To see your orders and where they have got to.
      </p>

      <LoginForm next={destination} />
    </div>
  );
}
