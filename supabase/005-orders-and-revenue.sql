-- Sugandha Candles — update 005.
-- Order statuses through to payment, where a booking came from, and the
-- delivery state. Includes everything from 004, so running this alone is enough.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

-- ------------------------------------------------------------- new columns ---

alter table public.bookings add column if not exists state   text;
alter table public.bookings add column if not exists paid_at timestamptz;

-- 'website' for orders placed on the site, 'manual' for ones Sannat adds himself.
alter table public.bookings
  add column if not exists source text not null default 'website';

-- The booking form no longer asks for a name.
alter table public.bookings alter column buyer_name drop not null;

-- Manual bookings have no buyer contact to speak of either.
alter table public.bookings alter column buyer_contact drop not null;

-- ---------------------------------------------------------------- statuses ---
-- new → contacted → paid → fulfilled, with cancelled as the dead end.
-- Revenue counts anything that has reached paid or fulfilled.

alter table public.bookings drop constraint if exists bookings_status_check;

update public.bookings set status = 'paid'      where status = 'confirmed';
update public.bookings set status = 'fulfilled' where status = 'closed';

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('new','contacted','paid','fulfilled','cancelled'));

alter table public.bookings drop constraint if exists bookings_source_check;
alter table public.bookings
  add constraint bookings_source_check check (source in ('website','manual'));

create index if not exists bookings_status_idx  on public.bookings (status);
create index if not exists bookings_paid_at_idx on public.bookings (paid_at desc);

-- ----------------------------------------------------------------- cleanup ---

delete from public.bookings where buyer_name like 'diag%';
