# Kvartersbyte — bounded free pilot preparation

Canonical URL: https://kvartersbyte-independent.vercel.app/

Status: PREPARATION HOLD, not a live public acquisition campaign. No social account, campaign, schedule, additional provider or paid resource was created.

The app supports independent company-specific neighbourhood feeds, requests/listings, shared images, private messaging, agreed reservations, bilateral completion, completion-gated feedback, local favourites and optional private recovery codes. All public listings are openly readable; company/building selection is a filter, not verified membership. No landlord affiliation, identity verification, insurance, buyer protection or platform payments.

## Readiness controls

- New public posts and new conversations require the server-side pilot gate. A selected company and area, approved privacy/retention policy, 14-day window, moderator check-in within 24 hours, 30 participating browser identities and 60 active/reserved listings bound intake.
- Current configuration remains paused, with no participants enrolled. Check-in labels do not prove real human staffing. Existing conversations, support/privacy requests, data export and listing correction/removal remain available.
- Direct support/privacy case channel with private case IDs, owner-only readback and operator replies through the existing authenticated database management connection.
- Public `/privacy.html` clearly separates current processing from proposed retention, explicitly retains controller/lawful-basis/provider-transfer confirmation, and explains recovery, public visibility, operators' access and absence of background push.
- `is_test` flags exclude QA records from outcome counts. Operator console provides aggregate real listing/completed-exchange metrics, pending reports and support cases; no advertising or behavioural analytics SDK was added.
- No new web admin account or credential was created. Operator functions are SECURITY INVOKER, service-role-only; tables use RLS without browser grants. No server credentials are in source or static output.

## Retention approval status

Automatic approval review rejected the persistent daily irreversible deletion migration because its precise retention windows lacked explicit approval. The original migration was not installed. Only safe preparation and read-only retention preview were applied; no purge function, erase function or deletion cron job was installed. `RETENTION_PROPOSAL.sql` is unexecuted, reviewable source for a later explicit approval. No alternate deletion route was used.

Proposed windows: listing bundles (including linked chats/meeting details/feedback) 30 days after expiry/removal; reports/blocks 180 days; support 90 days after latest update; rate buckets 48 hours; pilot identity hashes 90 days. Existing backups/logs are separate and remain to be verified. Do not claim permanent deletion or GDPR certification from this preparation.

See `OPERATOR_RUNBOOK.md` for actual management commands, responsibilities, activation conditions and campaign restrictions. App traffic limits do not guarantee zero provider charges; shared infrastructure billing controls need verification before pilot activation.

## Validation

Passed live API tests: paused pilot denial, private support receipt/readback, outsider isolation, export without recovery secret. Transaction-rolled-back database checks verify company/area limits, 30-identity limit and stale-moderator pause; production remained paused with zero enrolled participants. Operator self-test response recorded only for an explicitly synthetic case. Existing QA records remain marked and excluded, not claimed as real outcomes. JavaScript syntax checks pass.

## Source and deployment

Repository: ChristoSweden/balder-grannbytet-concept, branch independent-launch-20261115. Original main branch remains untouched. Vercel project prj_175K9DY56QqBj2DOw8XVpaPte1bP in team team_W6OPn2e8psbMOj4XJCcJ3iXo. Supabase project dlidcuaiirypinjzlbsd uses isolated kb_* tables. Deploy only index.html, community.js, community.css, privacy.html and vercel.json; backend source, runbooks and SQL must not be public static files.
