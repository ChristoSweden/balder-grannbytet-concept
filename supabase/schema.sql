
create table public.kb_listings (
 id uuid primary key default gen_random_uuid(),
 company text not null check(company in ('finnvedsbostader','balder','nivika','heimstaden','other')),
 building text not null check(length(building) between 2 and 80),
 scope text not null check(scope in ('building','company')),
 title text not null check(length(title) between 3 and 80),
 description text not null check(length(description) between 5 and 1200),
 kind text not null check(kind in ('sell','give','lend','wanted')),
 category text not null check(category in ('furniture','home','tools','plants','kids','other')),
 price integer not null default 0 check(price between 0 and 1000000),
 photo text check(photo is null or (length(photo)<180000 and photo ~ '^data:image/(webp|jpeg);base64,[A-Za-z0-9+/=]+$')),
 owner_hash text not null check(owner_hash ~ '^[a-f0-9]{64}$'),
 nickname text not null check(length(nickname) between 1 and 40),
 status text not null default 'active' check(status in ('active','closed','removed')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '60 days'
);
create index kb_listing_feed on public.kb_listings(company,status,created_at desc);
create table public.kb_threads(
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.kb_listings(id),
 seller_hash text not null, buyer_hash text not null,
 buyer_name text not null check(length(buyer_name) between 1 and 40),
 created_at timestamptz not null default now(),
 unique(listing_id,buyer_hash)
);
create index kb_thread_seller on public.kb_threads(seller_hash);
create index kb_thread_buyer on public.kb_threads(buyer_hash);
create table public.kb_messages(
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.kb_threads(id),
 sender_hash text not null,
 body text not null check(length(body) between 1 and 1200),
 created_at timestamptz not null default now()
);
create index kb_message_thread on public.kb_messages(thread_id,created_at);
create table public.kb_reports(
 id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.kb_listings(id),
 reporter_hash text not null,reason text not null check(length(reason) between 3 and 400),
 created_at timestamptz not null default now(),status text not null default 'pending',
 unique(listing_id,reporter_hash)
);
create table public.kb_blocks(
 blocker_hash text not null,blocked_hash text not null,created_at timestamptz not null default now(),
 primary key(blocker_hash,blocked_hash)
);
create table public.kb_rates(actor text not null,bucket bigint not null,hits integer not null,primary key(actor,bucket));
alter table public.kb_listings enable row level security;
alter table public.kb_threads enable row level security;
alter table public.kb_messages enable row level security;
alter table public.kb_reports enable row level security;
alter table public.kb_blocks enable row level security;
alter table public.kb_rates enable row level security;
revoke all on public.kb_listings,public.kb_threads,public.kb_messages,public.kb_reports,public.kb_blocks,public.kb_rates from public,anon,authenticated;
grant all on public.kb_listings,public.kb_threads,public.kb_messages,public.kb_reports,public.kb_blocks,public.kb_rates to service_role;
create function public.kb_rate(p_actor text,p_limit integer) returns boolean
language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer;
begin
 insert into public.kb_rates(actor,bucket,hits) values(p_actor,floor(extract(epoch from now())/3600)::bigint,1)
 on conflict(actor,bucket) do update set hits=kb_rates.hits+1 returning hits into n;
 return n<=p_limit;
end $$;
revoke all on function public.kb_rate(text,integer) from public,anon,authenticated;
grant execute on function public.kb_rate(text,integer) to service_role;
comment on table public.kb_reports is 'Kvartersbyte independent resident communities. Operator moderation queue; pending reports require review. No landlord endorsement or resident verification.';

create index kb_rates_bucket on public.kb_rates(bucket);
create or replace function public.kb_rate(p_actor text,p_limit integer) returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer; current_bucket bigint := floor(extract(epoch from now())/3600)::bigint;
begin
 delete from public.kb_rates where bucket < current_bucket-48;
 insert into public.kb_rates(actor,bucket,hits) values(p_actor,current_bucket,1)
 on conflict(actor,bucket) do update set hits=kb_rates.hits+1 returning hits into n;
 return n<=p_limit;
end $$;
revoke all on function public.kb_rate(text,integer) from public,anon,authenticated;
grant execute on function public.kb_rate(text,integer) to service_role;
create function public.kb_inbox(p_hash text) returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
select coalesce(jsonb_agg(q.item order by q.activity desc),'[]'::jsonb) from (
 select jsonb_build_object('id',t.id,'listing_id',t.listing_id,'buyer_name',t.buyer_name,'created_at',t.created_at,
 'last_received_at',m.last_received_at,'listing',jsonb_build_object('title',l.title,'nickname',l.nickname,'company',l.company)) as item,
 coalesce(m.last_at,t.created_at) as activity
 from public.kb_threads t join public.kb_listings l on l.id=t.listing_id
 left join lateral (select max(created_at) as last_at,max(created_at) filter(where sender_hash<>p_hash) as last_received_at from public.kb_messages where thread_id=t.id) m on true
 where t.seller_hash=p_hash or t.buyer_hash=p_hash
 order by coalesce(m.last_at,t.created_at) desc limit 60
) q;
$$;
revoke all on function public.kb_inbox(text) from public,anon,authenticated;
grant execute on function public.kb_inbox(text) to service_role;
alter table public.kb_listings add column deadline timestamptz,
 add column dimensions text not null default '' check(length(dimensions)<=100),
 add column floor_info text not null default '' check(length(floor_info)<=100),
 add column lift_available boolean,
 add column carrying_help boolean not null default false,
 add column collection_notes text not null default '' check(length(collection_notes)<=300),
 add column reserved_thread_id uuid references public.kb_threads(id);
alter table public.kb_listings drop constraint kb_listings_status_check;
alter table public.kb_listings add constraint kb_listings_status_check check(status in ('active','reserved','closed','removed'));
create table public.kb_handoffs(
 id uuid primary key default gen_random_uuid(),thread_id uuid not null unique references public.kb_threads(id),
 starts_at timestamptz not null,ends_at timestamptz not null check(ends_at>starts_at),
 meeting text not null check(length(meeting) between 2 and 200),proposer_hash text not null,
 status text not null default 'proposed' check(status in ('proposed','agreed','cancelled','completed')),
 seller_done boolean not null default false,buyer_done boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.kb_feedback(
 handoff_id uuid not null references public.kb_handoffs(id),author_hash text not null,subject_hash text not null,
 rating integer not null check(rating between 1 and 5),created_at timestamptz not null default now(),
 primary key(handoff_id,author_hash),check(author_hash<>subject_hash)
);
create index kb_feedback_subject on public.kb_feedback(subject_hash);
alter table public.kb_handoffs enable row level security;
alter table public.kb_feedback enable row level security;
revoke all on public.kb_handoffs,public.kb_feedback from public,anon,authenticated;
grant all on public.kb_handoffs,public.kb_feedback to service_role;
create function public.kb_handoff_action(p_hash text,p_thread uuid,p_action text,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare t public.kb_threads; l public.kb_listings; h public.kb_handoffs; msg text; other_hash text; s timestamptz; e timestamptz;
begin
 select * into t from public.kb_threads where id=p_thread and (seller_hash=p_hash or buyer_hash=p_hash) for update;
 if not found then raise exception 'Konversationen hittades inte.';end if;
 select * into l from public.kb_listings where id=t.listing_id for update;
 other_hash:=case when t.seller_hash=p_hash then t.buyer_hash else t.seller_hash end;
 if exists(select 1 from public.kb_blocks where (blocker_hash=p_hash and blocked_hash=other_hash) or (blocker_hash=other_hash and blocked_hash=p_hash)) then raise exception 'Kontakten är blockerad.';end if;
 select * into h from public.kb_handoffs where thread_id=p_thread for update;
 if p_action='propose' then
  if l.status not in ('active','reserved') or (l.reserved_thread_id is not null and l.reserved_thread_id<>p_thread) then raise exception 'Annonsen är inte tillgänglig.';end if;
  if h.status in ('agreed','completed') then raise exception 'Avboka befintlig tid innan du föreslår en ny.';end if;
  s:=(p_data->>'starts_at')::timestamptz;e:=(p_data->>'ends_at')::timestamptz;
  if s is null or e is null or s<now() or s>now()+interval '60 days' or e<=s or e>s+interval '8 hours' or length(trim(coalesce(p_data->>'meeting','')))<2 or length(p_data->>'meeting')>200 then raise exception 'Välj en framtida tid och en mötesplats.';end if;
  if l.deadline is not null and s>l.deadline then raise exception 'Tiden ligger efter annonsens sista hämtdatum.';end if;
  insert into public.kb_handoffs(thread_id,starts_at,ends_at,meeting,proposer_hash) values(p_thread,s,e,trim(p_data->>'meeting'),p_hash)
  on conflict(thread_id) do update set starts_at=excluded.starts_at,ends_at=excluded.ends_at,meeting=excluded.meeting,proposer_hash=p_hash,status='proposed',seller_done=false,buyer_done=false,updated_at=now() returning * into h;
  msg:='Föreslog en tid för överlämning. Öppna överlämningsplanen för detaljer.';
 elsif p_action='agree' then
  if h.id is null or h.status<>'proposed' or h.proposer_hash=p_hash or h.ends_at<now() then raise exception 'Tiden kan inte bekräftas.';end if;
  if l.status not in ('active','reserved') or (l.reserved_thread_id is not null and l.reserved_thread_id<>p_thread) then raise exception 'Annonsen har redan reserverats eller avslutats.';end if;
  update public.kb_handoffs set status='agreed',updated_at=now() where id=h.id returning * into h;
  update public.kb_listings set status='reserved',reserved_thread_id=p_thread where id=l.id;
  msg:='Bekräftade överlämningstiden. Annonsen är reserverad för denna överlämning.';
 elsif p_action='cancel' then
  if h.id is null or h.status not in ('proposed','agreed') then raise exception 'Ingen aktiv överlämning att avboka.';end if;
  update public.kb_handoffs set status='cancelled',updated_at=now() where id=h.id returning * into h;
  update public.kb_listings set status=case when status='reserved' then 'active' else status end,reserved_thread_id=null where id=l.id and reserved_thread_id=p_thread;
  msg:='Avbokade överlämningstiden. Bestäm en ny tid i konversationen.';
 elsif p_action='complete' then
  if h.id is null or h.status<>'agreed' or l.reserved_thread_id is distinct from p_thread then raise exception 'Bekräfta först en gemensam tid.';end if;
  update public.kb_handoffs set seller_done=seller_done or t.seller_hash=p_hash,buyer_done=buyer_done or t.buyer_hash=p_hash,updated_at=now() where id=h.id returning * into h;
  if h.seller_done and h.buyer_done then
   update public.kb_handoffs set status='completed',updated_at=now() where id=h.id returning * into h;
   update public.kb_listings set status='closed',reserved_thread_id=null where id=l.id;
   msg:='Båda har bekräftat överlämningen. Annonsen är avslutad.';
  else msg:='Har bekräftat att överlämningen är genomförd. Väntar på den andra personen.';end if;
 elsif p_action='feedback' then
  if h.id is null or h.status<>'completed' or (p_data->>'rating') is null or (p_data->>'rating')::integer not between 1 and 5 then raise exception 'Omdöme kräver en överlämning som båda har bekräftat.';end if;
  insert into public.kb_feedback(handoff_id,author_hash,subject_hash,rating) values(h.id,p_hash,other_hash,(p_data->>'rating')::integer) on conflict do nothing;
 else raise exception 'Okänd överlämningsåtgärd.';end if;
 if msg is not null then insert into public.kb_messages(thread_id,sender_hash,body) values(p_thread,p_hash,msg);end if;
 return jsonb_build_object('ok',true,'status',h.status);
end $$;
revoke all on function public.kb_handoff_action(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.kb_handoff_action(text,uuid,text,jsonb) to service_role;
create function public.kb_reputation(p_listing uuid) returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
select jsonb_build_object('reviews',count(f.rating),'average',round(avg(f.rating),1)) from public.kb_listings l left join public.kb_feedback f on f.subject_hash=l.owner_hash where l.id=p_listing;
$$;
revoke all on function public.kb_reputation(uuid) from public,anon,authenticated;
grant execute on function public.kb_reputation(uuid) to service_role;

alter table public.kb_listings add column is_test boolean not null default false, add column removed_at timestamptz;
update public.kb_listings set is_test=true where title ~ '^QA[ _]';
create table public.kb_pilot_config(
 id boolean primary key default true check(id),active boolean not null default false,
 company text not null default 'finnvedsbostader',area text,
 starts_at timestamptz,ends_at timestamptz,moderator_name text not null default 'Christo van Zyl',
 checked_at timestamptz,privacy_confirmed boolean not null default false,retention_approved boolean not null default false,
 participant_limit integer not null default 30 check(participant_limit between 1 and 30)
);
insert into public.kb_pilot_config(id) values(true);
create table public.kb_pilot_participants(owner_hash text primary key,joined_at timestamptz not null default now());
create table public.kb_support_requests(
 id uuid primary key default gen_random_uuid(),owner_hash text not null,
 category text not null check(category in ('support','privacy','abuse')),
 body text not null check(length(body) between 5 and 2000),answer text not null default '' check(length(answer)<=4000),
 status text not null default 'pending' check(status in ('pending','answered','closed')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.kb_pilot_config enable row level security;
alter table public.kb_pilot_participants enable row level security;
alter table public.kb_support_requests enable row level security;
revoke all on public.kb_pilot_config,public.kb_pilot_participants,public.kb_support_requests from public,anon,authenticated;
grant all on public.kb_pilot_config,public.kb_pilot_participants,public.kb_support_requests to service_role;
create function public.kb_pilot_admit(p_hash text,p_company text,p_area text) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.kb_pilot_config;
begin
 select * into c from public.kb_pilot_config where id for update;
 if not c.active or not c.retention_approved or not c.privacy_confirmed or c.checked_at is null or c.checked_at<now()-interval '24 hours' or c.ends_at is null or now()>=c.ends_at or now()<c.starts_at then
  return jsonb_build_object('allowed',false,'reason','Piloten är pausad tills operatören har kontrollerat integritet och moderering.');end if;
 if p_company<>c.company or lower(trim(p_area))<>lower(trim(c.area)) then return jsonb_build_object('allowed',false,'reason','Den begränsade piloten är öppen i '||coalesce(c.area,'valt område')||' för valt bolag.');end if;
 if not exists(select 1 from public.kb_pilot_participants where owner_hash=p_hash) then
  if (select count(*) from public.kb_pilot_participants)>=c.participant_limit then return jsonb_build_object('allowed',false,'reason','Pilotens gräns på 30 publicerande eller kontaktande webbläsaridentiteter är nådd.');end if;
  insert into public.kb_pilot_participants(owner_hash) values(p_hash);
 end if;
 if (select count(*) from public.kb_listings where not is_test and status in ('active','reserved'))>=60 then return jsonb_build_object('allowed',false,'reason','Pilotens annonsgräns är nådd.');end if;
 return jsonb_build_object('allowed',true);
end $$;
create function public.kb_operator_checkin(p_activate boolean default false,p_area text default null,p_privacy_confirmed boolean default false)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.kb_pilot_config;
begin
 select * into c from public.kb_pilot_config where id for update;
 if p_activate and (not c.retention_approved or not p_privacy_confirmed or length(trim(coalesce(p_area,c.area,'')))<2) then raise exception 'Bekräfta integritetsinformationen och välj pilotområde först.';end if;
 update public.kb_pilot_config set active=p_activate,area=coalesce(nullif(lower(trim(p_area)),''),area),
 checked_at=now(),privacy_confirmed=p_privacy_confirmed,
 starts_at=case when p_activate then coalesce(starts_at,now()) else starts_at end,
 ends_at=case when p_activate then coalesce(ends_at,now()+interval '14 days') else ends_at end where id returning * into c;
 return jsonb_build_object('active',c.active,'area',c.area,'ends_at',c.ends_at,'review_due',c.checked_at+interval '24 hours');
end $$;
create function public.kb_operator_console() returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
select jsonb_build_object('pilot',(select to_jsonb(c) from public.kb_pilot_config c where id),
 'participants',(select count(*) from public.kb_pilot_participants),
 'pending_reports',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'reason',r.reason,'created_at',r.created_at,'listing_id',l.id,'title',l.title,'company',l.company)),'[]'::jsonb) from public.kb_reports r join public.kb_listings l on l.id=r.listing_id where r.status='pending'),
 'support',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'category',category,'body',body,'created_at',created_at)),'[]'::jsonb) from public.kb_support_requests where status='pending'),
 'metrics',jsonb_build_object('real_listings',(select count(*) from public.kb_listings where not is_test),
 'real_completed_exchanges',(select count(*) from public.kb_handoffs h join public.kb_threads t on t.id=h.thread_id join public.kb_listings l on l.id=t.listing_id where not l.is_test and h.status='completed' and h.seller_done and h.buyer_done),
 'excluded_qa_listings',(select count(*) from public.kb_listings where is_test)));
