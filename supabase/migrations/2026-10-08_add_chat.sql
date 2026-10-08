-- Principal ↔ Supplier/Prospect chat.
--
-- One flat conversation per principal–supplier relationship. No threads, no
-- attachments, no statuses — a message links to the thing it is about via
-- context_type/context_id and the UI navigates there, so the chat itself never
-- holds a file or changes any data.
--
-- Run in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is guarded.

-- ── Messages ────────────────────────────────────────────────────────────────
-- relationship_id is the derived key `rel_<principalId>_<supplierId>` (see
-- relationshipId() in src/lib/db.ts). It is a plain text column rather than a
-- foreign key because there is no supplier_relationships table in this
-- prototype — the Principal is a constant (src/lib/principal.ts) and the other
-- principals exist only as mock data for the portal.
--
-- The author's company / person / role are denormalised onto the row on purpose.
-- They are what requirement 5 ("Company | Person" + role) renders, and copying
-- them at insert time keeps old messages correct when someone's name or role
-- later changes — a conversation is a record of what was said and by whom at
-- the time, not a live join.
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  relationship_id text not null,
  -- 'system' covers the five lifecycle events (invited, changes requested,
  -- accepted, rejected, new application). They are posted from the existing
  -- mutations in LynkDataContext — there is no separate event system.
  author_side text not null check (author_side in ('principal', 'supplier', 'system')),
  author_name text not null,
  author_company text not null,
  author_role text,
  body text not null,
  -- Optional link to what the message is about: a document, a data change
  -- request, or an onboarding case. The label is stored so the chip reads
  -- correctly even if the target is later removed.
  context_type text check (context_type in ('document', 'data-change', 'onboarding-case')),
  context_id text,
  context_label text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_relationship_idx
  on chat_messages (relationship_id, created_at);

-- ── Read state ──────────────────────────────────────────────────────────────
-- One row per (relationship, side). Unread = messages from the *other* side
-- newer than last_read_at. A per-message read receipt would be heavier and is
-- explicitly out of scope.
--
-- notified_at backs the single-email rule: one "you have new messages" mail per
-- unread streak, never again until that side opens the chat. See
-- api/notify-unread.js.
create table if not exists chat_reads (
  relationship_id text not null,
  side text not null check (side in ('principal', 'supplier')),
  last_read_at timestamptz not null default now(),
  notified_at timestamptz,
  primary key (relationship_id, side)
);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- The prototype keeps the permissive "anon full access" stance documented in
-- HANDOFF.md §3: there is no login, so the app holds the anon key and isolation
-- is enforced in the query layer (every read is scoped by relationship_id).
-- DO NOT carry these policies into production.
alter table chat_messages enable row level security;
alter table chat_reads enable row level security;

drop policy if exists "anon full access" on chat_messages;
create policy "anon full access" on chat_messages for all using (true) with check (true);

drop policy if exists "anon full access" on chat_reads;
create policy "anon full access" on chat_reads for all using (true) with check (true);

-- ── Production policy (commented — do not enable in the prototype) ──────────
--
-- What real isolation looks like once suppliers and procurement staff sign in.
-- Two things change: membership becomes a lookup rather than a constant, and
-- the grants become select+insert only, so requirement 2 (insert-only, never
-- overwrite) is enforced by the database instead of by convention.
--
--   -- Who may see a conversation: a row per (relationship, user).
--   create table relationship_members (
--     relationship_id text not null,
--     user_id uuid not null references auth.users(id) on delete cascade,
--     side text not null check (side in ('principal', 'supplier')),
--     primary key (relationship_id, user_id)
--   );
--
--   alter table chat_messages enable row level security;
--
--   -- A principal never sees another principal's conversation: the subquery is
--   -- the whole of requirement 1.
--   create policy "members read own relationship" on chat_messages
--     for select using (
--       relationship_id in (
--         select relationship_id from relationship_members
--          where user_id = auth.uid()
--       )
--     );
--
--   -- Insert only into your own relationship, and only as yourself: author_side
--   -- must match the side you are a member on, so a supplier cannot post a
--   -- message that renders as though procurement wrote it.
--   create policy "members write own relationship" on chat_messages
--     for insert with check (
--       exists (
--         select 1 from relationship_members m
--          where m.user_id = auth.uid()
--            and m.relationship_id = chat_messages.relationship_id
--            and m.side = chat_messages.author_side
--       )
--     );
--
--   -- NO update policy and NO delete policy, deliberately. Messages are a
--   -- record; they are never edited or removed. System messages are written by
--   -- a trusted server role, which bypasses RLS.
--   --
--   -- One consequence to plan for: deleting an onboarding case currently
--   -- cascades its messages away (deleteOnboardingCase in LynkDataContext).
--   -- With no delete grant that cascade has to run through the service role on
--   -- the server, not from the browser.
--
--   -- Read state is per user, not per side, once there are real accounts.
--   create policy "members read marker" on chat_reads
--     for all using (
--       relationship_id in (
--         select relationship_id from relationship_members
--          where user_id = auth.uid()
--       )
--     );
