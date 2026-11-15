
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