# Sugandha Candles — project context

> Working context for whoever (human or AI) picks this up next.
> **Keep this file current. Update the Changelog at the bottom on every change, big or small.**

Last updated: 2026-08-28 · **LIVE in production** (see Status section below)

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
- `020-scripts.sql` — the `reel_scripts` table (admin-only RLS) **plus the first five reel
  scripts seeded** with their posting slots.
- `021-free-gift.sql` — adds `products.gift_eligible` and pre-ticks everything ≤₹149.
  **Needed or the free-candle offer has nothing to give** (and saving a product errors on the
  missing column).
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

## STATUS: LIVE IN PRODUCTION (as of 2026-08-28)

Deployed on Vercel at **candles-catalogue.vercel.app**, taking **real payments** (live
Razorpay keys in Vercel; local `.env.local` still has TEST keys). Repo:
`github.com/Sannatkr/candles-catalogue`, branch `main` (Vercel auto-deploys on push).

**Done & verified live:**
- All migrations **013–019 applied**; repricing v2 applied (gentle 10/25, ~25% at 50/100,
  charm-priced to ₹…9, MRPs above price).
- Razorpay **live keys** + **webhook** enabled (3 events; endpoint verified returning 401 on
  bad signature = configured correctly). Stuck-pending safety net active.
- **RapidShyp** configured (`RAPIDSHYP_PICKUP_NAME=Gaur City`); auto-shipment on paid orders.
- **Email/OTP working** via Brevo SMTP (login `b6f9f9001@smtp-brevo.com`; "Confirm email"
  turned OFF so OTP sends the code). Lands in inbox.
- A real **₹79 live test order** went through (SC-2NEJH6, Paid).

**Open / nice-to-have (not blocking):**
- **Order-confirmation email** to the buyer after paying — offered, not built (Brevo SMTP is
  ready for it). This is the main next feature the user was weighing.
- **Verify the live order created a RapidShyp shipment** — check its order-detail modal for a
  RapidShyp id (was the one un-run live path).
- **Delete the ₹79 test order** + refund it (Razorpay) + cancel its shipment (RapidShyp).
- **Custom domain** (`sugandhacandles.com`) → better email deliverability (DKIM) + branding.
- `README.md` still describes the old catalogue — rewrite eventually.
- Marketing: user is weighing Google Ads (advised against for low-AOV; Instagram/Meta Ads +
  Shopping feed + bundles instead). No conversion tag (Google/Meta pixel) on the site yet.

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

