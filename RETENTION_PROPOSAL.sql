-- PROPOSAL ONLY. NOT APPLIED. Requires explicit approval of irreversible retention windows.
create function public.kb_purge_listing(p_id uuid) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 update public.kb_listings set reserved_thread_id=null where id=p_id;
 delete from public.kb_feedback where handoff_id in(select h.id from public.kb_handoffs h join public.kb_threads t on t.id=h.thread_id where t.listing_id=p_id);
 delete from public.kb_handoffs where thread_id in(select id from public.kb_threads where listing_id=p_id);
 delete from public.kb_messages where thread_id in(select id from public.kb_threads where listing_id=p_id);
 delete from public.kb_reports where listing_id=p_id;
 delete from public.kb_threads where listing_id=p_id;
 delete from public.kb_listings where id=p_id;
end $$;
create function public.kb_retention(p_dry_run boolean default true) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer;l record;
begin
 select count(*) into n from public.kb_listings where expires_at<now()-interval '30 days' or removed_at<now()-interval '30 days';
 if not p_dry_run then
  for l in select id from public.kb_listings where expires_at<now()-interval '30 days' or removed_at<now()-interval '30 days' loop perform public.kb_purge_listing(l.id);end loop;
  delete from public.kb_reports where created_at<now()-interval '180 days';
  delete from public.kb_support_requests where updated_at<now()-interval '90 days';
  delete from public.kb_blocks where created_at<now()-interval '180 days';
  delete from public.kb_rates where bucket<floor(extract(epoch from now())/3600)::bigint-48;
  delete from public.kb_pilot_participants where joined_at<now()-interval '90 days';
 end if;
 return jsonb_build_object('dry_run',p_dry_run,'expired_listing_bundles',n);
end $$;

revoke all on function public.kb_purge_listing(uuid),public.kb_retention(boolean) from public,anon,authenticated;
grant execute on function public.kb_purge_listing(uuid),public.kb_retention(boolean) to service_role;
select cron.schedule('kvartersbyte-retention-daily','17 3 * * *','select public.kb_retention(false);');
-- After approval and successful installation only: update public.kb_pilot_config set retention_approved=true where id;
