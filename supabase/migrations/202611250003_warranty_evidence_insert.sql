create policy "warranty evidence own insert"
on public.warranty_attachments for insert
to authenticated
with check (
  exists (
    select 1 from public.warranty_claims c
    where c.id = claim_id and c.reseller_id = auth.uid()
  )
);
