create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','reseller');
create type public.claim_status as enum ('submitted','reviewing','approved','rejected','completed');
create type public.menu_action as enum ('internal','external','telegram','custom');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role user_role not null default 'reseller',
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reseller_details (id uuid primary key default gen_random_uuid(), user_id uuid unique not null references public.profiles(id) on delete cascade, ba_name text not null, ba_start_year integer not null check(ba_start_year between 2000 and extract(year from now())::integer), sales_username text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.reseller_testimonials (id uuid primary key default gen_random_uuid(), reseller_id uuid not null references public.reseller_details(id) on delete cascade, file_path text, external_url text, description text, evidence_date date, created_at timestamptz not null default now(), check(file_path is not null or external_url is not null));
create table public.reseller_pricelists (id uuid primary key default gen_random_uuid(), reseller_id uuid not null references public.reseller_details(id) on delete cascade, file_path text not null, created_at timestamptz not null default now());
create table public.product_categories (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null check(slug ~ '^[a-z0-9-]+$'), sort_order integer not null default 0, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid references public.product_categories(id) on delete set null, name text not null, slug text unique not null check(slug ~ '^[a-z0-9-]+$'), description text, image_path text, reseller_price numeric(14,2) not null check(reseller_price >= 0), is_active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.menus (id uuid primary key default gen_random_uuid(), title text not null, description text, icon text, action_type menu_action not null, target_url text, is_active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.banners (id uuid primary key default gen_random_uuid(), title text, description text, image_path text not null, button_label text, target_url text, sort_order integer not null default 0, is_active boolean not null default true, starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.telegram_settings (id uuid primary key default gen_random_uuid(), channel_name text not null, description text, channel_url text not null check(channel_url ~ '^https://(t.me|telegram.me)/'), is_active boolean not null default true, updated_at timestamptz not null default now());
create table public.warranty_claims (id uuid primary key default gen_random_uuid(), claim_code text unique not null, reseller_id uuid not null references public.profiles(id), order_date date not null, report_date timestamptz not null default now(), application text not null, remaining_duration_value numeric check(remaining_duration_value >= 0), remaining_duration_unit text check(remaining_duration_unit in ('hari','bulan')), remaining_duration_source text check(remaining_duration_source in ('manual','internal_calculation','external_verified')), account_email text, profile_reference text, problem_description text not null, status claim_status not null default 'submitted', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.warranty_responses (id uuid primary key default gen_random_uuid(), claim_id uuid not null references public.warranty_claims(id) on delete cascade, admin_id uuid not null references public.profiles(id), response text, internal_note text, old_status claim_status, new_status claim_status, created_at timestamptz not null default now());
create table public.warranty_attachments (id uuid primary key default gen_random_uuid(), claim_id uuid not null references public.warranty_claims(id) on delete cascade, file_path text not null, file_name text, mime_type text, created_at timestamptz not null default now());
create table public.site_settings (id uuid primary key default gen_random_uuid(), key text unique not null, value jsonb not null, updated_at timestamptz not null default now());
create table public.admin_activity_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null, entity_type text not null, entity_id uuid, metadata jsonb, created_at timestamptz not null default now());

create index profiles_role_idx on public.profiles(role);
create index claims_reseller_idx on public.warranty_claims(reseller_id, created_at desc);
create index claims_status_idx on public.warranty_claims(status);
create index products_active_sort_idx on public.products(is_active, sort_order);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','reseller_details','product_categories','products','menus','banners','warranty_claims'] loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t); end loop; end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,full_name,email,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Reseller'),new.email,'reseller'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active) $$;
revoke all on function public.is_admin() from public; grant execute on function public.is_admin() to authenticated, anon;

create or replace function public.complete_reseller_registration(p_ba_name text,p_ba_start_year integer,p_sales_username text,p_phone text,p_testimonial_paths text[],p_pricelist_path text) returns void language plpgsql security definer set search_path='' as $$
declare rid uuid; path text;
begin
  if auth.uid() is null or cardinality(p_testimonial_paths)<3 then raise exception 'Invalid registration'; end if;
  update public.profiles set phone=p_phone where id=auth.uid() and role='reseller';
  insert into public.reseller_details(user_id,ba_name,ba_start_year,sales_username) values(auth.uid(),p_ba_name,p_ba_start_year,p_sales_username) returning id into rid;
  foreach path in array p_testimonial_paths loop insert into public.reseller_testimonials(reseller_id,file_path) values(rid,path); end loop;
  insert into public.reseller_pricelists(reseller_id,file_path) values(rid,p_pricelist_path);
end $$;
revoke all on function public.complete_reseller_registration(text,integer,text,text,text[],text) from public; grant execute on function public.complete_reseller_registration(text,integer,text,text,text[],text) to authenticated;

alter table public.profiles enable row level security; alter table public.reseller_details enable row level security; alter table public.reseller_testimonials enable row level security; alter table public.reseller_pricelists enable row level security; alter table public.product_categories enable row level security; alter table public.products enable row level security; alter table public.menus enable row level security; alter table public.banners enable row level security; alter table public.telegram_settings enable row level security; alter table public.warranty_claims enable row level security; alter table public.warranty_responses enable row level security; alter table public.warranty_attachments enable row level security; alter table public.site_settings enable row level security; alter table public.admin_activity_logs enable row level security;

create policy "profiles own read" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check((id=auth.uid() and role=(select role from public.profiles p where p.id=auth.uid())) or public.is_admin());
create policy "reseller detail own or admin" on public.reseller_details for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy "reseller detail admin manage" on public.reseller_details for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "testimonials own or admin" on public.reseller_testimonials for select to authenticated using(public.is_admin() or exists(select 1 from public.reseller_details d where d.id=reseller_id and d.user_id=auth.uid()));
create policy "pricelists own or admin" on public.reseller_pricelists for select to authenticated using(public.is_admin() or exists(select 1 from public.reseller_details d where d.id=reseller_id and d.user_id=auth.uid()));
create policy "active categories authenticated" on public.product_categories for select to authenticated using(is_active or public.is_admin());
create policy "admin categories" on public.product_categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "active products authenticated" on public.products for select to authenticated using(is_active or public.is_admin());
create policy "admin products" on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "active menus public" on public.menus for select to anon,authenticated using(is_active or public.is_admin());
create policy "admin menus" on public.menus for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "active banners public" on public.banners for select to anon,authenticated using(is_active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()) or public.is_admin());
create policy "admin banners" on public.banners for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "telegram read" on public.telegram_settings for select to anon,authenticated using(is_active or public.is_admin());
create policy "telegram admin" on public.telegram_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "claims own read" on public.warranty_claims for select to authenticated using(reseller_id=auth.uid() or public.is_admin());
create policy "claims own insert" on public.warranty_claims for insert to authenticated with check(reseller_id=auth.uid() and status='submitted');
create policy "claims admin update" on public.warranty_claims for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "responses relevant read" on public.warranty_responses for select to authenticated using(public.is_admin() or exists(select 1 from public.warranty_claims c where c.id=claim_id and c.reseller_id=auth.uid()));
create policy "responses admin" on public.warranty_responses for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "attachments relevant" on public.warranty_attachments for select to authenticated using(public.is_admin() or exists(select 1 from public.warranty_claims c where c.id=claim_id and c.reseller_id=auth.uid()));
create policy "settings admin" on public.site_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "logs admin" on public.admin_activity_logs for select to authenticated using(public.is_admin());
create policy "logs admin insert" on public.admin_activity_logs for insert to authenticated with check(public.is_admin() and actor_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('public-assets','public-assets',true,5242880,array['image/jpeg','image/png','image/webp']),
('reseller-evidence','reseller-evidence',false,5242880,array['image/jpeg','image/png','image/webp']),
('warranty-evidence','warranty-evidence',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do nothing;
create policy "public assets read" on storage.objects for select using(bucket_id='public-assets');
create policy "admin asset write" on storage.objects for all to authenticated using(bucket_id='public-assets' and public.is_admin()) with check(bucket_id='public-assets' and public.is_admin());
create policy "evidence own insert" on storage.objects for insert to authenticated with check(bucket_id='reseller-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "evidence own read" on storage.objects for select to authenticated using(bucket_id='reseller-evidence' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
create policy "warranty evidence access" on storage.objects for select to authenticated using(bucket_id='warranty-evidence' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
create policy "warranty evidence insert" on storage.objects for insert to authenticated with check(bucket_id='warranty-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
