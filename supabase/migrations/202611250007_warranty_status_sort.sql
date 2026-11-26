alter table public.warranty_claims
  add column status_sort_order integer generated always as (
    case when status in ('completed', 'approved') then 1 else 0 end
  ) stored;

create index warranty_claims_admin_sort_idx
  on public.warranty_claims(status_sort_order, created_at desc);
