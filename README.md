# Sugandha Candles — catalogue site

A link you send to a client. They see the full range with photos, sizes, price slabs and your
trade terms. No cart, no checkout.

You add products from `/admin`. Nothing needs to be deployed again after the first time.

---

## Run it on your laptop

```bash
npm install
npm run dev
```

Open http://localhost:3000

Until Supabase is connected, the site runs on sample candles so it never looks empty.

---

## One-time setup (about 15 minutes)

### 1. Make the database

1. Go to [supabase.com](https://supabase.com) → sign in with Google → **New project**.
2. Any name. Save the database password somewhere. Region: **Mumbai** or **Singapore**.
3. Wait ~2 minutes for it to finish setting up.

### 2. Create the tables

1. In Supabase, open **SQL Editor** in the left menu.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this project, copy everything.
3. Paste into the SQL editor and press **Run**. It is safe to run more than once.

### 3. Connect the site to the database

1. In Supabase: **Project Settings → API**.
2. Copy the **Project URL** and the **publishable** key (`sb_publishable_…`). On older projects this
   is called the **anon public** key — either works.
3. In this project, copy `.env.example` to `.env.local` and paste both values in.
4. Stop the server (Ctrl+C) and run `npm run dev` again.

### 4. Make your login

Supabase → **Authentication → Users → Add user**. Use your email and a password you will remember.
That is now the login for `/admin`.

Visit http://localhost:3000/admin and sign in.

---

## Putting it online

1. Push this folder to a new **private** repository on GitHub.
2. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **Add New Project** → pick the repo.
3. Before clicking Deploy, open **Environment Variables** and add the same two values from
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. About two minutes later you get a link like `sugandha-candles.vercel.app`.

That is the link you send to clients.

### Adding your own domain later

Vercel → your project → **Settings → Domains** → type your domain → Vercel shows two DNS records to
paste wherever you bought the domain. Live in about 10 minutes.

---

## Day-to-day

Everything happens at `yoursite.com/admin`:

| What you want to do | Where |
| --- | --- |
| Add or edit a candle | Products → Add candle |
| Change a price or a slab | Products → Edit → Pricing |
| Group candles differently | Collections |
| Change payment terms, lead time, breakage policy | Settings & terms |
| Change your Instagram handle, address, email | Settings & terms → Contact |

Changes are live the second you press Save. **You never deploy again.**

---

## Sending one collection to a client

Every collection has its own link, for example:

```
https://yoursite.com/collections/signature-jars
```

Send that instead of the home page when a buyer only cares about one part of the range.

---

## Notes

- Prices are shown per piece and marked "excl. GST" throughout.
- Photos are stored in Supabase Storage and served from their CDN. Keep each under 8 MB.
- The sample candles in `src/lib/seed.ts` show only until Supabase is connected. Once it is, the site
  shows exactly what is in your database — nothing invented.
