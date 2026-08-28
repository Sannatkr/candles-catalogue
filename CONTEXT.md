# Sugandha Candles — project context

> Working context for whoever (human or AI) picks this up next.
> **Keep this file current. Update the Changelog at the bottom on every change, big or small.**

Last updated: 2026-08-27

---

## The one big thing to understand

This project started life as a **catalogue** — a link you send a client, they see the
range with photos, sizes and price slabs. **No cart, no checkout, no accounts.** That is
what `README.md` still describes, and what is live in production today.

It is **now being turned into a full online shop**: cart, checkout, real payments,
customer accounts, order tracking. **This new work is NOT pushed and NOT deployed yet.**
The plan is: finish the website first, then push and deploy in one go. Until then,
production keeps running the old catalogue.

So there are two truths at once:
- **Live / production** = the old catalogue (last pushed commit on `main`).
- **Local working tree** = the new shop, half-built, uncommitted.

`README.md` is stale on purpose for now (it describes the catalogue). Don't trust it for
the new features — trust this file and the code.

---

## Where the code stands right now (git)

- Branch: `main`, up to date with `origin/main`.
- The shop work lives entirely in **uncommitted changes** (modified + untracked files).
- Nothing about the shop has been pushed. `origin/main` is still the catalogue.

Rough shape of the uncommitted work:
- **New customer flow**: `cart/`, `checkout/`, `orders/`, `account/` route folders.
- **New libs**: `cart.tsx`, `orders.ts`, `pricing.ts`, `account.ts`, `analytics.tsx`.
- **New admin**: `admin/(dash)/orders/`, `is-admin.ts`, `order-status.ts`.
- **New SQL**: `013-orders.sql`, `014-admin-lockdown.sql`, `015-customer-accounts.sql`.
- **Removed**: old `booking-dialog.tsx`, `product-actions.tsx` (replaced by
  `product-purchase.tsx` + `enquiry-dialog.tsx`).

---

## Tech stack

- **Next.js 16** (App Router, React 19) — note: this Next version has breaking changes vs
  older ones; see `AGENTS.md`. Read `node_modules/next/dist/docs/` before writing Next code.
- **TypeScript**, **Tailwind CSS v4**.
- **Supabase** — Postgres + Auth + Storage (product images). Publishable/anon key on the
  client; service-role key server-only.
- **Razorpay** — payments (two ways, see below).
- **PostHog** — optional analytics (no key = nothing loads).
- **Resend** — planned for order-confirmation emails (in `.env.example`, **not wired in
  code yet**). OTP login emails come from Supabase's own SMTP, not Resend.
- Hosting target: **Vercel**. DB: **Supabase**. Deploy-once model (content edits are live
  instantly via the admin; no redeploy needed for data).

---

## How the app is laid out

### Public site — `src/app/(site)/`
`page.tsx` (home), `products/`, `products/[slug]/`, `collections/`, `collections/[slug]/`,
`terms/`, and the new `cart/`, `checkout/`, `orders/[id]/` (receipt), `account/` +
`account/login/`.

### Admin — `src/app/admin/`
Behind login. `(dash)/` has: `orders/` (new), `bookings/` (now labelled **Enquiries**),
`revenue/`, `products/`, `collections/`, `settings/`. Guarded by `src/proxy.ts`
(middleware) which now checks **admin**, not just "logged in".

### Data layer — `src/lib/`
- `data.ts` — reads catalogue (collections, products, settings) from Supabase, falls back
  to `seed.ts` sample data when Supabase isn't configured, so the site never looks empty.
- `types.ts` — the domain types (`Product`, `Collection`, `SiteSettings`, `Booking`, …).
- `supabase/` — `client.ts`, `server.ts`, `config.ts` (`isSupabaseConfigured` gate).

---

## Two separate flows: Enquiries vs Orders

This is the core mental model. They are **two different tables** on purpose.

