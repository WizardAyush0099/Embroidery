-- ============================================================================
-- Atelier Brodé — Supabase schema
-- Run this once in the Supabase SQL editor (or with `supabase db push`).
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Admin allow-list
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  email text primary key,
  full_name text,
  created_at timestamptz not null default now()
);

-- The store owner's Google account. Add or remove addresses here to change access.
insert into public.admin_users (email)
values ('ayushdanthta@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  fabric_label text,
  technique text,
  stitch_count integer,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  category_id uuid references public.categories (id) on delete set null,
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  colors jsonb not null default '[]'::jsonb, -- [{ "name": "Washed Noir", "hex": "#202020" }]
  size_stock jsonb not null default '{}'::jsonb, -- { "S": 4, "M": 8 }
  stock integer not null default 0,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_published boolean not null default true,
  is_customisable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_published_idx on public.products (is_published);
create index if not exists products_featured_idx on public.products (is_featured);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start with 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  shipping_address jsonb not null default '{}'::jsonb,
  subtotal numeric(10, 2) not null default 0,
  shipping_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'cod'
    check (payment_method in ('razorpay', 'cod', 'bank_transfer')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  proof_preference text not null default 'digital'
    check (proof_preference in ('digital', 'trust_artisan')),
  razorpay_order_id text,
  razorpay_payment_id text,
  notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_user_idx on public.orders (user_id);

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  slug text,
  image text,
  size text,
  color text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null,
  embroidery_text text,
  placement text,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Custom embroidery requests
-- ---------------------------------------------------------------------------
create sequence if not exists public.request_number_seq start with 501;

create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  garment_name text,
  garment_id uuid references public.products (id) on delete set null,
  size text,
  color text,
  custom_text text,
  font_style text,
  thread_color text,
  placement text,
  description text,
  reference_images text[] not null default '{}',
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'quoted', 'approved', 'in_production', 'completed', 'declined')),
  quote_amount numeric(10, 2),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_requests add column if not exists thread_color text;

create index if not exists custom_requests_status_idx on public.custom_requests (status);

create or replace function public.next_request_number()
returns text
language sql
as $$
  select 'CR-' || to_char(now(), 'YY') || '-' ||
    lpad(nextval('public.request_number_seq')::text, 4, '0');
$$;

alter table public.custom_requests
  alter column request_number set default public.next_request_number();

drop trigger if exists custom_requests_touch_updated_at on public.custom_requests;
create trigger custom_requests_touch_updated_at
  before update on public.custom_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Store settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'Atelier Brodé',
  contact_email text not null default 'concierge@atelierbrode.in',
  contact_phone text not null default '+91 98200 00000',
  address text not null default 'Atelier House, Kala Ghoda, Mumbai 400001, India',
  instagram text default '@atelierbrode',
  shipping_fee numeric(10, 2) not null default 250,
  free_shipping_threshold numeric(10, 2) not null default 25000,
  announcement text default 'Complimentary bespoke hand monogramming on orders above ₹25,000 · Pure handcraft by master karigars',
  cod_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Gazette newsletter
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop trigger if exists store_settings_touch_updated_at on public.store_settings;
create trigger store_settings_touch_updated_at
  before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_requests enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "admin users can read own row" on public.admin_users;
create policy "admin users can read own row" on public.admin_users
  for select using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_admin()
  );

drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories for select using (true);
drop policy if exists "admins write categories" on public.categories;
create policy "admins write categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "published products are public" on public.products;
create policy "published products are public" on public.products
  for select using (is_published or public.is_admin());
drop policy if exists "admins write products" on public.products;
create policy "admins write products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers read own orders" on public.orders;
create policy "customers read own orders" on public.orders
  for select using (public.is_admin() or (user_id is not null and user_id = auth.uid()));
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers read own order items" on public.order_items;
create policy "customers read own order items" on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id is not null
        and o.user_id = auth.uid()
    )
  );
drop policy if exists "admins write order items" on public.order_items;
create policy "admins write order items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers read own requests" on public.custom_requests;
create policy "customers read own requests" on public.custom_requests
  for select using (
    public.is_admin() or (user_id is not null and user_id = auth.uid())
  );
