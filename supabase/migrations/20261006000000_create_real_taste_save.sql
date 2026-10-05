-- Migration: create_real_taste_save — reversible — function metadata only;
-- backup: n/a. Service-role only; serializes model transition per user.
create or replace function public.save_real_taste_profile(p_user_id uuid, p_profile jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if p_user_id is null or p_profile is null or p_profile->>'modelId' is distinct from 'nabz-real-evidence'
     or p_profile->>'modelVersion' is distinct from '1.0.0'
     or (p_profile->>'evidenceCount')::integer is distinct from 5
     or jsonb_typeof(p_profile->'weights') is distinct from 'object' then
    raise exception 'invalid real taste profile';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  update public.taste_profiles set is_active = false, updated_at = now()
    where user_id = p_user_id and is_active
      and (model_id <> 'nabz-real-evidence' or model_version <> '1.0.0');
  insert into public.taste_profiles(user_id,model_id,model_version,dimension_weights,evidence_count,is_active)
    values(p_user_id,'nabz-real-evidence','1.0.0',p_profile,5,true)
    on conflict(user_id,model_id,model_version) do update
      set dimension_weights = excluded.dimension_weights, evidence_count = 5, is_active = true, updated_at = now();
end;
$$;
revoke all on function public.save_real_taste_profile(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_real_taste_profile(uuid,jsonb) to service_role;
