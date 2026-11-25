alter table public.warranty_claims
  add column account_duration_value integer check (account_duration_value > 0),
  add column account_duration_unit text check (account_duration_unit in ('hari', 'bulan')),
  add column expires_at date;
