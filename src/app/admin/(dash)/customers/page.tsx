import { createClient } from "@supabase/supabase-js";
import { PAID_STATUSES, type OrderStatus } from "@/lib/admin/order-status";
import { listOrders } from "@/lib/admin/queries";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

function when(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CustomersPage() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return (
      <>
        <p className="eyebrow">Shop</p>
        <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
          Customers
        </h1>
        <div className="mt-8 rounded-[16px] border border-ember/40 bg-ember-wash px-6 py-8">
          <p className="max-w-[60ch] text-[0.9rem] leading-relaxed text-ember-deep">
            Reading the customer list needs the service-role key. Add{" "}
            <code className="rounded bg-canvas px-1.5 py-0.5 text-[0.85em]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            to the environment and this page fills in.
          </p>
        </div>
      </>
    );
  }

  const service = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data, error }, orders] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 1000 }),
    listOrders(),
  ]);

  const users = (data?.users ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Paid orders per email, so each customer shows what they have actually spent.
  const byEmail = new Map<string, { count: number; spent: number }>();
  (orders ?? [])
    .filter((o) => o.email && PAID_STATUSES.includes(o.status as OrderStatus))
    .forEach((o) => {
      const key = o.email!.toLowerCase();
      const entry = byEmail.get(key) ?? { count: 0, spent: 0 };
      entry.count += 1;
      entry.spent += o.total;
      byEmail.set(key, entry);
    });

  return (
    <>
      <p className="eyebrow">Shop</p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Customers
      </h1>
      <p className="mt-2.5 text-[0.925rem] text-ink-soft">
        {users.length === 0
          ? "Nobody has made an account yet."
          : `${users.length} ${users.length === 1 ? "person has" : "people have"} made an account. Orders are matched to them by the email used at checkout.`}
      </p>

      {error ? (
        <div className="mt-8 rounded-[16px] border border-ember/40 bg-ember-wash px-6 py-8">
          <p className="text-[0.9rem] text-ember-deep">Could not read the customer list: {error.message}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="mt-8 rounded-[16px] border border-line bg-canvas px-6 py-16 text-center">
          <p className="text-[0.95rem] text-ink-soft">No accounts yet.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[14px] border border-line bg-canvas">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas-deep/35 text-[0.68rem] font-medium tracking-[0.12em] text-ink-faint uppercase">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Last seen</th>
                <th className="px-5 py-3 text-right">Paid orders</th>
                <th className="px-5 py-3 text-right">Spent</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const stats = u.email ? byEmail.get(u.email.toLowerCase()) : undefined;
                return (
                  <tr key={u.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-canvas-deep/25">
                    <td className="px-5 py-3.5">
                      <p className="text-[0.9rem] text-ink">{u.email ?? "—"}</p>
                      {!u.email_confirmed_at && (
                        <p className="text-[0.72rem] text-ink-faint">not verified</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] whitespace-nowrap text-ink-soft">
                      {when(u.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] whitespace-nowrap text-ink-soft">
                      {when(u.last_sign_in_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[0.9rem] text-ink tabular-nums">
                      {stats?.count ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[0.9rem] text-ink tabular-nums">
                      {money(stats?.spent ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
