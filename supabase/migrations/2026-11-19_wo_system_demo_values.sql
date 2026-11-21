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

update suppliers set wo_system = 'SAP'
 where id in ('techparts', 'riedel')
   and stage = 'Supplier'
   and wo_system = 'Unknown';

with ranked as (
  select id, row_number() over (order by name) - 1 as rn
    from suppliers
   where stage = 'Supplier' and wo_system = 'Unknown'
)
update suppliers s
   set wo_system = (array['Planon','IBM Maximo','Aareon','Yardi','Haufe iX-Haus','MRI Software'])[(r.rn % 6) + 1]
  from ranked r
 where s.id = r.id;