| | **Bookings / Enquiries** | **Orders** |
|---|---|---|
| Table | `bookings` | `orders` |
| Meaning | Someone *asked* — bulk quote, custom fragrance, waitlist. **No money committed.** | Someone *paid*. A real parcel to pack and ship. |
| Entry point | Enquiry form / `enquiry-dialog.tsx` | Cart → checkout → Razorpay |
| Admin screen | "Enquiries" | "Orders" |

An enquiry can sit open for a week and come to nothing; an order is a promise with money
behind it. Keeping them apart means no screen has to ask "which kind of row is this?".

---

## Pricing model (`src/lib/pricing.ts`)

- Buyers pick a **band**, not a raw number. Card shows one price at a time (not the old
  wholesale slab table).
- `RETAIL_MAX = 20` — more than 20 of *one design* is a bulk rate, not a retail sale → it
  goes through the **enquiry** form (Instagram-coloured "Chat for N pieces" button), not the
  cart. **No total-bag cap** — `CART_MAX_PIECES` was removed; the bag is unbounded.
- `priceAtQty()` / `singlePrice()` / `bandsFor()` are the helpers everything uses.

## Shipping (`src/lib/shipping.ts`)

- **FLAT ₹89**, free over a subtotal (**₹2000**) — but only while the parcel stays under a
  weight cap (**2 kg**), so heavy urli orders never ship free. `ShippingConfig` =
  `{ flatFee, freeOverSubtotal, freeUnderGrams }`, editable in **Settings → Delivery**.
- Each product has a **pack weight (g)** — the courier's chargeable weight once boxed
  (`products.pack_weight_grams`, migration 017; auto-estimated from size when 0 via
  `packGramsOf`/`estimatePackGrams`). Drives the free-shipping weight guard AND the
  RapidShyp package weight.
- `shippingCost(config,{grams,subtotal})` is the one calculator; cart-view, checkout-form
  and `startCheckout` (server authority) all use it.

---

## Cart (`src/lib/cart.tsx`)

- Lives in **localStorage only** (`sugandha.cart.v1`), not the DB — no account needed to
  shop, survives closing the tab, syncs across tabs.
- Read via `useSyncExternalStore` (no empty-cart flash, no mount cascade).
- Enforces the caps client-side, but caps are **re-enforced server-side** at checkout
  because a localStorage cart is "a wish, not a quote".

---

## Checkout & payments (`src/lib/orders.ts`, `src/lib/payments/razorpay.ts`)

There are **two payment paths** — don't confuse them:

1. **Retail checkout (new shop)** — `orders.ts`:
   - Browser sends only slugs + quantities. **Every price is re-looked-up server-side**
     from the catalogue. Never trust the cart's prices.
   - Flow: `startCheckout()` creates a Razorpay order + inserts an `orders` row
     (`status: 'pending'`) → Razorpay Checkout in browser → `confirmPayment()` verifies the
     `order_id|payment_id` HMAC signature and promotes the row to `paid` using the
     **service-role** key (a buyer must never mark their own order paid).
   - `abandonOrder()` marks walked-away attempts `failed` so the admin list isn't full of
     ghosts. Order reference format: `SC-XXXXXX` (unambiguous alphabet, sayable aloud).
   - Receipt page re-reads via `order_receipt(p_id, p_reference)` RPC — needs **both** id
     and reference; returns only what's already on the buyer's receipt.
   - On paid, `confirmPayment` also **auto-creates a RapidShyp shipment** (`src/lib/rapidshyp.ts`,
     `POST …/create_order`, header `rapidshyp-token`, PREPAID) — best-effort, idempotent,
     **live-mode only** (skipped while on `rzp_test_` keys), stores `orders.rapidshyp_order_id`.

2. **Payment links (older, for bookings)** — `razorpay.ts` + `api/razorpay/webhook/route.ts`:
   - Admin generates a Razorpay **payment link** for a booking; the **webhook** marks that
     booking `paid` on `payment_link.paid`. Signature-verified.

Both paths verify Razorpay signatures with HMAC + `timingSafeEqual`. Never act on a
Razorpay callback body before it verifies.

