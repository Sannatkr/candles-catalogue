-- 035 — Terms page: courier delays, no refunds, unboxing video for breakage (2026-10-24).
--
-- Rewrites two sections of the Terms & Payment page (site_settings.data->termsSections):
--   "Packing and shipping"  — adds: once dispatched, courier delays are not our
--                              responsibility and delivery dates are not guaranteed.
--   "Breakage and returns"  — adds: no refunds after dispatch; broken pieces are
--                              replaced only with an unboxing video.
-- Every other section is left exactly as it is. Nothing else in site_settings changes.
--
-- Run in the Supabase SQL Editor. Shop pages cache up to 1 h; a push clears it.

update public.site_settings
set data = jsonb_set(
  data,
  '{termsSections}',
  (
    select jsonb_agg(
      case s.value->>'heading'
        when 'Packing and shipping' then jsonb_build_object(
          'heading', 'Packing and shipping',
          'body', jsonb_build_array(
            'Every piece is bubble-wrapped and packed in corrugated cartons with corner protection.',
            'Brass and glass pieces are foam-nested on top of that.',
            'Freight is at your account, or we arrange it and bill at actuals.',
            'Once the parcel is handed to the courier, delivery is in the courier''s hands. We do not guarantee a delivery date and are not responsible for courier delays.',
            'Transit insurance is available on request and worth it on brass urli orders.'
          )
        )
        when 'Breakage and returns' then jsonb_build_object(
          'heading', 'Breakage and returns',
          'body', jsonb_build_array(
            'There are no refunds once an order has been dispatched.',
            'We replace only pieces that arrive broken. To claim, send a clear unboxing video that shows the sealed parcel being opened and the damage, within 48 hours of delivery. Photos alone are not accepted.',
            'Verified breakage is replaced free in your next dispatch. Money is not refunded.',
            'We do not accept returns for change of mind, or on custom and private-label production.'
          )
        )
        else s.value
      end
      order by s.ordinality
    )
    from jsonb_array_elements(data->'termsSections') with ordinality as s(value, ordinality)
  )
)
where id = 1;

-- Check: the two rewritten sections.
select s.value->>'heading' as heading, s.value->'body' as body
from public.site_settings,
     jsonb_array_elements(data->'termsSections') as s(value)
where id = 1
  and s.value->>'heading' in ('Packing and shipping', 'Breakage and returns');

-- ---------------------------------------------------------------------------
-- UNDO: puts back the wording that was live before this change.
-- ---------------------------------------------------------------------------
-- update public.site_settings
-- set data = jsonb_set(
--   data,
--   '{termsSections}',
--   (
--     select jsonb_agg(
--       case s.value->>'heading'
--         when 'Packing and shipping' then jsonb_build_object(
--           'heading', 'Packing and shipping',
--           'body', jsonb_build_array(
--             'Every piece is bubble-wrapped and packed in corrugated cartons with corner protection.',
--             'Brass and glass pieces are foam-nested on top of that.',
--             'Freight is at your account, or we arrange it and bill at actuals.',
--             'Transit insurance is available on request and worth it on brass urli orders.'
--           )
--         )
--         when 'Breakage and returns' then jsonb_build_object(
--           'heading', 'Breakage and returns',
--           'body', jsonb_build_array(
--             'Report transit breakage within 48 hours of delivery with photographs of the outer carton and the damaged pieces.',
--             'Verified breakage is replaced free in your next dispatch.',
--             'We do not accept returns for change of mind, or on custom and private-label production.'
--           )
--         )
--         else s.value
--       end
--       order by s.ordinality
--     )
--     from jsonb_array_elements(data->'termsSections') with ordinality as s(value, ordinality)
--   )
-- )
-- where id = 1;
