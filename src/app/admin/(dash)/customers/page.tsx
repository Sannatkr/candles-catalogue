import { createClient } from "@supabase/supabase-js";
import { PAID_STATUSES, type OrderStatus } from "@/lib/admin/order-status";
import { listOrders } from "@/lib/admin/queries";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  paidOrders: number;
  spent: number;
  hasAccount: boolean;
};

export default async function CustomersPage() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Registered accounts (people who logged in via email OTP). Optional — the
  // list still works from orders alone if the service key is missing.
  let users: { email?: string | null }[] = [];
  if (serviceKey) {
    const service = createClient(SUPABASE_URL, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
    users = data?.users ?? [];
  }

  const orders = (await listOrders()) ?? [];

  // A customer is anyone who paid for something — keyed by phone (every order
  // has one), so a guest who never gave an email still shows up.
  const map = new Map<string, Customer>();
  for (const o of orders) {
    if (!PAID_STATUSES.includes(o.status as OrderStatus)) continue;
    const phone = (o.phone || "").replace(/\D/g, "").slice(-10);
    const email = (o.email || "").toLowerCase();
    const key = phone || email || o.buyerName.toLowerCase();
    if (!key) continue;
    const c = map.get(key) ?? {
      key,
      name: o.buyerName || "",
      phone,
      email: o.email || null,
      paidOrders: 0,
      spent: 0,
      hasAccount: false,
    };
    c.paidOrders += 1;
    c.spent += o.total;
    if (o.buyerName) c.name = o.buyerName;
    if (o.email && !c.email) c.email = o.email;
    if (!c.phone && phone) c.phone = phone;
    map.set(key, c);
  }

  // Mark which buyers also created an account, and add accounts that never bought.
  const accountEmails = new Set(users.map((u) => u.email?.toLowerCase()).filter(Boolean) as string[]);
  for (const c of map.values()) {
    if (c.email && accountEmails.has(c.email.toLowerCase())) c.hasAccount = true;
  }
  const buyerEmails = new Set([...map.values()].map((c) => c.email?.toLowerCase()).filter(Boolean) as string[]);
  for (const u of users) {
    const email = u.email?.toLowerCase();
    if (!email || buyerEmails.has(email)) continue;
    map.set("acct:" + email, {
      key: "acct:" + email,
      name: "",
      phone: "",
      email: u.email ?? null,
      paidOrders: 0,
      spent: 0,
      hasAccount: true,
    });
  }

  const customers = [...map.values()].sort(
    (a, b) => b.spent - a.spent || b.paidOrders - a.paidOrders || a.name.localeCompare(b.name),
  );

  return (
    <>
      <p className="eyebrow">Shop</p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight tracking-[-0.02em] text-ink">
        Customers
      </h1>
      <p className="mt-2.5 text-[0.925rem] text-ink-soft">
        {customers.length === 0
          ? "No customers yet."
          : `${customers.length} ${customers.length === 1 ? "person" : "people"} — everyone who has ordered or made an account. Guests show by phone even without an email.`}
      </p>

      {customers.length === 0 ? (
        <div className="mt-8 rounded-[16px] border border-line bg-canvas px-6 py-16 text-center">
          <p className="text-[0.95rem] text-ink-soft">Nobody has bought or signed up yet.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[14px] border border-line bg-canvas">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas-deep/35 text-[0.68rem] font-medium tracking-[0.12em] text-ink-faint uppercase">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3 text-right">Paid orders</th>
                <th className="px-5 py-3 text-right">Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.key} className="border-b border-line-soft transition-colors last:border-0 hover:bg-canvas-deep/25">
                  <td className="px-5 py-3.5">
                    <p className="text-[0.9rem] text-ink">{c.name || c.email || "Guest"}</p>
                    {c.email && c.name && <p className="text-[0.76rem] text-ink-faint">{c.email}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-[0.85rem] whitespace-nowrap text-ink-soft tabular-nums">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="hover:text-ink">
                        {c.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.hasAccount ? (
                      <span className="rounded-full bg-[#eef3ea] px-2.5 py-1 text-[0.7rem] text-[#3d5730]">
                        Account
                      </span>
                    ) : (
                      <span className="text-[0.78rem] text-ink-faint">Guest</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-[0.9rem] text-ink tabular-nums">{c.paidOrders}</td>
                  <td className="px-5 py-3.5 text-right text-[0.9rem] text-ink tabular-nums">{money(c.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