---

## Customer accounts (`src/lib/account.ts`)

- **Passwordless.** One-time code (OTP) to the buyer's email via Supabase Auth. No
  passwords stored, no reset flow, nothing worth stealing.
- Sign-up and sign-in are the **same act** — `signInWithOtp({ shouldCreateUser: true })`.
- **`claim_my_orders()`** — the clever bit: an order already carries the email it was
  placed with. On first login with that address, all past guest orders attach to the new
  account automatically. Runs on every `/account` visit (cheap + idempotent).
- Customers can **read** their own orders/bookings; never update or delete (that stays a
  conversation with the owner).

---

## Admin vs "logged in" (`src/lib/admin/is-admin.ts`, `supabase/014`)

- Once customers can log in, "authenticated" no longer means "admin". `014-admin-lockdown.sql`
  introduces an `admins` table + `is_admin()` SQL function, and rewrites every RLS policy
  to require `is_admin()` for admin actions.
- **Fail-open quirk (intentional):** if `is_admin()` doesn't exist yet (migration 014 not
  run — PostgREST code `PGRST202`), `checkIsAdmin` returns `true`. Reason: before 014, the
  only people who could log in are hand-created admins, so failing closed would lock the
  owner out. After 014 runs, this branch is unreachable and everything fails closed.
  `isLockdownPending()` drives an admin warning so this is never silent.

---

## Supabase migrations

Run in `Supabase → SQL Editor`. All are idempotent (safe to run twice). `schema.sql` is the
base; then numbered updates in order. **013 → 014 → 015 order matters; 016–018 are independent.**

- `013-orders.sql` — the `orders` table, RLS, `order_receipt()` RPC.
- `014-admin-lockdown.sql` — `admins` table + `is_admin()`; **must run before any customer
  login is switched on**, or customers could read every order/address.
- `015-customer-accounts.sql` — `user_id` on orders/bookings, `claim_my_orders()`, per-user
  read policies. **Run 014 before 015.**
- `016-refunded-status.sql` — adds `'refunded'` to the orders status check. **Needed or the
  ⋯ "Refunded" action silently no-ops.**
- `017-shipping.sql` — adds `products.pack_weight_grams` + back-fills estimates. **Needed or
  saving a product in the admin errors on the missing column** (storefront falls back to
  live estimates meanwhile).
- `018-rapidshyp.sql` — adds `orders.rapidshyp_order_id`.
- `019-booking-shipping.sql` — adds `bookings.address` + `bookings.rapidshyp_order_id` (for
  hand-shipping enquiries).
- **`scratchpad/repricing.sql`** (not a migration, run once) — the gentle-tier + heavy-bump
  repricing of all 27 products.

**ALL migrations 013–019 confirmed applied** (2026-08-27, verified via REST column/RPC probes:
`pack_weight_grams` populated, `orders.rapidshyp_order_id`, `bookings.address` +
`bookings.rapidshyp_order_id`, `is_admin` RPC). Repricing v2 applied to all 27 products.

---

## Environment variables (`.env.example`)

