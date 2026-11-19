-- Display order for the storefront catalogue.
-- Lower numbers appear first; 0 (the default) means "unspecified", so a newly
-- added garment floats to the top of the unnumbered group.
alter table public.products
  add column if not exists sort_order integer not null default 0;

create index if not exists products_sort_idx
  on public.products (sort_order, created_at desc);

-- Photography is written by the service role only (Clerk owns identity, so
-- public.is_admin() cannot see a storefront session). Drop the dead policies.
drop policy if exists "admins manage product images" on storage.objects;
drop policy if exists "admins read custom references" on storage.objects;
