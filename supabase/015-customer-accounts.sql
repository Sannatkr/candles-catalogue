-- Sugandha Candles — update 015.
-- Lets a buyer see their own orders, without ever having registered first.
--
-- The trick is that an order already carries the email it was placed with. So
-- an account is not something a buyer creates — it is something that turns out
-- to already exist the first time they prove they own that address. Someone who
-- checked out as a guest in October logs in for the first time in December and
-- finds October's order waiting for them.
--
-- Run 014-admin-lockdown.sql BEFORE this one.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

alter table public.orders   add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.bookings add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_user_idx    on public.orders (user_id);
create index if not exists orders_email_idx   on public.orders (lower(email));
create index if not exists bookings_user_idx  on public.bookings (user_id);

-- --------------------------------------------------------------- claiming ---

/**
 * Attaches every order placed with the caller's own email address.
 *
 * SECURITY DEFINER because it has to look at rows the caller cannot yet see —
 * that is the entire point. The safety comes from auth.email(), which is read
 * from the verified session and can never be passed in: there is no argument to
 * this function, so there is nothing to forge. A caller can only ever claim
 * addresses they have just proved they control by entering a one-time code.
 *
 * Rows already claimed by somebody else are left alone.
 */
create or replace function public.claim_my_orders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me    uuid := auth.uid();
  mine  text := lower(coalesce(auth.email(), ''));
  moved integer := 0;
begin
  if me is null or mine = '' then
    return 0;
  end if;

  update public.orders
     set user_id = me
   where user_id is null
     and lower(email) = mine;
  get diagnostics moved = row_count;

  update public.bookings
     set user_id = me
   where user_id is null
     and lower(coalesce(buyer_contact, '')) = mine;

  return moved;
end;
$$;

revoke all on function public.claim_my_orders() from public;
grant execute on function public.claim_my_orders() to authenticated;

-- ------------------------------------------------------------------- rls ----
-- Admins keep the blanket read from 014. This adds a second, much narrower
-- door: a signed-in customer may read the rows that are theirs and nothing
-- else. Two separate policies rather than one combined condition, because
-- Postgres ORs permissive policies together and keeping them apart means
-- neither can accidentally widen the other.

drop policy if exists "orders own read" on public.orders;
create policy "orders own read" on public.orders
  for select to authenticated
  using (user_id is not null and user_id = auth.uid());

drop policy if exists "bookings own read" on public.bookings;
create policy "bookings own read" on public.bookings
  for select to authenticated
  using (user_id is not null and user_id = auth.uid());

-- Deliberately no update or delete for customers. A buyer can read their order
-- history; changing it, cancelling it or removing it stays a conversation with
-- you, not a button they can press.