Local: copy `.env.example` → `.env.local`. Vercel: set the same in project env.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase API.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` — payments
  (secret server-only; the public key id is needed in the browser for Checkout).
- `RAZORPAY_WEBHOOK_SECRET` — verifies webhook callbacks.
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, bypasses RLS. Used to mark orders/bookings
  paid after signature verification. Never expose to the browser.
- `RAPIDSHYP_API_KEY` — **set** (this session). Auto-creates a courier shipment on paid
  orders.
- `RAPIDSHYP_PICKUP_NAME` — the pickup location name from the RapidShyp portal. Should be
  **`Gaur City`** (their one verified pickup location, pincode 201301). **Set this in
  `.env.local`** — until it is, shipment creation is skipped. (Note: portal pincode 201301
  vs shop 201009 — unconfirmed which is right.)
- `RESEND_API_KEY` — order-confirmation emails (planned; not used in code yet).
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — optional analytics.

Local `.env.local` this session: Supabase (URL + publishable + service-role), Razorpay
**TEST** keys (`rzp_test_`), `RAPIDSHYP_API_KEY`. Missing: `RAPIDSHYP_PICKUP_NAME`,
`RAZORPAY_WEBHOOK_SECRET`, PostHog.

---

## Outstanding work (picked up next session)

1. **Pricing dry-run** (requested, not started): recompute all products' bulk tiers to
   **gentle ~15%** steps (no sudden drops) + **+₹50** on heavy candles (pack weight >1.5 kg).
   Plan agreed: write a script that reads products → dry-run before/after table → confirm →
   apply to the live catalogue. Live-data change, so show before applying.
2. **Run migrations 016, 017, 018** in Supabase.
3. **Set `RAPIDSHYP_PICKUP_NAME=Gaur City`** in `.env.local` (and Vercel later).
4. **Manual "Create shipment" button** on the order modal — offered, not built (for orders
   marked paid by hand, which skip the online-payment path).

## Before pushing / going live — checklist

- [ ] Do the pricing dry-run (#1 above).
- [ ] Run migrations **013 → 014 → 015** then **016, 017, 018** on production Supabase.
- [ ] Set all env vars in Vercel: Razorpay **live** keys, service-role key, webhook secret,
      `RAPIDSHYP_API_KEY`, `RAPIDSHYP_PICKUP_NAME`.
- [ ] Configure the Razorpay **webhook URL** to `/api/razorpay/webhook` + set its secret.
- [ ] Switch Razorpay to **live keys** — this is also what turns on RapidShyp auto-shipment.
- [ ] Verify the first live order creates a RapidShyp shipment (check the order modal for the id).
- [ ] Decide on order-confirmation emails (wire Resend, or drop it from `.env.example`).
- [ ] Update `README.md` — it still describes the catalogue-only site.
- [ ] Commit + push + deploy.

## What was built this session (see Changelog for detail)

Checkout smoke-tested + real test payment verified · flat-₹89 weight-guard shipping ·
per-product pack weights · admin turned into a left-sidebar dashboard · Orders as a column
table with an editable modal + ⋯ actions (incl. Refunded) · Enquiries editable (custom
"unknown" candles + final-price/discount override) · **invoice generator** (`/admin/invoices`,
GST toggle, jsPDF one-click download, start-from-order/enquiry) · **RapidShyp** auto-shipment.
Nothing pushed yet — still all uncommitted on `main`.

---

## Open questions / notes

- **Order confirmation emails**: `RESEND_API_KEY` is documented but **no Resend call exists
  in the code**. Either wire it up or remove the env line before launch.
- `README.md` describes the *old* catalogue ("No cart, no checkout"). Rewrite at launch.
- `CLAUDE.md` just points to `AGENTS.md` (Next.js 16 agent rules).

---

## Changelog

_Newest first. Add an entry for every change — one line is fine. Format: `YYYY-MM-DD — what changed`._

- 2026-08-27 — **Added Customers admin page** (`/admin/customers`, nav item). Lists `auth.users` via the service-role `auth.admin.listUsers()` — email, joined, last seen, paid-order count + total spent (matched by checkout email). Clarified for the owner that guest orders attach to an account by the **email used at checkout** (claim_my_orders + RLS `user_id = auth.uid()`), so it's private, not a leak — a customer only sees orders placed with their own email. Deployed (commit 5594550).
- 2026-08-27 — **DEPLOYED to production** (Vercel, `candles-catalogue.vercel.app`, live Razorpay keys, webhook enabled with 3 events). Then **fixed a product-pricing sync bug**: price came from a separately-clicked band, so 2 pieces could get the 10+ rate and clicking a band didn't set the quantity. Rewrote `product-purchase.tsx` so **quantity is the source of truth** — `unitPrice = priceAtQty(qty)`, bands are quantity shortcuts, active band derived from qty. (Server `startCheckout` already re-priced by qty, so the charge was always right; this fixed the display mismatch.) Pushed (commit 2332648).
- 2026-08-27 — **Webhook hardened for retail orders + shipment helper extracted.** `api/razorpay/webhook` now also handles `order.paid` / `payment.captured`: finds the order by `razorpay_order_id`, promotes it paid **only if still pending** (idempotent; confirmPayment usually wins the race), and books the shipment — the safety net for a browser dying mid-confirm. Extracted `shipOrderRow(service, orderId, liveMode)` into `src/lib/fulfillment.ts`, now shared by `confirmPayment` and the webhook (removed the duplicated block + now-unused imports from orders.ts). Razorpay webhook must subscribe to `payment_link.paid`, `order.paid`, `payment.captured`, with `RAZORPAY_WEBHOOK_SECRET` set. tsc + eslint clean.
- 2026-08-27 — **Revenue now includes paid orders, split three ways.** Added `listRevenueOrders(from,to)` (paid/packed/shipped/delivered by `paid_at`). Revenue page hero = **total** (orders + enquiries); stat row shows **Orders revenue / Enquiries revenue / Pieces sold**; timeline + best-sellers combine both sources; the old "Where orders came from" card is now **"Orders vs Enquiries"** (SourceSplit gained optional `labelA/labelB`).
- 2026-08-27 — **Order delete made discoverable.** `deleteOrder` already existed in the ⋯ menu; added a confirm-then-delete "Delete this order" button at the bottom of the order-detail modal (`order-detail.tsx`, imperative `deleteOrder` via `useTransition` → `onClose`).
- 2026-08-27 — **Repricing v2 applied + red discount styling.** Steeper bulk (10/25 gentle ~5/10%, **50/100 reach ~25% off single**) + **charm pricing** (all prices end in 9, e.g. 402→399) + all MRPs kept above selling price. Applied to live DB (verified: 27/27 products, 0 flagged). Product page discount restyled professional: **red struck-through MRP** (`#c0392b`) + bold green **"N% OFF"** pill (`product-purchase.tsx`). **ALL migrations 013–019 now confirmed applied** (pack_weight_grams populated, e.g. Marigold 2160 g; orders/bookings shipment columns present; is_admin RPC live). Env: Supabase + Razorpay TEST + service-role + RAPIDSHYP_API_KEY + RAPIDSHYP_PICKUP_NAME=Gaur City all set. tsc + eslint clean project-wide.
- 2026-08-27 — **Enquiry manual shipment + repricing.** (a) Enquiries can now be shipped by hand: added an **Address** field to the enquiry editor (`bookings.address`, migration 019) and a two-step **"Create shipment"** button (`booking-ship-button.tsx` → `createBookingShipment(id)` server action) that builds a RapidShyp shipment from the booking's address/pincode/phone/items (custom candles assumed 400 g/pc; box refined by hand on RapidShyp). Idempotent via `bookings.rapidshyp_order_id`. Orders stay **auto** on paid. (b) **Repricing computed** (`scratchpad/repricing.sql`, 27 UPDATEs): gentle ~15% bulk tiers for all + ₹50 on heavy (>1.5 kg) candles + fixed two backwards MRPs (Marigold, Poker Glass Jar). **User to run the repricing SQL + migration 019** in Supabase. tsc + eslint clean.
- 2026-08-26 — **RapidShyp auto-shipment on paid order.** New `src/lib/rapidshyp.ts` → `POST https://api.rapidshyp.com/rapidshyp/apis/v1/create_order`, auth header `rapidshyp-token`, `paymentMethod: PREPAID`. Called at the end of `confirmPayment` (retail checkout), **best-effort** in try/catch so a courier failure never fails a paid order; idempotent (skips if `rapidshyp_order_id` already set). Package weight = summed pack grams; box sent as a cube whose volumetric weight = pack weight (so the courier bills the weight we charged). **Guarded to live mode only** (`RAZORPAY_KEY_ID` not `rzp_test_`), so test checkouts never create real shipments. Needs env `RAPIDSHYP_API_KEY` (added) + **`RAPIDSHYP_PICKUP_NAME`** (the pickup location name created in the RapidShyp portal — NOT yet set, so nothing fires until it is) — both in `.env.example`. **Run migration `supabase/018-rapidshyp.sql`** (adds `orders.rapidshyp_order_id`). Shipment id shown in the admin order-detail modal. NOT tested against the live API (would create a real shipment) — will fire on the first real (live-mode) paid order. tsc + eslint clean.
- 2026-08-26 — **Fix:** invoice "Start from an enquiry" ignored the enquiry's discounted final price — it loaded line items (summing to the pre-discount total) but not the `total_price` override. `loadBooking` now sets the invoice **discount = lineSum − booking.totalPrice**, so the invoice total matches the agreed final price.
- 2026-08-26 — **Enquiry editor upgraded: edit line items, add custom/"unknown" candles, override final price (discounts).** The **Edit** button on an enquiry row (`booking-edit.tsx`) now edits the full order, not just buyer fields: add/remove/change lines with a free-text candle name (so non-catalogue items work) + qty + rate, plus an "Add from catalogue…" quick-picker (products now passed through bookings page → BookingRowTools → BookingEdit). A **"Final price charged"** field overrides the line sum for discounts ("= subtotal" reset + discount readout). `updateBooking` rebuilds items/quantity/unit_price/total_price; custom lines get a slug from `slugify(name)` because `parseItems` drops empty-slug items. `total_price` = the final override (flows to revenue + payment links). tsc + eslint clean. (Reminder: it's the **Edit** button that edits — the "Details" button is the read-only IG-message composer.)
- 2026-08-26 — **Admin invoice generator (`/admin/invoices`).** New nav item. Client form (`components/admin/invoice-generator.tsx`) → one-click **PDF download** via jsPDF + jspdf-autotable (added deps). Engine in `lib/admin/invoice.ts` (types, `invoiceTotals`, `amountInWords` Indian numbering, `generateInvoicePdf`). Per-invoice **GST toggle**: off = plain "INVOICE"; on = "TAX INVOICE" with GSTIN, HSN column, CGST+SGST (or IGST if inter-state). Seller prefilled from settings; **"Start from" an order or enquiry** prefills buyer + line items (all editable). Live totals preview. Stateless — not stored; invoice number is manual (defaults `SC/<FY>/001`). Note: PDF uses **"Rs."** not ₹ (jsPDF's built-in fonts have no ₹ glyph); on-screen still shows ₹. **Import gotcha fixed:** must be `import { jsPDF } from "jspdf"` (named) — the default import is not a constructor and would throw in the browser; verified via Node smoke test + amountInWords check. tsc + eslint clean. Couldn't click-test in-admin (login), so the PDF's visual layout is unverified on-screen.
- 2026-08-26 — **Shipping switched to FLAT ₹89 + free-over-₹2000 with a weight guard; cart cap removed; bulk at 20; Instagram bulk button; bold MRP; checkout T&C.** Reworked `shipping.ts` from zones/per-kg to flat: `ShippingConfig` is now `{ flatFee, freeOverSubtotal, freeUnderGrams }`, `shippingCost(config,{grams,subtotal})` = free when subtotal ≥ ₹2000 AND weight ≤ 2 kg, else ₹89. Pack weights kept (they drive the guard). Dropped zones/pincode logic from cart-view, checkout-form, orders.ts; settings Delivery card simplified to flat fee + free-over + free-under-kg. `RETAIL_MAX` 9→**20** (per-design bulk threshold); **`CART_MAX_PIECES` removed entirely** — bag is unbounded (cart.tsx, product-purchase, cart-view, orders.ts all updated; `cart.full` gone). Bulk button ("Chat for N pieces") now uses the **Instagram gradient** + InstagramIcon (routes to the enquiry/IG flow; WhatsApp later). MRP strikethrough made bold + shows "(N% off)". **Required Terms & Conditions checkbox added at checkout** (gates Pay, links to /terms). Verified live: 5 Peacock (9.3 kg, ₹3,245) = ₹89 not free; 3 Brass Tin (1.8 kg, ₹2,097) = Free; T&C shows. tsc+eslint clean. **STILL TODO (next):** (1) pricing script — gentle ~15% bulk tiers for all candles + ~₹50 bump on heavy (>1.5 kg) candles, run as dry-run→confirm→apply; (2) **RapidShyp** auto-create shipment on paid order — needs `RAPIDSHYP_API_KEY` in `.env.local` + reading https://docs.rapidshyp.com.
- 2026-08-26 — **Weight-based dynamic shipping.** Replaced flat ₹79/free-over-₹1500 with weight × zone. New `src/lib/shipping.ts` (estimatePackGrams, packGramsOf, zoneForPincode, shippingCost, DEFAULT_SHIPPING). Each product gets a **pack weight (g)** = the courier's chargeable weight once boxed (far above wax weight); auto-estimated from size (`max(wax, volumetric)×3`, 250 g floor) when 0, overridable in the admin product form. Two zones (local = UP/NCR by pincode prefix, rest = everywhere else), each with first-kg + per-extra-kg rates; free over a subtotal **only under a weight cap** (default 2 kg) so heavy orders never ship free. Config lives in `SiteSettings.shipping` (settings JSON) with a **Delivery** card in the settings form to tune. Wired through: cart line carries `packWeightGrams`, `useCart` exposes `weightGrams` (no more price-only `shipping`/`total` — cart-view & checkout compute from weight+zone), `startCheckout` recomputes server-side as the authority. **NEEDS MIGRATION: run `supabase/017-shipping.sql`** (adds `products.pack_weight_grams` + backfills estimates) — until then the product form's Save will error on the missing column, though the storefront falls back to live estimates. Verified live: 5 Peacock = 9.3 kg → ₹540 Rest / ₹330 local, not free despite ₹3,245 subtotal. tsc + eslint clean.
- 2026-08-26 — **Fixes:** Orders table header was stacking vertically — the dynamic `grid-cols-[…]` Tailwind class wasn't being generated; switched header + rows to an inline `gridTemplateColumns` style (`ORDER_GRID`), which always applies. Removed the "refund in Razorpay first" hint from the ⋯ Refunded item. Confirmed Enquiries rows carry Details / **Edit** / ⋯.
- 2026-08-26 — **Admin order detail modal (editable) + ⋯ actions; enquiry Edit; refunded status.** Orders: clicking a row now opens a **modal** (`components/admin/order-detail.tsx`, portal) showing the items/payment read-only and an **editable** buyer + delivery form (name, phone, email, address, city, state, pincode, note → `updateOrderDetails`) plus the tracking form; each row has a **⋯ menu** (`order-row-actions.tsx`) to mark Paid/Packed/Shipped/Delivered/Cancelled/**Refunded** or delete. Row is now `order-row.tsx` (client) replacing the inline `<details>`; `orders/page.tsx` maps it. Enquiries: added an **Edit** button (`booking-edit.tsx` modal → `updateBooking`) editing buyer/contact/phone/pincode/state/fragrance/note. Edits deliberately never touch items/prices/amount-paid. New status **refunded** = record only (you refund in Razorpay, then mark it; excluded from "collected"). **NEEDS MIGRATION: run `supabase/016-refunded-status.sql`** or marking Refunded silently no-ops (DB check constraint). tsc + eslint clean.
- 2026-08-26 — **Admin converted to a left-sidebar dashboard, full-width content.** Superseded the earlier left-filter-rail idea: the **main nav** (Orders, Enquiries, Revenue, Products, Collections, Settings + View site / Sign out) is now a **left sidebar** (`components/admin/admin-nav.tsx` → vertical `<aside>` on `lg`, horizontal scroll bar on mobile). Dashboard layout (`admin/(dash)/layout.tsx`) is now `flex lg:flex-row` with the content area `flex-1` and no narrow `max-w` — uses the full page width. The status **filters** (To ship/All/Paid/… on Orders; Source/Status on Enquiries) went back to **chips at the top of the content**, since the left is now the section nav. Orders keeps its column table; Enquiries keeps its `<table>`. tsc + eslint clean.
- 2026-08-26 — **Admin Orders + Enquiries redesigned: left filter rail + column tables.** Moved the filter chips out of the top strip into a **left sidebar** on both pages (`/admin/orders`, `/admin/bookings`), and rebuilt the Orders list from stacked accordion cards into an aligned **column table** (Order · Items · Destination · Placed · Total · Status) with expandable rows that keep the server-action forms (status, tracking, delete). Orders table uses a shared CSS-grid template (`COLS`) so header + rows line up; Enquiries keeps its real `<table>`. Both rails collapse to a horizontal scroll strip on mobile; both tables scroll horizontally under `min-w`. Files: `orders/page.tsx` (rewrite), `bookings/page.tsx` (two-col layout), `components/admin/booking-filters.tsx` (vertical rail). tsc + eslint clean.
- 2026-08-26 — **🔒 Admin-lockdown loophole checked — CLOSED.** Verified against the live DB (`migglvwewagtttqfhwvs`): `is_admin()` exists → migration **014 is run** (so `checkIsAdmin` no longer fails open); `claim_my_orders()` exists → migration **015 is run**. A customer who signs in via `/account` email-OTP is NOT an admin: `is_admin()` returns false, middleware `proxy.ts` redirects non-admins off `/admin` to `/`, and RLS blocks them from reading orders/bookings. All three migrations (013/014/015) confirmed applied. No loophole.
- 2026-08-26 — **✅ Full retail checkout verified end-to-end (local, test keys).** After regenerating Razorpay **test** keys (`rzp_test_TU…`) and updating `.env.local`, a real payment went through on the dev server: `startCheckout` created `order_TUT4dYeTjRV5yG`, `confirmPayment` verified the signature and marked the order **paid**, and the receipt page rendered (`/orders/…?ref=SC-GNXFWF`). Razorpay's own dashboard also flagged the test transaction (₹728) as successful and the integration as complete. So cart → checkout → Razorpay → confirm → paid → receipt all work. (Earlier a stale/mismatched secret caused a 401 "Authentication failed"; fixed by regenerating a matching key id + secret pair. Lesson: the Razorpay secret shows only once — copy id + secret together.) **Live keys intentionally NOT used** — held for launch day.
- 2026-08-26 — **Local checkout smoke-test (dev server).** Verified working: site loads real Supabase data (27 products), cart (localStorage, 9/design + 15/bag caps, free-shipping ≥₹1500), checkout form (validation + pincode→state lookup), and `startCheckout()` — it created a Razorpay order and inserted a `pending` order row (proves **migration 013 / orders table is live** and the TEST keys are valid). `checkout.js` loaded, `window.Razorpay` is a function, and the `.razorpay-container` + checkout iframe were injected — so the front-end integration is correct. **Could not finish the payment in the in-app preview browser**: Razorpay's hosted sheet renders as a 0×0 iframe there (sandbox limitation, not a code bug). Paying with the test card + the `confirmPayment()` → receipt → order-status flip still needs a real browser. Note: one leftover `pending`/`failed` test order now sits in the DB. Still unverified: migrations 014 (admin lockdown) and 015 (customer accounts) — they don't touch checkout.
- 2026-08-26 — Local `.env.local` confirmed configured: Razorpay **TEST** keys (`rzp_test_…`), Supabase URL + publishable key + service-role key all set. Missing (fine for now): `RAZORPAY_WEBHOOK_SECRET` (only the booking payment-link path needs it, not retail checkout), `RESEND_API_KEY` (not wired), PostHog (optional).
- 2026-08-26 — Created this context file after a full read-through of the codebase. No code changed. Captured the catalogue→shop transition, the two-flow (enquiries vs orders) model, pricing/cart/checkout/accounts/admin architecture, migrations 013–015, env vars, and the pre-launch checklist.
