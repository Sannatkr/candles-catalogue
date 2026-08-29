-- Sugandha Candles — update 020.
-- Reel scripts: what to shoot, when to post it, and how it actually did.
--
-- This is a writing desk, not a CMS. A script is written once, shot, posted,
-- and then — the part that matters — its numbers get typed back in. Those
-- numbers are the whole point: hook + engagement, side by side, row after row,
-- is the training set for the script-writing agent that comes later. Without
-- the outcome column an AI writer can only copy the style; with it, it can copy
-- what worked.
--
-- Hence the split: `hook` is its own column, never buried inside `body`. The
-- hook is the one line that decides whether a reel is watched at all, so it is
-- the one line worth querying, sorting and learning from on its own.
--
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.

create extension if not exists "pgcrypto";

create table if not exists public.reel_scripts (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  title text not null,

  -- The opening line, kept separate on purpose (see above).
  hook   text not null default '',
  body   text not null default '',
  -- The words that sit on the video itself, usually an arrow-separated beat list.
  on_screen_text text not null default '',
  -- Shoot reminders: what to blur, what to count, what to keep fast.
  notes  text not null default '',
  -- The ask. "DM", "Comment FREE", "Comment WEBSITE" — a plain label, because
  -- the useful question later is "which ask pulled best", not "which enum".
  cta    text not null default '',

  status text not null default 'draft'
    check (status in ('draft','scheduled','posted','archived')),

  -- When it should go out; filled in the moment it actually does.
  scheduled_at timestamptz,
  posted_at    timestamptz,
  permalink    text,

  duration_sec int not null default 0,
  word_count   int not null default 0,

  -- Typed back in from Instagram once the reel has run a few days. Null, not
  -- zero, while unknown — a reel with no data yet is not a reel that got 0 views,
  -- and averaging those two together would poison every lesson drawn from it.
  views    int,
  likes    int,
  comments int,
  shares   int,
  saves    int,
  reach    int,
  follows  int,

  -- 'manual' now; 'ai' once the agent starts drafting these.
  source text not null default 'manual'
);

create index if not exists reel_scripts_status_idx    on public.reel_scripts (status);
create index if not exists reel_scripts_scheduled_idx on public.reel_scripts (scheduled_at);

-- Keeps `updated_at` honest without every caller having to remember it.
create or replace function public.touch_reel_script()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists reel_scripts_touch on public.reel_scripts;
create trigger reel_scripts_touch
  before update on public.reel_scripts
  for each row execute function public.touch_reel_script();

-- Admin-only, all of it. These are unposted ideas and private performance
-- numbers; nothing here is ever read by the storefront.
alter table public.reel_scripts enable row level security;

drop policy if exists "reel scripts admin all" on public.reel_scripts;
create policy "reel scripts admin all" on public.reel_scripts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

/* ----------------------------------------------- the first five scripts -- */
-- Fixed ids so re-running this file never duplicates them. Scheduled across the
-- week of 1 Sep 2026 in IST: the two "Comment FREE" reels are held apart, and
-- the pure offer reel goes last, once four story reels have warmed the audience.

insert into public.reel_scripts
  (id, title, hook, body, on_screen_text, notes, cta, status, scheduled_at, duration_sec, word_count)