drop policy if exists "admins update requests" on public.custom_requests;
create policy "admins update requests" on public.custom_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings are public" on public.store_settings;
create policy "settings are public" on public.store_settings for select using (true);
drop policy if exists "admins write settings" on public.store_settings;
create policy "admins write settings" on public.store_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Atomic checkout
-- Prices and stock are taken from the database, never from the browser.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text default 'cod',
  p_user_id uuid default null,
  p_notes text default null,
  p_proof_preference text default 'digital'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product record;
  v_qty integer;
  v_size text;
  v_available integer;
  v_size_stock jsonb;
  v_total_stock integer;
  v_subtotal numeric(10, 2) := 0;
  v_shipping numeric(10, 2) := 0;
  v_threshold numeric(10, 2);
  v_fee numeric(10, 2);
  v_settings public.store_settings;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  select * into v_settings from public.store_settings where id = 1;
  v_fee := coalesce(v_settings.shipping_fee, 0);
  v_threshold := coalesce(v_settings.free_shipping_threshold, 0);

  v_order_number := 'AB-' || to_char(now(), 'YY') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, shipping_address,
    status, payment_method, payment_status, proof_preference, notes,
    subtotal, shipping_fee, total
  )
  values (
    v_order_number,
    p_user_id,
    coalesce(p_customer ->> 'name', 'Patron'),
    coalesce(p_customer ->> 'email', ''),
    coalesce(p_customer ->> 'phone', ''),
    coalesce(p_customer -> 'address', '{}'::jsonb),
    'pending',
    coalesce(p_payment_method, 'cod'),
    'pending',
    coalesce(p_proof_preference, 'digital'),
    p_notes,
    0, 0, 0
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((v_item ->> 'quantity')::integer, 1));
    v_size := nullif(v_item ->> 'size', '');

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
      and is_published
    for update;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE:%', coalesce(v_item ->> 'product_id', '');
    end if;

    v_size_stock := coalesce(v_product.size_stock, '{}'::jsonb);

    if v_size is not null and (v_size = any(v_product.sizes)) then
      v_available := coalesce((v_size_stock ->> v_size)::integer, 0);
    else
      v_available := coalesce(v_product.stock, 0);
      v_size := coalesce(v_size, 'One Size');
    end if;

    if v_available < v_qty then
      raise exception 'INSUFFICIENT_STOCK:%:%', v_product.name, v_size;
    end if;

    if v_size is not null and (v_size = any(v_product.sizes)) then
      v_size_stock := jsonb_set(v_size_stock, array[v_size], to_jsonb(v_available - v_qty), true);
      select coalesce(sum(value::integer), 0)
        into v_total_stock
        from jsonb_each_text(v_size_stock);
    else
      v_total_stock := greatest(0, coalesce(v_product.stock, 0) - v_qty);
    end if;

    update public.products
      set size_stock = v_size_stock,
          stock = v_total_stock
      where id = v_product.id;

    insert into public.order_items (
      order_id, product_id, name, slug, image, size, color, quantity,
      unit_price, line_total, embroidery_text, placement
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.slug,
      coalesce(v_product.images[1], null),
      v_size,
      nullif(v_item ->> 'color', ''),
      v_qty,
      v_product.price,
      v_product.price * v_qty,
      nullif(v_item ->> 'embroidery_text', ''),
      nullif(v_item ->> 'placement', '')
    );

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  if v_threshold > 0 and v_subtotal >= v_threshold then
    v_shipping := 0;
  else
    v_shipping := v_fee;
  end if;

  update public.orders
    set subtotal = v_subtotal,
        shipping_fee = v_shipping,
        total = v_subtotal + v_shipping
    where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping,
    'total', v_subtotal + v_shipping
  );
end;
$$;

-- Postgres grants EXECUTE to PUBLIC implicitly, so PUBLIC must be revoked too:
-- otherwise any browser holding the publishable key could create orders directly.
revoke all on function public.place_order(jsonb, jsonb, text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, text, uuid, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 8388608,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('custom-references', 'custom-references', false, 8388608,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product images are public" on storage.objects;
create policy "product images are public" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admins manage product images" on storage.objects;
create policy "admins manage product images" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins read custom references" on storage.objects;
create policy "admins read custom references" on storage.objects
  for select using (bucket_id = 'custom-references' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Privileges (RLS still restricts every row)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Categories seed
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order) values
  ('Heavyweight Hoodies', 'heavyweight-hoodies', '450–500 GSM fleece engineered for high-density needlework', 1),
  ('Sweatshirts', 'sweatshirts', 'Archival French terry crewnecks and boxy silhouettes', 2),
  ('Oversized T-Shirts', 'oversized-t-shirts', 'Long-staple cotton jersey with botanical monograms', 3),
  ('Structured Caps', 'structured-caps', 'Six-panel brushed twill with 3D puff embroidery', 4),
  ('Accessories & Linen', 'accessories-linen', 'Raw Belgian flax overshirts and atelier accessories', 5)
on conflict (slug) do nothing;
