-- Terms & Conditions acceptance.
--
-- Stored on `suppliers`, not on `onboarding_cases`: acceptance belongs to the
-- supplier and has to outlive onboarding, and established suppliers have no
-- onboarding case at all. Consent is only meaningful if you can say WHO
-- accepted WHICH version and WHEN, so all three are recorded.
--
-- Nothing may be saved for a supplier — no company data, no documents — until
-- terms_accepted_at is set.
--
-- Run in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run.

alter table suppliers add column if not exists terms_accepted_at timestamptz;
alter table suppliers add column if not exists terms_version text;
alter table suppliers add column if not exists terms_accepted_by text;

-- Existing suppliers accepted the terms when they went through onboarding, so
-- they are backfilled rather than being locked out. Their original acceptance
-- date predates this column, so the migration date stands in for it — the note
-- in terms_accepted_by says so explicitly instead of implying a fresh consent.
-- Prospects are excluded on purpose: they are mid-onboarding and must accept
-- in the wizard.
update suppliers
   set terms_accepted_at = now(),
       terms_version     = '1.0',
       terms_accepted_by = 'Accepted during onboarding (date backfilled)'
 where terms_accepted_at is null
   and stage <> 'Prospect';