values
  (
    'a1000000-0000-4000-8000-000000000005',
    'The Australia order',
    $h$12 hazaar ka order — aur usse Australia tak jaana tha. Ek galat packing, aur sab barbaad.$h$,
    $b$Order tha 10 peacock urli candles aur 10 festive lotus urli bowl. Ek client jo ye Australia ship krne wali thi.

Unka ek hi sawaal tha — "damage toh nahi hoga na?" Maine 5 ply plus 5 ply, total 10 ply packing ki. Andar maine multiple bubble wrap kr diya.

Do din mein sab ready. Par delivery ke waqt porter was asking for ₹1,156. Client ko laga bahut zyada hai — and I said, don't worry, main kar dungi. Aur 18 km khud jaakar deliver kar aayi.

Do din ki mehnat delivery charge pe nahi rukni chahiye thi.

Har order pe ek free candle aur ek free gift. Comment mein FREE likho, main link bhej dungi.$b$,
    $o$₹12,000 → Australia → 10 ply packing → ₹1,156 delivery → 18 km khud → Comment: FREE$o$,
    $n$Blur the porter screenshot addresses. Keep the packing section fast so the reel peaks on the 18 km, not the middle.$n$,
    'Comment FREE',
    'scheduled', '2026-08-31 19:30+05:30', 43, 133
  ),
  (
    'a1000000-0000-4000-8000-000000000001',
    '40 return gift hampers',
    $h$Ye order deliver hi nahi hua — meri client khud hi lene aa gayi.$h$,
    $b$Toh hua ye ki ek doctor ne apne bete ke 1st birthday ke liye return gifts mangwaye the. And in every box there are 6 items — one teddy candle, one doggy candle, one concrete platter, one crochet flower pot, and last thank you card.

And total 40 boxes. Har ek maine khud pack kiya, ribbon bhi khud baandhi.

Aur jis din ready hue, unhone call karke bola — "main abhi free hoon, main khud aa jaati hoon." Wo meri poori mehnat ka answer tha.

Agar aapko bhi corporate, birthday, shaadi, baby shower ya kisi event ke return gifts ke liye candles ya candle hampers customise krwane ho to mujhe DM kar do, or you can buy from website too.$b$,
    $o$Ye order deliver hi nahi hua → 6 items per box → 40 boxes → Client khud lene aa gayi$o$,
    $n$Keep the child's name on the thank-you cards off screen. Count the boxes before you say 40.$n$,
    'DM / website',
    'scheduled', '2026-09-02 13:00+05:30', 43, 134
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    '52 candles in 16 days',
    $h$52 candles. 16 days. Aur festive season ka sabse busy week.$h$,
    $b$Mumbai se ek client ko return gifts chahiye the — apne guests ke gift bags ke liye. Unhone poochha, "25 August tak ho jayega?"

Mere paas pehle se orders the. Par maine haan bol diya.

Peacock urli, festive urli, sunflower, hibiscus, aur lotus platters ke saath — 52 pieces, 5 different designs.

16 days mile the. Maine 6 day mein tayyar kar diye. Three 10kg boxes, Delhi se Mumbai.

And when it reached, unka message aaya — "opened one, very nice, smells good." And you know what, such review always make me calm.

Aapko bhi return gifts chahiye to abhi order karo. Har order pe ek free candle aur ek free gift v. Comment "FREE", I will send you the link.$b$,
    $o$52 candles → 16 din → 6 din mein ready → 3 boxes · Delhi to Mumbai → Comment: FREE$o$,
    $n$Confirm 10kg vs 11kg. Runs ~40 sec — cutting the product list line brings it to ~38.$n$,
    'Comment FREE',
    'scheduled', '2026-09-03 19:30+05:30', 43, 132
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Annaprashan charan candles',
    $h$Ye card main ek simple "thank you" sticker se badal sakti thi — aur shayad kisi ko farak bhi nahi padta.$h$,
    $b$Par ye Annaprashan ka order tha. 40 charan candles, ek bacche ki pehli ceremony ke liye.

Toh box ka thankyou card alag se design karwaya — usme bacche ka naam and pyaara sa illustrations. Sirf us ek din ke liye. Sirf us ek bacche ke liye.

Aur candle toh dekho — square platter pe gold rim, upar gold sprinkles, aur beech mein chhote se charan. Poora set white aur gold mein.

Ye wo cheez hai jo log ceremony ke baad bhi sambhal ke rakh lete hain. Jala hi nahi paate.

Aisa custom candles hamper banwana ho to DM karo.$b$,
    $o$Ek sticker se bhi kaam chal jaata → Har card custom design hua → 40 boxes → Log ise jalate hi nahi. Rakh lete hain.$o$,
    $n$Blur the baby's name on the card. Spend more time on the card than feels natural — that is the whole argument.$n$,
    'DM',
    'scheduled', '2026-09-05 12:30+05:30', 39, 120
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Free candle offer',
    $h$Free me candles chiye — aur wo free candle aap khud decide kroge, main nahi.$h$,
    $b$Jldi se website pe jaakr order karo ya DM se order book kro, dono pe chalega.

Aur sirf free candle nahi — uske saath ek free gift bhi milega.

Comment mein WEBSITE likh do — main sab bhej dungi.$b$,
    $o$FREE CANDLE → Aap khud decide kroge → + ek free gift → Comment: WEBSITE$o$,
    $n$Optional tweak — make the last line "Link chahiye? Comment mein WEBSITE likh do" so commenting has a job. Have the free gift ready before posting. Reply to every comment within the first hour.$n$,
    'Comment WEBSITE',
    'scheduled', '2026-09-06 20:00+05:30', 17, 54
  )
on conflict (id) do nothing;
