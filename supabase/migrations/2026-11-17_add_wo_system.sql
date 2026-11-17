-- WO management system on suppliers; "Provider" stops being a lifecycle stage.
--
-- Supplier vs Provider was never a stage. It is an attribute: which work order
-- system the company receives work orders through. Prospect and Supplier stay
-- the lifecycle stages. This migration:
--   1. adds suppliers.wo_system (single value per supplier, default 'Unknown'),
--   2. moves every stage 'Provider' row to stage 'Supplier' + 'Enable (Yarowa)',
--   3. narrows the stage check to ('Prospect','Supplier').
--
-- The allowed wo_system values mirror WO_SYSTEMS in src/lib/wo-systems.ts. When
-- you edit one list, edit the other (add a new migration for the constraint).
--
-- Run in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is guarded.

-- ── 1. Column ───────────────────────────────────────────────────────────────
alter table suppliers add column if not exists wo_system text not null default 'Unknown';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'suppliers'::regclass and conname = 'suppliers_wo_system_check'
  ) then
    alter table suppliers add constraint suppliers_wo_system_check check (wo_system in (
      'Enable (Yarowa)',
      'SAP',
      'Planon',
      'IBM Maximo',
      'Eptura (Archibus)',
      'Infor EAM',
      'Aareon',
      'Haufe iX-Haus',
      'MRI Software',
      'Yardi',
      'Rimo R5 (Switzerland)',
      'Other',
      'None / manual',
      'Unknown'
    ));
  end if;
end $$;

-- ── 2. Old providers → suppliers on Enable ──────────────────────────────────
-- Runs before the stage check is narrowed, while 'Provider' is still allowed.
update suppliers
   set stage = 'Supplier',
       wo_system = 'Enable (Yarowa)'
 where stage = 'Provider';

-- ── 3. Stage is Prospect | Supplier only ────────────────────────────────────
-- The original check was created inline on the column, so its name is
-- generated. Find it by what it says rather than guessing the name.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'suppliers'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%stage%'
  loop
    execute format('alter table suppliers drop constraint %I', c.conname);
  end loop;

  alter table suppliers
    add constraint suppliers_stage_check check (stage in ('Prospect','Supplier'));
end $$;
