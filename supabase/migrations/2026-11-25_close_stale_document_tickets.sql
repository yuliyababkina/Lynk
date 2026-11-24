-- LYNK-117 follow-up: close Task Queue tickets whose record is settled or missing.
--
-- Found 25 Nov 2026 against prod:
--   • t1 (doc-001), t4 (doc-003), t20 (doc-012) — the renewal was accepted and
--     the document is 'valid', but the ticket stayed 'To do'. The app now closes
--     a document's tickets whenever the document becomes valid
--     (LynkDataContext.closeDocumentTickets); these three predate that.
--   • t3 — "Conflict Minerals Declaration" for Riedel Fertigungen GmbH. Its
--     target_id is null and Riedel has no such document, so there is nothing
--     for the ticket to act on.
--
-- Run in the Supabase SQL editor. One statement, so the editor can't run only
-- part of it. Safe to re-run: the three document tickets are only closed while
-- their document is still valid, and t3 only while it is still open.

update tickets
set status = 'Resolved', resolved = true, resolved_at = now()
where status <> 'Resolved'
  and (
    (id = 't3' and target_id is null)
    or (id in ('t1', 't4', 't20')
        and target_id in (select id from supplier_docs where status = 'valid'))
  );
