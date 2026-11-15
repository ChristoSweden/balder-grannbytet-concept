# Kvartersbyte bounded free pilot — operator runbook

Canonical product: https://kvartersbyte-independent.vercel.app/

Status: PREPARATION HOLD. Browsing, existing conversations, support, export and listing correction/removal remain available. New publication and new conversations require the pilot admission guard to pass. No social account, campaign or schedule was created.

## Existing authenticated management connection

These functions are SECURITY INVOKER and are executable only by service_role / privileged database management. They are not public app endpoints. No new account, administrator token or browser privilege has been provisioned.

```sql
select public.kb_operator_console();
select public.kb_retention_preview();
```

Console shows pilot configuration, pending reports, support/privacy requests and aggregate outcomes excluding `is_test` listings. Never count QA feedback or QA handoffs as traction. Four retained QA listings were flagged during preparation. Synthetic support checks may remain in the private queue; identify their explicit QA descriptions before handling.

To reply to a real support request, read it and resolve its actual request first. Use the exact returned UUID:

```sql
select public.kb_operator_resolve('support', '<case UUID>', '<accurate response>', false);
select public.kb_operator_resolve('report', '<report UUID>', '<review note>', true);
```

The report option hides the listing; it does not permanently erase evidence. Replies become visible only to the resident holding the associated recovery capability. A reply is not proof a deletion/export request has actually been fulfilled. No round-the-clock or guaranteed response-time claim is approved.

## Activation conditions

1. Confirm the actual controller, contact channel ownership, lawful bases, processors/transfers and privacy notice. The site's previously stated operator is Christo van Zyl; this does not establish that BeetleSense AB is the controller.
2. Approve the exact permanent retention windows in `RETENTION_PROPOSAL.sql`. Automatic approval review rejected installing these irreversible deletions without explicit approval. No deletion functions or scheduled deletion job were installed. `retention_approved` remains false.
3. Name the real moderator and agree daily review coverage, incident escalation and data-rights handling. The label in configuration is not proof of staffing.
4. Choose one real neighbourhood for Finnvedsbostäder, verify provider included capacity / spending controls, and record the start in the coordinated launch record. Application limits cannot guarantee a zero provider bill.
5. Only after the above, use the existing authenticated management channel for an explicit operator check-in. Do not call this as an automatic heartbeat or claim a human reviewed something they did not review:

```sql
select public.kb_operator_checkin(true, '<confirmed neighbourhood>', true);
```

The check-in cannot activate while retention approval is false. On first activation the window is 14 days. Fresh check-in required within 24 hours, otherwise new publication/contacts pause. Up to 30 participating browser identities, not verified people; no resident approval or membership verification. Maximum 60 simultaneous non-test active/reserved listings. Existing private conversations can continue after intake pauses.

Pause explicitly with:

```sql
select public.kb_operator_checkin(false, null, false);
```

## Daily review

Read the console; review all new reports and support/privacy requests; resolve urgent abusive exposure before checking in. Review removed records and retention preview without deleting anything until approved. Escalate suspected personal-data incidents to the controller. Keep operation within existing free/included resources. Do not buy tools, boost posts or change shared account billing.

## Campaign coordination

Use the portfolio master workflow. No verified dedicated Kvartersbyte brand destination is on record; native queue deduplication therefore remains pending. Do not use personal accounts or another app's accounts. No landlord endorsement, verified-resident, insurance, buyer-protection, guaranteed savings, 100x-result or customer-testimonial claim is approved. The pilot is free to use; goods may have prices. No screenshots/interface video without the exception required by the master workflow.
