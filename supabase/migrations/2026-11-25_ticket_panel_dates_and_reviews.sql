-- LYNK-117 gaps: the dates and review facts the ticket panel needs.
--
--   • data_governance_requests.endorsed_by / endorsed_at — who gave the first
--     review, so the same person can't also give final approval (four eyes).
--   • data_governance_requests.rejection_reason — shown in the rejected alert.
--   • onboarding_cases.invited_at / last_reminder_at — "Invited" and
--     "Last reminder" on an unanswered invitation.
--   • contracts.renewal_sent_at — "New contract sent <date>" while a renewal
--     waits for signature.
--   • supplier_docs.renewal.validUntil (jsonb, no column) — the expiry of an
--     uploaded renewal, shown next to the current document's expiry.
--
-- Dates are stored as display dates ("25 Nov 2026"), like expiry_date and
-- renewal_by. Run in the Supabase SQL editor; safe to re-run.

alter table data_governance_requests
  add column if not exists endorsed_by text references users(id) on delete set null,
  add column if not exists endorsed_at text,
  add column if not exists rejection_reason text;

alter table onboarding_cases
  add column if not exists invited_at text,
  add column if not exists last_reminder_at text;

alter table contracts
  add column if not exists renewal_sent_at text;

-- Demo values for the seeded rows. Only fill what is still empty.

-- dgr-2 was endorsed by a colleague, so the Procurement Manager can finalise it.
update data_governance_requests
set endorsed_by = 'u-jonas-becker', endorsed_at = '23 Jun 2026'
where id = 'dgr-2' and endorsed_by is null;

update data_governance_requests
set endorsed_by = 'u-aylin-demir', endorsed_at = '04 May 2026'
where id = 'dgr-3' and endorsed_by is null;

update data_governance_requests
set rejection_reason = 'The bank confirmation letter names a different account holder than the supplier.'
where id = 'dgr-4' and rejection_reason is null;

-- Invited = today minus the days without a response, as the tickets say.
update onboarding_cases
set invited_at = to_char(current_date - days_no_response, 'FMDD Mon YYYY')
where invited_at is null and status in ('Pending', 'Opened', 'Stale');

update onboarding_cases set last_reminder_at = '11 Nov 2026'
where id = 'onb-1' and last_reminder_at is null;
update onboarding_cases set last_reminder_at = '01 Nov 2026'
where id = 'onb-6' and last_reminder_at is null;

update contracts set renewal_sent_at = '20 Nov 2026'
where id = 'c10' and renewal_sent_at is null;
update contracts set renewal_sent_at = '12 Nov 2026'
where id = 'c5' and renewal_sent_at is null;

-- The seeded renewal awaiting review (Schuster, Trade Licence).
update supplier_docs
set renewal = renewal || '{"validUntil": "12 Aug 2028"}'::jsonb
where id = 'doc-017' and renewal is not null and not (renewal ? 'validUntil');
