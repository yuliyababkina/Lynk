-- WO management system: real values instead of 'Unknown'.
--
-- Rewritten 21 Nov 2026 before it was ever run on prod. The first version put
-- everyone on Enable, which would have erased who was a Service Provider.
--
-- Rules (UX sync, 20 Nov 2026):
--   • Enable (Yarowa) = former Service Providers. 2026-11-17_add_wo_system.sql
--     already moved them to stage 'Supplier' + Enable; this file leaves them alone.
--   • SAP = TechParts Europa AG and Riedel Fertigungen GmbH (showcase).
--   • Every other supplier gets one of the existing systems from WO_SYSTEMS.
--     No new value is added.
--   • Prospects keep 'Unknown' (system not known yet); the table shows "—".
--   • New rows default to 'Unknown' again, so invited prospects show "—".
--
-- Requires 2026-11-17_add_wo_system.sql. Run in the Supabase SQL editor.
-- Safe to re-run: it only touches suppliers that are still 'Unknown'.

alter table suppliers alter column wo_system set default 'Unknown';

-- One statement, so the SQL editor can't run only part of it.
update suppliers s
   set wo_system = case
         when s.id in ('techparts', 'riedel') then 'SAP'
         else (array['Planon','IBM Maximo','Aareon','Yardi','Haufe iX-Haus','MRI Software'])[(r.rn % 6) + 1]
       end
  from (
    select id, row_number() over (order by name) - 1 as rn
      from suppliers
     where stage = 'Supplier' and wo_system = 'Unknown'
  ) r
 where s.id = r.id
returning s.id, s.name, s.wo_system;
