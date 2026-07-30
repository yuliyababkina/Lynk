-- Document metadata captured at upload time and shown in the PM review.
--
-- The uploader (supplier) confirms these fields after the app pre-fills them
-- from the document, so every file carries a reviewed type / issuer / validity.
-- Run in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- Safe to re-run.

alter table supplier_docs add column if not exists document_type text;
alter table supplier_docs add column if not exists issuing_institution text;
-- Some documents (VAT registration, incorporation certificates) never expire.
alter table supplier_docs add column if not exists does_not_expire boolean not null default false;
-- True once a human reviewed the pre-filled values instead of accepting them blindly.
alter table supplier_docs add column if not exists metadata_confirmed boolean not null default false;
