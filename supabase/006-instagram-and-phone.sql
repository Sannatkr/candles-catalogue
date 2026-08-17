-- Sugandha Candles — update 006.
-- Instagram handle is the required contact; phone is optional alongside it.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.bookings add column if not exists phone text;

comment on column public.bookings.buyer_contact is 'Instagram handle, without the @';

-- Clears the rows left behind while testing the booking flow.
delete from public.bookings
where product_slug in ('probe', 'probe2', 't', 't2')
   or buyer_name like 'diag%'
   or buyer_contact in ('riya.decor', '@riya.decor');