- 2026-08-30 — **`offer-banner.tsx` — a real promotional banner on home, collections and all-products.** Replaces the thin `GiftProgress` card on those three pages (the card variant is now unused there; `compact` still runs under Add to Cart, and the cart/checkout keep `gift-banner.tsx`). Full-width gold card: eyebrow, display headline, body, CTA, and **three fanned photographs of the actual giftable candles**. Showing the real candles rather than a gift icon is deliberate — a shopper deciding whether ₹1,499 is worth stretching to needs to see what they get, and **Raghubir (JCP 2004)** found a gift presented without its own identity is valued *less* afterwards, which for a shop giving away its own candles quietly cheapens the range. Four states so it is never a stale promise: invitation → "₹X away" → "waiting" → "chosen", with progress as a 3px line across the base (`scaleX`). Names `line-clamp-2` rather than truncated — "Designer Lot…" defeats the point of showing them. **Current surface map:** sticky `GiftBar` (47px, in the header, all pages) · `OfferBanner` (home / collections / all-products) · `GiftProgress variant="compact"` (product page, under Add to bag) · `GiftBanner` (cart + checkout) · `GiftRibbon` (giftable product cards) · claim banner (giftable product pages).
- 2026-08-30 — **Sticky offer bar (`gift-bar.tsx`) — the announcement banner and the pinned progress are one element, not two.** Rendered **inside `SiteHeader`'s existing `sticky top-0 z-50` block**, so it pins with the header instead of guessing its height. Three states off one component: empty bag → "Free candle + a surprise gift on orders over ₹1,499"; shopping → "₹242 more for a free candle" with progress as a **hairline along the bottom edge** (costs no extra height, `scaleX` so it stays off the layout path); unlocked → "Free candle unlocked — Pick yours". Hides itself entirely once a candle is chosen, since it would only repeat what the bag already settled. **47px tall — inside the 44–48px budget NN/g's overlay research implies, and deliberately the only persistent element on the page** (no cookie banner, no newsletter pop-up, no sticky add-to-cart competing for a 375px screen). **No sheen on it**, unlike the card: a shimmer repeating forever on a strip that never leaves the screen reads as a flashing advert; the card earns that flourish because you scroll past it. **Dismissible, remembered per session** — re-showing something a shopper waved away is "nagging", a notified dark pattern in India. Dismissal state is read via `useSyncExternalStore` over sessionStorage (same approach as the cart) rather than set-state-in-an-effect, which eslint's `react-hooks/set-state-in-effect` correctly rejected. Server snapshot returns "dismissed", so the bar is absent from SSR HTML by design — **grepping the served HTML for it will always miss; verify in a browser**. Tested live: all three states, the 84% hairline at ₹1,257/₹1,499, and dismissal persisting across navigation.
- 2026-08-30 — **Free-candle card rebuilt as a designed, animated component; thresholds settled at gift ₹1,499 / delivery ₹2,000.** `GiftProgress` gained a `card` variant (home, all-products, collections) alongside the quiet `compact` line under Add to Cart — the compact one stays plain deliberately, since a decorated block beside the buy button competes with the thing the shopper came to press. **Built in CSS, no animation library:** `motion` v13 is ~683 kB unpacked and this is one banner on a shop whose buyers are mostly mid-range Android; everything used is either compositor-only (transform/opacity) or an `@property` custom property, Baseline since mid-2024. Progress fills with **`scaleX`, not `width`**, so it cannot trigger reflow mid-scroll. The sheen is slow (5.5s) and low-contrast with a long pause — a bright fast stripe reads as an advert, not as gold. Only the reward overshoots (`cubic-bezier(0.34,1.56,0.64,1)`); anticipation stops meaning anything if everything does it. **Bug caught in testing and worth remembering:** the entrance first used `animation … both`, which holds its opacity-0 first frame until the animation runs — so on a page where it never ran (element mounted inside a `display:none` subtree, throttled tab) the card painted its gold background with **nothing legible inside**. Rewritten as a transition out of `@starting-style`, where the resting state is the visible one; unsupported browsers just get no entrance. **Rule: never let content's visibility depend on an animation firing.** Thresholds: gift **₹1,499**, free delivery back to **₹2,000** — which restores the ladder (win the candle, then "add ₹501 more and delivery is free too"). Note the owner briefly set delivery free at ₹1,499; reverted because the **2 kg weight guard** means only a 3× Brass Tin basket could ever qualify — realistic ₹1,499 baskets weigh 5–8 kg. **Testing note:** the in-app browser pane paints unreliably on this site (React streams into a hidden `div#S:0` Suspense buffer and `Reveal` opacity-0 blocks can stay unpainted), so DOM queries must be scoped to `div.flex.min-h-dvh` and blank screenshots there are usually the pane, not the site — verify via `innerText` and computed styles instead.
- 2026-08-30 — **Free-gift offer rebuilt on CRO research; threshold ₹2,000 → ₹1,500; "imported" → "English fragrance".** Commissioned an evidence review (Baymard, NN/g, Kivetz JMR 2006, Chernev JCP 2015, Raghubir JCP 2004, India CCPA dark-pattern rules) and acted on it. **The threshold was structurally broken:** paid enquiries split into a retail cluster (₹299–₹1,700, all *below* ₹2,000) and a bulk cluster (₹4,323–₹33,000, all far above). So the offer nudged nobody — it was invisible to retail buyers, whose gap from a ~₹950 basket was ₹1,050, **more than the dearest candle in the shop (₹699)**, i.e. uncloseable with one add; while bulk buyers collected a free candle they never needed a nudge for. Threshold now **₹1,500** (gap from the median retail basket ≈ ₹550 = one mid-priced candle), written as a full `gift` object into `site_settings` — it had never been saved, so it was silently running on `DEFAULT_GIFT`. **Placement**: Baymard found up to **27% of shoppers never see a promotion that lives only in a site-wide banner**, and NN/g's banner-blindness work explains why, so the new `gift-progress.tsx` is styled as page content (no coloured full-bleed strip) and sits **under Add to Cart on the PDP** (highest-value placement — buyers must look there to proceed), plus above the grid on **collection and all-products pages**. **Post-reward reset** (Kivetz): purchasing collapses once a reward is collected, so the banner now offers the next real goal — free delivery — but *only* when the parcel is still under the weight cap, since dangling an unreachable goal is a false promise. **Choice overload** (Chernev — preference uncertainty is high for scent, and a dominant option raises purchase probability): the picker badges the `featured` candle **"Our pick"** — deliberately an editorial claim, **not** "Most loved", because a popularity claim must be provably true under the CCPA's false-urgency rule where **the burden of proof sits on the seller**. **Compliance**: audited against India's 13 notified dark patterns (CCPA 2023; enforcement live, ₹20 lakh penalties reported Aug 2026) — no countdowns, no fake scarcity, no confirm-shaming, threshold stated wherever the offer is stated (drip-pricing), and the free gift is a ₹0 line, which the guidelines explicitly exempt from basket sneaking. Note for later: **Raghubir's value-discounting effect** means giving away your own candles can lower their perceived worth — mitigated by always showing the gift at its true struck-through price, which the UI already does; never inflate it. Confetti kept as brand, not conversion — no credible evidence it moves commerce metrics. Copy: **"imported"** → **"English fragrance"** across code and live Supabase data, and the hero eyebrow "Wholesale Catalogue" → "Handmade soy candles".
- 2026-08-30 — **Email now required at checkout; gift banner moved above the bag on mobile.** (a) **Email was optional, which quietly created unreachable orders** — sign-in is email OTP, so a phone-only guest could never get back to their own receipt. Researched phone login for India properly first: **SMS OTP needs DLT registration with TRAI (~₹5,900 one-time + 3–7 days of paperwork + ~₹0.20/SMS)**, and **WhatsApp OTP avoids DLT but needs Meta business verification and a spare SIM** (the number is consumed by the WhatsApp Business API and can never be used on normal WhatsApp again) at ~₹0.17/login. Neither is worth it at this size, so the fix is to stop creating the problem: email is `required` in the form **and** rejected server-side in `startCheckout` (browser validation alone is not a control). Owner also considered a "sign in with just a phone number" button — **declined and explained**: with no OTP that is not a login, it is an open door, since Indian mobile numbers are sequentially guessable and each hit would expose a stranger's name and home address (cf. the Spree guest-order advisory; DPDP Act exposure). The safe equivalent, if ever wanted, is phone **+ the random order reference**. (b) On a phone the bag is one column, so the gift banner sat *below* the candle list — a buyer with six candles never scrolled to the one thing that makes them add a seventh. It is now its own grid child, first in DOM order, with explicit `lg:col-start-2 / row-start-1` putting it back at the top of the right-hand column on desktop (single instance — rendering it twice would double-fire the confetti effect). (c) Fixed **confetti firing on every cart visit**: the cart is read from localStorage after mount, so the first honest read looked like a threshold crossing; the banner now ignores that first observation. Added an aria-label to the surprise-gift card, which was a button with no accessible name. Verified on a real 375px viewport.
- 2026-08-30 — **Gift polish: real confetti, a surprise gift, and the checkout row that was missing.** (a) **Bug:** the free candle showed in the bag but not at checkout — `/cart` and `/checkout` were **statically prerendered**, so a page built before migration 021 had an empty `giftProducts` baked in and the gift silently vanished for up to the 60s revalidate window. Both are now `export const dynamic = "force-dynamic"`; they read the catalogue per request. (b) Replaced the hand-rolled CSS confetti with **`canvas-confetti` 1.9.4** (compared against react-confetti 220 kB, party-js 483 kB, tsparticles 1 MB — canvas-confetti is 92 kB unpacked with **zero dependencies**, and draws to one canvas rather than hundreds of DOM nodes, which is what keeps it smooth on the mid-range phones this shop's buyers use). It is **dynamically imported** in `lib/celebrate.ts`, so no one pays for the bundle on a page they never celebrate on; `celebrateUnlock` is a quick double burst, `celebrateGift` is two angled cannons plus a slow gold drift, both in the shop's palette (gold/ember, never rainbow) and both no-ops under `prefers-reduced-motion`. Deleted `components/confetti.tsx` and its keyframes. (c) **Surprise gift** added — `GiftConfig` gains `surpriseEnabled` + `surpriseLabel`, toggled in Settings → Free candle. It rides the same threshold, shows as its own FREE row in the bag, at checkout and inside the banner, and `startCheckout` writes it as a ₹0 line under the `surprise-gift` slug so it lands on the **admin packing list** (it is not a catalogue product — it is whatever gets packed that week). This is what makes the site match the reels' "ek free candle aur ek free gift". (d) Banner restyled off the flat pale green onto gold/ember gradients with a blurred gold bloom. **Confirmed the free candle already reaches the admin** — `toOrderItems` has no price filter, so ₹0 lines survive into Orders and into the RapidShyp shipment. 7 more logic tests (surprise on/off, offer off) all pass. tsc + eslint + build clean.
- 2026-08-30 — **Free candle offer: pick one free candle once the bag reaches ₹2,000.** Migration **`021-free-gift.sql`** adds `products.gift_eligible` (pre-ticked for everything ≤₹149). **Why a flag and not a price cap:** left open, every buyer picks the dearest candle — a ₹699 urli on a ₹2,000 bag is 35% off *plus* free delivery, i.e. a sale, not a gift; a flag also lets a candle leave the list the day it goes out of stock. New `lib/gift.ts` holds every rule (`giftUnlocked`, `amountToGift`, `resolveGift`, `eligibleGifts`) so the cart, checkout and server all answer identically. **Two exclusions are the crux:** the gift counts toward neither `subtotal` (or it would unlock itself) nor `weightGrams` (or a heavy gift would tip the parcel past the 2 kg guard and cancel the free delivery the buyer just earned) — it still ships, and fulfilment recomputes courier weight from the saved items. Cart stores the choice as a slug in its **own** localStorage key (`sugandha.gift.v1`), not as a ₹0 line, so no total/qty/weight sum has to remember to skip it and v1 carts stay readable. Server: `startCheckout` re-runs `resolveGift` against the catalogue and only then pushes a `unitPrice: 0` item — the browser's slug is never trusted. UI: `gift-banner.tsx` (four states — nudge with progress bar / just unlocked / chosen / about-to-be-lost) on both cart and checkout, `gift-picker.tsx` modal (giftable candles only + search — sending buyers to the full catalogue would read as bait), `gift-ribbon.tsx` shiny corner tag on eligible cards (client island; card stays a server component, config via `gift-context.tsx` set in the site layout to avoid drilling through every grid), a claim banner on the product page, and hand-rolled CSS confetti (`confetti.tsx`, ~30 divs, no dependency) that fires on unlock and on claim, disabled under `prefers-reduced-motion`. Admin: "Can be given free" toggle per product + a **Free candle** settings card (on/off + threshold). Verified with 12 logic tests against the real `gift.ts` — including the ₹699-urli grab, a ₹1,999 bag, unknown slugs and out-of-stock gifts, all refused. tsc + eslint + `next build` clean. **Run migration 021.**
- 2026-08-30 — **Reel Scripts admin section (`/admin/scripts`) + the first 5 scripts seeded.** New nav item (Clapperboard icon) between Customers and Products. Migration **`020-scripts.sql`** creates `reel_scripts` (admin-only RLS via `is_admin()`, `updated_at` trigger) and seeds the five Hinglish reel scripts with posting slots. **Design decision that matters for the future agent:** `hook` is its own column (never buried in `body`) and the engagement metrics (`views/reach/likes/comments/shares/saves/follows`) are **nullable, not 0-default** — blank means "not measured yet", and defaulting to zero would poison any later "which hook worked" analysis. That hook-plus-outcome pairing is the training set for the planned AI script writer; `source` ('manual'|'ai') marks who wrote each one. Files: `lib/admin/script-status.ts` (statuses, CTA options, `countWords`/`estimateDuration` at ~3.1 w/s), `listScripts`/`getScript` + `AdminScript` in `queries.ts` (returns **null** when 020 isn't run, so the page says "run the migration" — same trick as `listOrders`), `saveScript`/`markScriptPosted`/`deleteScript` in `actions.ts`, `components/admin/script-form.tsx`, and `admin/(dash)/scripts/{page,new,[id]}`. **Times are handled as IST explicitly** (`datetime-local` has no zone; parsed with a `+05:30` suffix and rendered back with an IST shift) or a 7:30 pm reel would land at 1 am on a UTC host. List splits into "Coming up" (soonest first) and "Already posted" (latest first) with a one-click **Mark posted** that stamps `posted_at`. Schedule chosen: Australia order Mon 31 Aug 7:30pm → 40 hampers Wed 2 Sep 1pm → 52 candles Thu 3 Sep 7:30pm → Annaprashan Sat 5 Sep 12:30pm → Free candle offer Sun 6 Sep 8pm (story reels first to build reach, the pure offer last onto a warmed audience; the two "Comment FREE" reels held 2 days apart). tsc + eslint + `next build` clean. **Migration 020 still needs running in Supabase** — until then the page shows the run-the-migration notice.

- 2026-08-29 — **RapidShyp shipments now auto-approve (fixes "not showing in portal").** Diagnosed via the read-only `get_orders_info` API that every shipment we create landed in **`APPROVAL_PENDING`** (no shipment line, no AWB, hidden from the main portal list) — RapidShyp needs a separate **approve** step after create. Added `approveRapidshypOrder()` in `rapidshyp.ts` (`POST …/approve_orders`, body `{order_id:[ref], store_name:"DEFAULT"}`, note its reply status is lowercase `success` unlike create's `SUCCESS`) and call it right after create inside `createRapidshypShipment`; also doubles as recovery — if create reports a duplicate, approving the already-created order still moves it to ready-to-ship. Now returns ok when create **or** approve succeeded. Added a **confirmation popup** (modal) to `booking-ship-button.tsx` on create ("Shipment created" / error), refreshing the list on success so the row flips to the "Shipment made" pill. Fixed the 2 stuck live orders: **Rajni** `ENQ-17A14343` approved via API (now PROCESSING, shipment `S2608728981`); **Nithya** `ENQ-23D04E40` left pending and its `bookings.rapidshyp_order_id` **cleared** so the owner can re-create it and see the new flow. (Retail auto-shipment is still live-mode only; this approve step rides inside the shared `createRapidshypShipment`, so paid orders get it too.) tsc + eslint clean. **Not yet pushed/deployed** — deploy for the fix to take effect on candles-catalogue.vercel.app.

- 2026-08-28 — **Customers = all buyers (incl. phone-only guests); nav loaders; 30s resend.** Rebuilt `/admin/customers` to aggregate paid buyers from **orders keyed by phone** (so guests with no email/account show up, e.g. Ram), merged with registered accounts (Account vs Guest badge, order count + spend). Added `loading.tsx` for `(site)` and `admin/(dash)` so navigation shows a spinner instead of freezing. OTP resend cooldown 60→30s (matches Supabase's per-user interval). Also: SMTP finally working via **Brevo** (login was `b6f9f9001@smtp-brevo.com`, not the Gmail) + turned OFF "Confirm email" in Supabase so OTP sends the code template, not a confirm-signup link. Deployed (commit 2fe80c3).
- 2026-08-27 — **Fixed privacy bug: `/account` showed the admin ALL orders.** `getMyOrders` relied on RLS to scope, but the owner is an admin and the "orders admin read" policy grants every row — so the owner saw guest orders (e.g. Ram's phone-only order) on their personal account page. Added an explicit `.eq("user_id", user.id)` filter. Not a leak to real customers (non-admins are scoped by RLS own-read), just the admin over-seeing. Deployed (commit ba390d5). Also clarified: guest checkout (no email/login) creates NO account, so such buyers appear in Admin→Orders but not Admin→Customers.
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