$$;
create function public.kb_operator_resolve(p_type text,p_id uuid,p_answer text,p_remove boolean default false) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare l uuid;
begin
 if length(coalesce(p_answer,'')) not between 3 and 4000 then raise exception 'Skriv en handläggningsnotering eller ett svar.';end if;
 if p_type='support' then update public.kb_support_requests set answer=p_answer,status='answered',updated_at=now() where id=p_id;
 elsif p_type='report' then
  select listing_id into l from public.kb_reports where id=p_id;
  if p_remove then update public.kb_listings set status='removed',removed_at=now() where id=l;end if;
  update public.kb_reports set status='reviewed' where id=p_id;
 else raise exception 'Okänd ärendetyp.';end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.kb_pilot_admit(text,text,text),public.kb_operator_checkin(boolean,text,boolean),public.kb_operator_console(),public.kb_operator_resolve(text,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.kb_pilot_admit(text,text,text),public.kb_operator_checkin(boolean,text,boolean),public.kb_operator_console(),public.kb_operator_resolve(text,uuid,text,boolean) to service_role;

create function public.kb_retention_preview() returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$ select jsonb_build_object('mode','preview_only','listing_bundles_due',(select count(*) from public.kb_listings where expires_at<now()-interval '30 days' or removed_at<now()-interval '30 days'),'reports_due',(select count(*) from public.kb_reports where created_at<now()-interval '180 days'),'support_due',(select count(*) from public.kb_support_requests where updated_at<now()-interval '90 days')); $$;
revoke all on function public.kb_retention_preview() from public,anon,authenticated;
grant execute on function public.kb_retention_preview() to service_role;
