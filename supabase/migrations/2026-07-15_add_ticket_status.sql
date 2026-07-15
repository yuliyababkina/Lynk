-- ─────────────────────────────────────────────────────────────────────────
-- Add the 3-state workflow status to tickets: To do / In progress / Resolved.
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → Run).
-- Safe to re-run: guarded with "if not exists" / idempotent updates.
-- ─────────────────────────────────────────────────────────────────────────

alter table tickets
  add column if not exists status text not null default 'To do'
  check (status in ('To do','In progress','Resolved'));

-- Backfill: any already-resolved ticket becomes 'Resolved'.
update tickets set status = 'Resolved' where resolved = true;

-- Realistic demo spread (none of the critical tickets are resolved, so the
-- Critical group keeps its 5 active items). Adjust ids as the data evolves.
update tickets set status = 'In progress'
  where id in ('t3','t18','t8','t20','t10','t28');

update tickets set status = 'Resolved', resolved = true, resolved_at = now()
  where id in ('t13','t15','t29','t32');
