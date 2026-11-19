-- Task assignment (LYNK-115): procurement users + one assignee per ticket.
--
-- Agreed rules (PO sync 12 + 17 Nov):
--   • a task has exactly ONE assignee (a person) or none — never a team,
--   • team is an attribute of the user; it only groups people in the picker and
--     backs the "My team" filter.
--
-- This migration:
--   1. creates `users` (id, name, email, team, avatar_initials — no photo URLs),
--   2. seeds 8 fictional procurement users in two teams,
--   3. adds `tickets.assignee_id` (nullable FK → users, set null on delete),
--   4. seeds a realistic assignment mix — only if no ticket is assigned yet, so
--      re-running never overwrites assignments made in the app.
--
-- The users mirror USERS in src/data.ts and the mix mirrors
-- SEED_TICKET_ASSIGNEES there; the app uses those until this has run.
--
-- Run in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is guarded.

-- ── 1. Users ────────────────────────────────────────────────────────────────
create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  team text not null,
  avatar_initials text not null,
  created_at timestamptz not null default now()
);

alter table users enable row level security;
drop policy if exists "anon full access" on users;
create policy "anon full access" on users for all using (true) with check (true);

-- ── 2. Seed users ───────────────────────────────────────────────────────────
-- Sabine Müller is the current user (PROCUREMENT_MANAGER_ID in src/lib/principal.ts).
insert into users (id, name, email, team, avatar_initials) values
('u-sabine-mueller','Sabine Müller','sabine.mueller@urbanhabitat-management.de','Procurement North','SM'),
('u-jonas-becker','Jonas Becker','jonas.becker@urbanhabitat-management.de','Procurement North','JB'),
('u-leonie-hartmann','Leonie Hartmann','leonie.hartmann@urbanhabitat-management.de','Procurement North','LH'),
('u-maximilian-schaefer','Maximilian Schäfer-Oberhuber','maximilian.schaefer@urbanhabitat-management.de','Procurement North','MS'),
('u-katharina-wiedemann','Katharina Wiedemann-Lechner','katharina.wiedemann@urbanhabitat-management.de','Procurement South','KW'),
('u-florian-brandstaetter','Florian Brandstätter','florian.brandstaetter@urbanhabitat-management.de','Procurement South','FB'),
('u-aylin-demir','Aylin Demir','aylin.demir@urbanhabitat-management.de','Procurement South','AD'),
('u-tobias-huber','Tobias Huber','tobias.huber@urbanhabitat-management.de','Procurement South','TH')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  team = excluded.team,
  avatar_initials = excluded.avatar_initials;

-- ── 3. tickets.assignee_id ──────────────────────────────────────────────────
alter table tickets add column if not exists assignee_id text references users(id) on delete set null;
create index if not exists tickets_assignee_id_idx on tickets (assignee_id);

-- ── 4. Seed the assignment mix (first run only) ─────────────────────────────
do $$
begin
  if not exists (select 1 from tickets where assignee_id is not null) then
    -- Sabine herself
    update tickets set assignee_id = 'u-sabine-mueller'
     where id in ('t3','t4','t6','t8','t13','t16','t19','t22','t26','t30');
    -- Her teammates (Procurement North)
    update tickets set assignee_id = 'u-jonas-becker' where id in ('t5','t15','t17','t27');
    update tickets set assignee_id = 'u-leonie-hartmann' where id in ('t9','t20','t33');
    update tickets set assignee_id = 'u-maximilian-schaefer' where id in ('t24');
    -- The other team (Procurement South)
    update tickets set assignee_id = 'u-katharina-wiedemann' where id in ('t7','t18','t28','t29');
    update tickets set assignee_id = 'u-florian-brandstaetter' where id in ('t10','t21','t31');
    update tickets set assignee_id = 'u-aylin-demir' where id in ('t11','t23');
    update tickets set assignee_id = 'u-tobias-huber' where id in ('t12','t32');
    -- t14, t25, t34 stay unassigned.
  end if;
end $$;
