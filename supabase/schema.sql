-- Lynk prototype backend schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query)
-- before running seed.sql.
--
-- Design notes:
--  * Tables mirror the TypeScript interfaces in src/types.ts closely, so the
--    data-access layer (src/lib/db.ts) can map rows straight onto existing
--    component props with almost no shape translation.
--  * Nested, read-mostly structures (contact lists, document history,
--    data-governance field diffs, catalogue line items/versions) are stored
--    as jsonb rather than normalized into their own tables — this is a
--    prototype for usability testing, not a production ledger, so we're
--    optimizing for "easy to seed and easy to read back", not 3NF purity.
--  * catalogue_suppliers is a real table (not jsonb) because "confirmed"
--    needs to be toggled per supplier/catalogue independently.
--  * Every table has permissive RLS ("anon full access") so the app can
--    read/write with just the public anon key — there is no login flow in
--    this prototype. DO NOT reuse these policies once real supplier data
--    (real IBANs, real contacts) goes into this project.

create extension if not exists pgcrypto;

-- ── Suppliers / Prospects / Providers ──────────────────────────────────────
create table if not exists suppliers (
  id text primary key,
  name text not null,
  stage text not null check (stage in ('Prospect','Supplier','Provider')),
  trade text not null,
  region text not null,
  compliance text not null default '—',
  rating integer,
  open_tickets integer not null default 0,
  contacts jsonb not null default '[]'::jsonb,        -- Contact[]
  regions_served text[] not null default '{}',
  capabilities text[] not null default '{}',
  vat_id text,
  iban text,
  address text,
  last_active text,
  created_at timestamptz not null default now()
);

-- ── Task Queue tickets (the triage dashboard) ───────────────────────────────
create table if not exists tickets (
  id text primary key,
  title text not null,
  criticality text not null check (criticality in ('critical','high','medium','low')),
  entity_name text not null,
  entity_type text not null check (entity_type in ('Supplier','Prospect','Service Provider')),
  age_label text,
  primary_action text not null,
  source text not null,
  category text not null,
  target_id text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Compliance documents ────────────────────────────────────────────────────
create table if not exists supplier_docs (
  id text primary key,
  supplier_id text references suppliers(id) on delete cascade,
  supplier_name text not null,
  trade text,
  document_name text not null,
  document_category text,
  expiry_date text,
  days_until_expiry integer,
  status text not null,
  auto_notified text,
  status_note text,
  renewal jsonb,                                       -- RenewalUpload | null
  history jsonb not null default '[]'::jsonb,           -- ComplianceEvent[]
  -- The actual attached file for the CURRENT valid version of this document
  -- (as opposed to `renewal`, which is a newly uploaded file still awaiting
  -- review). file_path is the Storage object path; file_url is the public
  -- URL the UI links to directly.
  file_path text,
  file_url text
);

-- ── Contracts ────────────────────────────────────────────────────────────────
create table if not exists contracts (
  id text primary key,
  supplier_name text not null,
  ref text,
  type text,
  annual_value numeric,
  end_date text,
  renewal_by text,
  notice_period text,
  time_left_label text,
  status text not null
);

-- ── Master data governance (four-eyes approval) ─────────────────────────────
create table if not exists data_governance_requests (
  id text primary key,
  supplier_name text not null,
  category text,
  risk text,
  requested_by text,
  requested_at text,
  reason text,
  fields jsonb not null default '[]'::jsonb,            -- {label,before,after,sensitive}[]
  status text not null,
  approval_step integer not null default 1
);

-- ── Onboarding / prospect pipeline ──────────────────────────────────────────
create table if not exists onboarding_cases (
  id text primary key,
  company_name text not null,
  contact_name text,
  status text not null,
  days_no_response integer default 0,
  criticality text not null default 'low'
);

-- ── Service catalogues ───────────────────────────────────────────────────────
create table if not exists catalogues (
  id text primary key,
  name text not null,
  trade text,
  region text,
  status text not null,
  version_label text,
  current_version text,
  awaiting_first_response boolean default false,
  valid_from text,
  valid_to text,
  response_model text,
  services jsonb not null default '[]'::jsonb,          -- CatalogueLine[]
  versions jsonb not null default '[]'::jsonb           -- CatalogueVersionEntry[]
);

create table if not exists catalogue_suppliers (
  id bigint generated always as identity primary key,
  catalogue_id text references catalogues(id) on delete cascade,
  supplier_ref text not null,
  name text not null,
  region text,
  confirmed boolean not null default false
);

-- ── Generic activity/audit log ───────────────────────────────────────────────
-- Every action taken in the app (resolve ticket, renewal decision, invite
-- sent, etc.) gets a row here in addition to its specific table update —
-- gives you one place to see "what happened during the test session."
create table if not exists activity_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor text not null default 'Sabine Müller',
  entity_name text,
  action text not null,
  detail text
);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table suppliers enable row level security;
alter table tickets enable row level security;
alter table supplier_docs enable row level security;
alter table contracts enable row level security;
alter table data_governance_requests enable row level security;
alter table onboarding_cases enable row level security;
alter table catalogues enable row level security;
alter table catalogue_suppliers enable row level security;
alter table activity_log enable row level security;

create policy "anon full access" on suppliers for all using (true) with check (true);
create policy "anon full access" on tickets for all using (true) with check (true);
create policy "anon full access" on supplier_docs for all using (true) with check (true);
create policy "anon full access" on contracts for all using (true) with check (true);
create policy "anon full access" on data_governance_requests for all using (true) with check (true);
create policy "anon full access" on onboarding_cases for all using (true) with check (true);
create policy "anon full access" on catalogues for all using (true) with check (true);
create policy "anon full access" on catalogue_suppliers for all using (true) with check (true);
create policy "anon full access" on activity_log for all using (true) with check (true);

-- ── Backward-compatible column additions ────────────────────────────────────
-- Safe to re-run even if you already executed an earlier version of this file.
alter table supplier_docs add column if not exists file_path text;
alter table supplier_docs add column if not exists file_url text;

-- ── Storage bucket for attached documents (certificates, insurance, etc.) ───
-- Public bucket + anon insert, matching the "anon full access" approach above
-- — fine for a no-login prototype, not something to carry into production.
insert into storage.buckets (id, name, public)
values ('supplier-documents', 'supplier-documents', true)
on conflict (id) do nothing;

drop policy if exists "public read supplier documents" on storage.objects;
create policy "public read supplier documents"
  on storage.objects for select
  using (bucket_id = 'supplier-documents');

drop policy if exists "anon upload supplier documents" on storage.objects;
create policy "anon upload supplier documents"
  on storage.objects for insert
  with check (bucket_id = 'supplier-documents');
