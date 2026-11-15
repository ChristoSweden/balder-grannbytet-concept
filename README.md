# Kvartersbyte independent resident communities

Independent company-specific resident feeds for Finnvedsbostäder, Balder, Nivika and Heimstaden. No landlord affiliation, endorsement, membership approval or tenancy verification. A selected company/building is context, not an authorization boundary.

## Product

- Open reading, distinct company URLs via `?company=finnvedsbostader|balder|nivika|heimstaden`, optional `building` filter.
- Preferences and a randomly generated 256-bit device capability in localStorage. No account, email collection or membership gate.
- Shared server-backed listing publication, optional locally resized image, own listing closure/removal.
- Company scope stays within that company; building scope is filtered when a building is selected. Company-wide browsing includes that company's building-scoped posts. All published listings are publicly readable, clearly disclosed.
- Private two-way conversations, reporting queue and bilateral blocking. Inbox is manual refresh; no notifications or email delivery are claimed.
- Device capability is hashed on the server, never included in public listings. Losing browser data loses access; there is no recovery or multi-device login in this release.
- No laundry feature or payment processing.

## Backend

Existing `granne` infrastructure, project `dlidcuaiirypinjzlbsd`; isolated new `kb_*` tables. No changes to existing Granne application tables, authentication, keys or policies.

`supabase/functions/kvartersbyte-community/index.ts` is deployed as `kvartersbyte-community`. Gateway JWT checking is disabled intentionally because browsing is public and state-changing/private operations authenticate a random device capability in the function body. All private operations are constrained by its server-derived SHA-256 hash. The server reads its service credentials from Supabase-managed runtime environment variables; no service credential is in source or the frontend.

Tables use RLS with no client policies; grants to anon/authenticated revoked. Only the Edge Function service role can access them. Rate function is SECURITY INVOKER and executable only by service_role. Per-device and salted, daily-hashed network buckets limit writes; expired buckets are pruned after 48 hours on subsequent mutations. Listings stop appearing after 60 days. Reports never auto-hide posts, preventing report-count brigading.

## Operations

Pending moderation queue (operator-only database access):

```sql
select r.id, r.reason, r.created_at, l.id as listing_id, l.company, l.title
from public.kb_reports r join public.kb_listings l on l.id=r.listing_id
where r.status='pending' order by r.created_at;
```

After human review, mark an abusive listing `status='removed'` and set the report status to `reviewed`. Do not claim round-the-clock monitoring. No moderation automation or schedule is configured.

## Validation

JavaScript syntax checks and real deployed API tests cover shared publication, company separation, building filtering, denied unauthorized listing changes, denied third-party conversation reads, inbox visibility, replies, reports, blocking and closed-listing exclusion. RLS and direct client grants are checked via catalog query. Test data is removed after verification.

## Deployment

Vercel project `prj_175K9DY56QqBj2DOw8XVpaPte1bP`, team `team_W6OPn2e8psbMOj4XJCcJ3iXo`, production `https://kvartersbyte-independent.vercel.app/`. Deploy only `index.html`, `community.css`, `community.js`, and `vercel.json`; never deploy backend source or database migrations as static files. Source remains on branch `independent-launch-20261115` of the original concept repository; the original main branch remains intact.
