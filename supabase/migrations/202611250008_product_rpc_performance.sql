create or replace function public.save_product_with_log(
  p_id uuid,
  p_name text,
  p_slug text,
  p_category_id uuid,
  p_image_path text,
  p_sort_order integer,
  p_is_active boolean
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_action text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_name is null or length(trim(p_name)) < 2 or p_slug !~ '^[a-z0-9-]+$' then
    raise exception 'Invalid product data';
  end if;

  if p_id is null then
    insert into public.products (
      name, slug, category_id, image_path, reseller_price,
      description, sort_order, is_active
    ) values (
      trim(p_name), p_slug, p_category_id, p_image_path, 0,
      null, p_sort_order, p_is_active
    ) returning id into v_id;
    v_action := 'create';
  else
    update public.products set
      name = trim(p_name),
      slug = p_slug,
      category_id = p_category_id,
      image_path = p_image_path,
      sort_order = p_sort_order,
      is_active = p_is_active
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Product not found'; end if;
    v_action := 'update';
  end if;

  insert into public.admin_activity_logs (
    actor_id, action, entity_type, entity_id
  ) values (
    auth.uid(), v_action, 'product', v_id
  );

  return v_id;
end;
$$;

create or replace function public.sync_product_plans(
  p_product_id uuid,
  p_plans jsonb
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan jsonb;
  v_ids uuid[] := '{}';
  v_id uuid;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Product not found';
  end if;

  if jsonb_typeof(p_plans) <> 'array' or jsonb_array_length(p_plans) > 50 then
    raise exception 'Invalid plans payload';
  end if;

  for v_plan in select value from jsonb_array_elements(p_plans)
  loop
    if length(trim(coalesce(v_plan->>'name', ''))) < 2
      or length(trim(coalesce(v_plan->>'description', ''))) < 2
      or (v_plan->>'reseller_price')::numeric < 0 then
      raise exception 'Invalid plan data';
    end if;

    v_id := nullif(v_plan->>'id', '')::uuid;
    if v_id is null then
      insert into public.product_plans (
        product_id, name, description, reseller_price, sort_order, is_active
      ) values (
        p_product_id,
        trim(v_plan->>'name'),
        trim(v_plan->>'description'),
        (v_plan->>'reseller_price')::numeric,
        coalesce((v_plan->>'sort_order')::integer, 0),
        coalesce((v_plan->>'is_active')::boolean, true)
      ) returning id into v_id;
    else
      update public.product_plans set
        name = trim(v_plan->>'name'),
        description = trim(v_plan->>'description'),
        reseller_price = (v_plan->>'reseller_price')::numeric,
        sort_order = coalesce((v_plan->>'sort_order')::integer, 0),
        is_active = coalesce((v_plan->>'is_active')::boolean, true)
      where id = v_id and product_id = p_product_id;
      if not found then raise exception 'Product plan not found'; end if;
    end if;
    v_ids := array_append(v_ids, v_id);
    v_count := v_count + 1;
  end loop;

  delete from public.product_plans
  where product_id = p_product_id
    and not (id = any(v_ids));

  insert into public.admin_activity_logs (
    actor_id, action, entity_type, entity_id,
    metadata
  ) values (
    auth.uid(), 'sync', 'product_plans', p_product_id,
    jsonb_build_object('plan_count', v_count)
  );

  return v_count;
end;
$$;

revoke all on function public.save_product_with_log(uuid, text, text, uuid, text, integer, boolean) from public;
grant execute on function public.save_product_with_log(uuid, text, text, uuid, text, integer, boolean) to authenticated;
revoke all on function public.sync_product_plans(uuid, jsonb) from public;
grant execute on function public.sync_product_plans(uuid, jsonb) to authenticated;
