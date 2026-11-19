-- WO management system: demo values instead of 'Unknown'.
--
-- PO sync, 17 Nov 2026: the column is display-only for now and shows only
-- systems that can connect to Lynk. 'Unknown' should not appear. Everyone is
-- on Enable, with a couple of SAP rows as a showcase. New rows (invited
-- prospects) default to Enable too.
--
-- Run in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run.

alter table suppliers alter column wo_system set default 'Enable (Yarowa)';

update suppliers set wo_system = 'Enable (Yarowa)'
 where wo_system <> 'Enable (Yarowa)'
   and id not in ('techparts', 'riedel');

update suppliers set wo_system = 'SAP'
 where id in ('techparts', 'riedel');
