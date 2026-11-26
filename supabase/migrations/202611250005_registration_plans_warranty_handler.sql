alter table public.reseller_pricelists alter column file_path drop not null;
alter table public.reseller_pricelists add column external_url text;
alter table public.reseller_pricelists add constraint reseller_pricelist_source check (file_path is not null or external_url is not null);

create table public.product_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  description text,
  reseller_price numeric(14,2) not null check (reseller_price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_plans_product_idx on public.product_plans(product_id, sort_order);
create trigger set_updated_at before update on public.product_plans for each row execute function public.set_updated_at();
alter table public.product_plans enable row level security;
create policy "active plans authenticated" on public.product_plans for select to authenticated using (is_active or public.is_admin());
create policy "admin plans" on public.product_plans for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter type public.claim_status add value if not exists 'processing';
alter table public.warranty_responses add column handled_by_name text;
