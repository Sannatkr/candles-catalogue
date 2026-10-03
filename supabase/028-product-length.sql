-- 028: a length for rectangular pieces (wax sachets, boxes).
--
-- Sizes are typed in inches in the admin and stored in centimetres, like
-- height_cm and diameter_cm. diameter_cm now reads as "width" in the admin;
-- the column keeps its name so nothing else has to move. 0 = not recorded.
--
-- Safe to run more than once.

alter table public.products
  add column if not exists length_cm numeric default 0;
