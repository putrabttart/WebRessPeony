create or replace function public.process_warranty_claim(
  p_claim_id uuid,
  p_status text,
  p_response text,
  p_handled_by_name text,
  p_claim_code text,
  p_reseller_name text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_status public.claim_status;
  v_new_status public.claim_status;
  v_response text := nullif(trim(p_response), '');
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_status not in ('reviewing', 'processing', 'completed', 'rejected') then
    raise exception 'Invalid warranty status';
  end if;

  if p_handled_by_name not in ('Rain', 'Cr eld', 'Kica', 'Ale', 'Cheetahily') then
    raise exception 'Invalid warranty handler';
  end if;

  select status into v_old_status
  from public.warranty_claims
  where id = p_claim_id
  for update;

  if not found then
    raise exception 'Warranty claim not found';
  end if;

  v_new_status := p_status::public.claim_status;
  if v_old_status = v_new_status and v_response is null then
    raise exception 'No warranty changes';
  end if;

  update public.warranty_claims
  set status = v_new_status
  where id = p_claim_id;

  insert into public.warranty_responses (
    claim_id, admin_id, handled_by_name, response, old_status, new_status
  ) values (
    p_claim_id, auth.uid(), p_handled_by_name, v_response, v_old_status, v_new_status
  );

  insert into public.admin_activity_logs (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(), 'update_status', 'warranty_claim', p_claim_id,
    jsonb_build_object(
      'handled_by_name', p_handled_by_name,
      'claim_code', p_claim_code,
      'reseller_name', p_reseller_name,
      'old_status', v_old_status::text,
      'new_status', v_new_status::text
    )
  );

  return jsonb_build_object(
    'old_status', v_old_status::text,
    'new_status', v_new_status::text,
    'saved_at', now()
  );
end;
$$;

revoke all on function public.process_warranty_claim(uuid, text, text, text, text, text) from public;
grant execute on function public.process_warranty_claim(uuid, text, text, text, text, text) to authenticated;
