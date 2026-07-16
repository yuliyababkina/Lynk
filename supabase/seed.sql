-- Lynk prototype seed data
-- Run this AFTER schema.sql, in the Supabase SQL editor.
--
-- Contents: the 10 suppliers already used in reviewed/known test scenarios
-- (BauParts, Riedel, Zimmer, etc. — unchanged, same ids/names/story beats)
-- plus 20 new suppliers designed to cover every stage / compliance / doc /
-- contract / data-governance / onboarding status the UI knows how to render,
-- so a usability test has enough variety to poke at every ticket type.
--
-- Re-running this file is safe — it truncates first.

truncate table activity_log, catalogue_suppliers, catalogues, onboarding_cases,
  data_governance_requests, contracts, supplier_docs, tickets, suppliers
  restart identity cascade;

-- ─────────────────────────────────────────────────────────────────────────
-- SUPPLIERS (30 total: 8 Prospect, 17 Supplier, 5 Provider)
-- ─────────────────────────────────────────────────────────────────────────

insert into suppliers (id, name, stage, trade, region, compliance, rating, open_tickets, contacts, regions_served, capabilities, vat_id, iban, address, last_active) values
-- ── existing 10 (unchanged) ──
('novak', 'Novak Installationstechnik', 'Prospect', 'Electrical', 'Bavaria', '—', null, 1,
  '[{"name":"Josef Novak","role":"Owner","email":"josef@novak-installation.de","phone":"+49 89 1234 001","primary":true}]',
  '{Bavaria}', '{"Electrical installation"}', null, null, null, '14 days ago'),
('werner', 'Werner & Co KG', 'Prospect', 'HVAC', 'Baden-Württemberg', '—', null, 0,
  '[{"name":"Annika Werner","role":"Owner","email":"annika@werner-co.de","phone":"+49 711 1234 002","primary":true}]',
  '{Baden-Württemberg}', '{HVAC}', null, null, null, '3 days ago'),
('bauer', 'Bauer Sanitär GmbH', 'Prospect', 'Plumbing', 'NRW', '—', null, 1,
  '[{"name":"Klaus Bauer","role":"Owner","email":"klaus@bauer-sanitaer.de","phone":"+49 211 1234 003","primary":true}]',
  '{NRW}', '{Plumbing}', null, null, null, '31 days ago'),
('bauparts', 'BauParts GmbH', 'Supplier', 'Construction', 'Bavaria', 'Pending Review', 74, 4,
  '[{"name":"Laura Heinz","role":"Procurement Lead","email":"laura.heinz@bauparts.de","phone":"+49 89 4521 3300","primary":true},{"name":"Klaus Bauer","role":"Finance Director","email":"k.bauer@bauparts-gmbh.de","phone":"+49 89 4521 3310"}]',
  '{Bavaria,"Baden-Württemberg"}', '{"Concrete formwork","Steel erection","Scaffold supply","Safety barriers"}',
  'DE289347821', '•••• •••• •••• •••• 130 00', 'Industriestraße 44, 80807 München', '2 days ago'),
('techparts', 'TechParts Europa AG', 'Supplier', 'Electronics', 'Hesse', 'Fully Compliant', 92, 1,
  '[{"name":"Stefan Gruber","role":"Procurement Lead","email":"stefan.gruber@techparts.eu","phone":"+49 69 1234 004","primary":true}]',
  '{Hesse,Bavaria}', '{"Electronics assembly"}', null, null, null, '1 day ago'),
('riedel', 'Riedel Fertigungen GmbH', 'Supplier', 'Manufacturing', 'Saxony', 'Blocked', 58, 3,
  '[{"name":"Petra Riedel","role":"Owner","email":"petra.riedel@riedel-fertigungen.de","phone":"+49 341 1234 005","primary":true}]',
  '{Saxony}', '{"Precision manufacturing"}', null, null, null, '8 days ago'),
('heckmann', 'Heckmann & Söhne GmbH', 'Supplier', 'Logistics', 'NRW', 'Fully Compliant', 89, 0,
  '[{"name":"Tobias Heckmann","role":"Owner","email":"tobias@heckmann-soehne.de","phone":"+49 211 1234 006","primary":true}]',
  '{NRW,Hesse}', '{"Freight logistics"}', 'DE305817442', null, 'Industriestraße 48, 40231 Düsseldorf, Germany', '5 days ago'),
('muellerlogistik', 'Müller Logistik KG', 'Supplier', 'Logistics', 'Bavaria', 'Pending Review', 71, 3,
  '[{"name":"Frank Müller","role":"Owner","email":"frank@mueller-logistik.de","phone":"+49 89 1234 007","primary":true}]',
  '{Bavaria}', '{Warehousing,Freight}', null, null, null, '7 days ago'),
('schmidt', 'Schmidt Consulting GmbH', 'Provider', 'Consulting', 'Berlin', 'Fully Compliant', 97, 0,
  '[{"name":"Birgit Schmidt","role":"Owner","email":"birgit@schmidt-consulting.de","phone":"+49 30 1234 008","primary":true}]',
  '{"All Germany"}', '{"Process consulting"}', null, null, null, '12 days ago'),
('zimmer', 'Zimmer IT Services', 'Provider', 'IT Services', 'Hamburg', 'Action Required', 80, 2,
  '[{"name":"Dominik Zimmer","role":"Owner","email":"dominik@zimmer-it.de","phone":"+49 40 1234 009","primary":true}]',
  '{Hamburg}', '{"IT support"}', null, null, null, '2 days ago'),

-- ── 5 new Prospects ──
('sommer', 'Sommer Fenstertechnik', 'Prospect', 'Windows & Glazing', 'Hesse', '—', null, 1,
  '[{"name":"Renate Sommer","role":"Owner","email":"renate@sommer-fenster.de","phone":"+49 69 1234 010","primary":true}]',
  '{Hesse}', '{Glazing}', null, null, null, '5 days ago'),
('kraemer', 'Krämer Kälteanlagen', 'Prospect', 'HVAC', 'NRW', '—', null, 1,
  '[{"name":"Uwe Krämer","role":"Owner","email":"uwe@kraemer-kaelte.de","phone":"+49 211 1234 011","primary":true}]',
  '{NRW}', '{Refrigeration}', null, null, null, '9 days ago'),
('baumann', 'Baumann Trockenbau', 'Prospect', 'Drywall', 'Berlin', '—', null, 1,
  '[{"name":"Sandra Baumann","role":"Owner","email":"sandra@baumann-trockenbau.de","phone":"+49 30 1234 012","primary":true}]',
  '{Berlin}', '{Drywall}', null, null, null, '40 days ago'),
('ziegler', 'Ziegler Bodenbeläge', 'Prospect', 'Flooring', 'Bavaria', '—', null, 1,
  '[{"name":"Martin Ziegler","role":"Owner","email":"martin@ziegler-boeden.de","phone":"+49 89 1234 013","primary":true}]',
  '{Bavaria}', '{Flooring}', null, null, null, '1 day ago'),
('vogt', 'Vogt Sicherheitstechnik', 'Prospect', 'Security Systems', 'Hamburg', '—', null, 1,
  '[{"name":"Nadine Vogt","role":"Owner","email":"nadine@vogt-sicherheit.de","phone":"+49 40 1234 014","primary":true}]',
  '{Hamburg}', '{"Security systems"}', null, null, null, '20 days ago'),

-- ── 12 new Suppliers ──
('vogel', 'Vogel Dachtechnik GmbH', 'Supplier', 'Roofing', 'NRW', 'Fully Compliant', 95, 0,
  '[{"name":"Hans Vogel","role":"Owner","email":"hans@vogel-dach.de","phone":"+49 211 1234 015","primary":true}]',
  '{NRW}', '{"Roof installation","Storm damage repair"}', null, null, null, '3 days ago'),
('krueger', 'Krüger Elektro GmbH', 'Supplier', 'Electrical', 'Hesse', 'Pending Review', 68, 2,
  '[{"name":"Bernd Krüger","role":"Procurement Lead","email":"bernd@krueger-elektro.de","phone":"+49 69 1234 016","primary":true}]',
  '{Hesse}', '{"Electrical installation","Panel upgrades"}', null, null, null, '1 day ago'),
('fischer', 'Fischer Haustechnik GmbH', 'Supplier', 'HVAC', 'Bavaria', 'Fully Compliant', 91, 0,
  '[{"name":"Claudia Fischer","role":"Owner","email":"claudia@fischer-haustechnik.de","phone":"+49 89 1234 017","primary":true}]',
  '{Bavaria}', '{"HVAC installation"}', null, null, null, '6 days ago'),
('steinbach', 'Steinbach Bau GmbH', 'Supplier', 'Construction', 'Saxony', 'Blocked', 45, 3,
  '[{"name":"Jürgen Steinbach","role":"Owner","email":"juergen@steinbach-bau.de","phone":"+49 341 1234 018","primary":true}]',
  '{Saxony}', '{"General construction"}', null, null, null, '15 days ago'),
('lindemann', 'Lindemann Trockenbau GmbH', 'Supplier', 'Drywall', 'Berlin', 'Action Required', 77, 1,
  '[{"name":"Katrin Lindemann","role":"Owner","email":"katrin@lindemann-trockenbau.de","phone":"+49 30 1234 019","primary":true}]',
  '{Berlin}', '{Drywall,Insulation}', null, null, null, '4 days ago'),
('brandt', 'Brandt Malerbetrieb', 'Supplier', 'Painting', 'Bavaria', 'Fully Compliant', 88, 0,
  '[{"name":"Michael Brandt","role":"Owner","email":"michael@brandt-maler.de","phone":"+49 89 1234 020","primary":true}]',
  '{Bavaria}', '{"Interior painting","Facade painting"}', null, null, null, '2 days ago'),
('wolff', 'Wolff Gerüstbau GmbH', 'Supplier', 'Scaffolding', 'NRW', 'Pending Review', 72, 2,
  '[{"name":"Peter Wolff","role":"Finance Director","email":"peter@wolff-geruest.de","phone":"+49 211 1234 021","primary":true}]',
  '{NRW}', '{"Scaffolding setup"}', 'DE774213890', '•••• •••• •••• •••• 220 00', 'Ruhrstraße 12, 44135 Dortmund', '2 days ago'),
('hoffmann', 'Hoffmann Gartenbau GmbH', 'Supplier', 'Landscaping', 'Baden-Württemberg', 'Fully Compliant', 90, 0,
  '[{"name":"Sabine Hoffmann","role":"Owner","email":"sabine@hoffmann-garten.de","phone":"+49 711 1234 022","primary":true}]',
  '{"Baden-Württemberg"}', '{Landscaping}', null, null, null, '9 days ago'),
('schuster', 'Schuster Rohrtechnik GmbH', 'Supplier', 'Piping', 'Hesse', 'Pending Review', 69, 1,
  '[{"name":"Anna Schuster","role":"Owner","email":"anna@schuster-rohr.de","phone":"+49 69 1234 023","primary":true}]',
  '{Hesse}', '{"Pipe installation","Pressure testing"}', null, null, null, '3 days ago'),
('krause', 'Krause Zimmerei GmbH', 'Supplier', 'Carpentry', 'Bavaria', 'Fully Compliant', 85, 0,
  '[{"name":"Wolfgang Krause","role":"Owner","email":"wolfgang@krause-zimmerei.de","phone":"+49 89 1234 024","primary":true}]',
  '{Bavaria}', '{Carpentry,"Roof framing"}', null, null, null, '11 days ago'),
('keller', 'Keller Renovierungen GmbH', 'Supplier', 'Renovation', 'Berlin', 'Fully Compliant', 82, 0,
  '[{"name":"Julia Keller","role":"Owner","email":"julia@keller-renovierung.de","phone":"+49 30 1234 025","primary":true}]',
  '{Berlin}', '{Renovation}', null, null, null, '6 days ago'),
('thiel', 'Thiel Metallbau GmbH', 'Supplier', 'Manufacturing', 'Saxony', 'Blocked', 55, 2,
  '[{"name":"Robert Thiel","role":"Owner","email":"robert@thiel-metallbau.de","phone":"+49 341 1234 026","primary":true}]',
  '{Saxony}', '{"Steel fabrication"}', null, null, null, '3 days ago'),

-- ── 3 new Providers ──
('neumann', 'Neumann Sicherheitsdienst GmbH', 'Provider', 'Security Services', 'Berlin', 'Fully Compliant', 93, 0,
  '[{"name":"Thomas Neumann","role":"Owner","email":"thomas@neumann-sicherheit.de","phone":"+49 30 1234 027","primary":true}]',
  '{Berlin}', '{"Site security"}', null, null, null, '4 days ago'),
('lang', 'Lang Gebäudereinigung GmbH', 'Provider', 'Cleaning Services', 'Hamburg', 'Action Required', 61, 2,
  '[{"name":"Monika Lang","role":"Owner","email":"monika@lang-reinigung.de","phone":"+49 40 1234 028","primary":true}]',
  '{Hamburg}', '{"Facility cleaning"}', null, null, null, '1 day ago'),
('peters', 'Peters Facility Management GmbH', 'Provider', 'Facility Management', 'NRW', 'Fully Compliant', 87, 0,
  '[{"name":"Andreas Peters","role":"Owner","email":"andreas@peters-fm.de","phone":"+49 211 1234 029","primary":true}]',
  '{NRW}', '{"Facility management"}', null, null, null, '7 days ago');

-- ─────────────────────────────────────────────────────────────────────────
-- COMPLIANCE DOCUMENTS
-- ─────────────────────────────────────────────────────────────────────────

insert into supplier_docs (id, supplier_id, supplier_name, trade, document_name, document_category, expiry_date, days_until_expiry, status, auto_notified, status_note, renewal, history) values
('doc-001','riedel','Riedel Fertigungen GmbH','Manufacturing','Public Liability Insurance','Insurance','10 Jun 2026',-8,'blocked','11 May 2026',
  'Riedel Fertigungen GmbH cannot be assigned new work orders until this document is renewed and accepted. A renewal has been uploaded and is awaiting your review.',
  '{"fileName":"riedel_liability_renewal_2026.pdf","fileSize":"1.2 MB","uploadedAt":"13 Jun 2026, 09:44","uploadedBy":"Petra Riedel"}',
  '[{"date":"10 Dec 2025","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"11 Apr 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"15 Apr 2026","event":"Manual reminder sent","actor":"Sabine Müller","type":"reminder"},{"date":"11 May 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"},{"date":"11 Jun 2026","event":"Document expired — supplier blocked from work orders","actor":"System","type":"blocked"},{"date":"13 Jun 2026","event":"Renewal document uploaded by supplier","actor":"Petra Riedel","type":"upload"}]'),
('doc-002','bauparts','BauParts GmbH','Construction','Conflict Minerals Declaration','Compliance','30 Sep 2026',104,'rejected-resubmit',null,
  'The submitted declaration was rejected during review. BauParts GmbH has been asked to correct and resubmit the document.', null,
  '[{"date":"02 Feb 2026","event":"Document uploaded by supplier","actor":"Jonas Bauer","type":"upload"},{"date":"05 Feb 2026","event":"Rejected — incomplete smelter list","actor":"Sabine Müller","type":"blocked"}]'),
('doc-003','bauparts','BauParts GmbH','Construction','ISO 9001 Certificate','Certification','18 Jul 2026',30,'pending-review','18 Jun 2026',
  'A renewed certificate has been uploaded ahead of expiry and is awaiting your review before it replaces the current version.',
  '{"fileName":"bauparts_iso9001_2026.pdf","fileSize":"860 KB","uploadedAt":"20 Jun 2026, 14:12","uploadedBy":"Jonas Bauer"}',
  '[{"date":"18 Jul 2023","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"18 May 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"18 Jun 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"},{"date":"20 Jun 2026","event":"Renewal document uploaded by supplier","actor":"Jonas Bauer","type":"upload"}]'),
('doc-004','muellerlogistik','Müller Logistik KG','Logistics','Trade Licence','Licence','6 Aug 2026',49,'warning-60',null,
  'This document expires within 60 days. The supplier has been notified to upload a renewal.', null,
  '[{"date":"06 Aug 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"07 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"}]'),
('doc-005','zimmer','Zimmer IT Services','IT Services','Cyber Liability Insurance','Insurance','12 Aug 2026',55,'warning-60',null,
  'This document expires within 60 days. The supplier has been notified to upload a renewal.', null,
  '[{"date":"12 Aug 2025","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"13 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"}]'),
('doc-008','werner','Werner & Co KG','Construction','Environmental Permit','Compliance','5 Aug 2026',26,'warning-30','6 Jul 2026',
  'This document expires within 30 days. The 30-day auto-notification has been sent to the supplier portal.', null,
  '[{"date":"05 Aug 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"06 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"06 Jul 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"}]'),
('doc-006','bauparts','BauParts GmbH','Construction','Trade Licence','Licence','31 Aug 2026',74,'warning-60',null,
  'This document expires within 60 days. The supplier has been notified to upload a renewal.', null,
  '[{"date":"31 Aug 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"18 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"}]'),
('doc-007','techparts','TechParts Europa AG','Electronics','ISO 9001 Certificate','Certification','14 Dec 2026',179,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"14 Dec 2025","event":"Document verified — valid","actor":"System","type":"verified"}]'),

-- new docs for the 20 new suppliers
('doc-009','steinbach','Steinbach Bau GmbH','Construction','Public Liability Insurance','Insurance','25 Jun 2026',-15,'blocked','26 May 2026',
  'Steinbach Bau GmbH cannot be assigned new work orders until this document is renewed and accepted.', null,
  '[{"date":"25 Jun 2025","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"26 Apr 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"26 May 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"},{"date":"25 Jun 2026","event":"Document expired — supplier blocked from work orders","actor":"System","type":"blocked"}]'),
('doc-010','steinbach','Steinbach Bau GmbH','Construction','Conflict Minerals Declaration','Compliance','15 Oct 2026',119,'rejected-resubmit',null,
  'The submitted declaration was rejected during review. Steinbach Bau GmbH has been asked to correct and resubmit the document.', null,
  '[{"date":"01 Mar 2026","event":"Document uploaded by supplier","actor":"Jürgen Steinbach","type":"upload"},{"date":"04 Mar 2026","event":"Rejected — missing signature page","actor":"Sabine Müller","type":"blocked"}]'),
('doc-011','thiel','Thiel Metallbau GmbH','Manufacturing','Public Liability Insurance','Insurance','7 Jul 2026',-3,'blocked','8 Jun 2026',
  'Thiel Metallbau GmbH cannot be assigned new work orders until this document is renewed and accepted.', null,
  '[{"date":"07 Jul 2025","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"08 May 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"08 Jun 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"},{"date":"07 Jul 2026","event":"Document expired — supplier blocked from work orders","actor":"System","type":"blocked"}]'),
('doc-012','krueger','Krüger Elektro GmbH','Electrical','ISO 9001 Certificate','Certification','9 Jul 2026',21,'pending-review','9 Jun 2026',
  'A renewed certificate has been uploaded ahead of expiry and is awaiting your review before it replaces the current version.',
  '{"fileName":"krueger_iso9001_2026.pdf","fileSize":"740 KB","uploadedAt":"25 Jun 2026, 10:05","uploadedBy":"Bernd Krüger"}',
  '[{"date":"09 Jul 2023","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"09 May 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"09 Jun 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"},{"date":"25 Jun 2026","event":"Renewal document uploaded by supplier","actor":"Bernd Krüger","type":"upload"}]'),
('doc-013','wolff','Wolff Gerüstbau GmbH','Scaffolding','Environmental Permit','Compliance','2 Aug 2026',23,'warning-30','3 Jul 2026',
  'This document expires within 30 days. The 30-day auto-notification has been sent to the supplier portal.', null,
  '[{"date":"02 Aug 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"03 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"03 Jul 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"}]'),
('doc-014','lang','Lang Gebäudereinigung GmbH','Cleaning Services','ISO 45001 Certificate','Certification','30 Jul 2026',20,'warning-30','1 Jul 2026',
  'This document expires within 30 days. The 30-day auto-notification has been sent to the supplier portal.', null,
  '[{"date":"30 Jul 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"31 May 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"01 Jul 2026","event":"30-day auto-notification sent to supplier portal","actor":"System","type":"notification"}]'),
('doc-015','krueger','Krüger Elektro GmbH','Electrical','Trade Licence','Licence','23 Aug 2026',55,'warning-60',null,
  'This document expires within 60 days. The supplier has been notified to upload a renewal.', null,
  '[{"date":"23 Aug 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"24 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"}]'),
('doc-016','lindemann','Lindemann Trockenbau GmbH','Drywall','Cyber Liability Insurance','Insurance','26 Aug 2026',58,'warning-60',null,
  'This document expires within 60 days. The supplier has been notified to upload a renewal.', null,
  '[{"date":"26 Aug 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"27 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"}]'),
('doc-017','schuster','Schuster Rohrtechnik GmbH','Piping','Trade Licence','Licence','12 Aug 2026',44,'pending-review','13 Jun 2026',
  'A renewed licence has been uploaded and is awaiting your review before it replaces the current version.',
  '{"fileName":"schuster_licence_2026.pdf","fileSize":"410 KB","uploadedAt":"28 Jun 2026, 08:30","uploadedBy":"Anna Schuster"}',
  '[{"date":"12 Aug 2024","event":"Document verified — valid","actor":"System","type":"verified"},{"date":"13 Jun 2026","event":"60-day expiry warning triggered","actor":"System","type":"warning"},{"date":"28 Jun 2026","event":"Renewal document uploaded by supplier","actor":"Anna Schuster","type":"upload"}]'),
('doc-018','vogel','Vogel Dachtechnik GmbH','Roofing','ISO 9001 Certificate','Certification','2 Mar 2027',235,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"02 Mar 2026","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-019','fischer','Fischer Haustechnik GmbH','HVAC','Trade Licence','Licence','19 Apr 2027',283,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"19 Apr 2026","event":"Document verified — valid","actor":"System","type":"verified"}]'),

-- Heckmann & Söhne GmbH's full compliance pack — the worked example for
-- attaching real files (see scripts/upload-supplier-documents.mjs, which
-- fills in file_path/file_url for these six rows after upload).
('doc-020','heckmann','Heckmann & Söhne GmbH','Logistics','Certificate of Incorporation','Legal','31 Dec 2030',1632,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"12 Jan 2026","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-021','heckmann','Heckmann & Söhne GmbH','Logistics','VAT Registration Certificate','Tax','31 Dec 2030',1632,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"12 Jan 2026","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-022','heckmann','Heckmann & Söhne GmbH','Logistics','ISO 9001 Certificate','Certification','20 Mar 2027',250,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"20 Mar 2026","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-023','heckmann','Heckmann & Söhne GmbH','Logistics','Public Liability Insurance','Insurance','30 Nov 2026',140,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"30 Nov 2025","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-024','heckmann','Heckmann & Söhne GmbH','Logistics','Trade Licence','Licence','14 Feb 2027',215,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"14 Feb 2026","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-025','heckmann','Heckmann & Söhne GmbH','Logistics','Conflict Minerals Declaration','Compliance','01 Oct 2026',80,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"01 Oct 2025","event":"Document verified — valid","actor":"System","type":"verified"}]'),

-- Steinbach Bau GmbH — remaining compliance pack (doc-009/doc-010 above hold
-- the blocked + rejected docs; these four are the valid documents on file).
('doc-026','steinbach','Steinbach Bau GmbH','Construction','Certificate of Incorporation','Legal','31 Dec 2030',1629,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"08 Feb 2024","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-027','steinbach','Steinbach Bau GmbH','Construction','VAT Registration Certificate','Tax','31 Dec 2030',1629,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"08 Feb 2024","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-028','steinbach','Steinbach Bau GmbH','Construction','ISO 9001 Certificate','Certification','20 Mar 2027',247,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"20 Mar 2024","event":"Document verified — valid","actor":"System","type":"verified"}]'),
('doc-029','steinbach','Steinbach Bau GmbH','Construction','Trade Licence','Licence','15 May 2027',303,'valid',null,
  'This document is valid and no action is required.', null,
  '[{"date":"15 May 2024","event":"Document verified — valid","actor":"System","type":"verified"}]');

-- ─────────────────────────────────────────────────────────────────────────
-- CONTRACTS
-- ─────────────────────────────────────────────────────────────────────────

insert into contracts (id, supplier_name, ref, type, annual_value, end_date, renewal_by, notice_period, time_left_label, status) values
('c1','BauParts GmbH','FWK-2024-0047','Framework',480000,'30 Jun 2026','31 Mar 2026','90d','12d left','Renewal Urgent'),
('c2','TechParts Europa AG','MSA-2023-0031','Master Supply',1240000,'31 Aug 2026','31 May 2026','90d','74d left','Expiring Soon'),
('c3','Heckmann & Söhne GmbH','SVC-2025-0012','Service Agreement',320000,'31 Dec 2026','30 Sep 2026','90d','196d left','Active'),
('c4','Schmidt Consulting GmbH','SVC-2024-0069','Service Agreement',96000,'31 Mar 2027','31 Dec 2026','90d','287d left','Active'),
('c5','Zimmer IT Services','SVC-2022-0044','Service Agreement',180000,'28 Feb 2024','30 Nov 2023','—','Expired','Renewal in Progress'),
('c6','Riedel Fertigungen GmbH','FWK-2022-0018','Framework',210000,'31 May 2024','28 Feb 2024','—','Opted out','Opted Out'),
('c7','Thiel Metallbau GmbH','FWK-2025-0099','Framework',265000,'18 Jul 2026','19 Apr 2026','90d','8d left','Renewal Urgent'),
('c8','Vogel Dachtechnik GmbH','SVC-2026-0031','Service Agreement',140000,'31 Jan 2027','31 Oct 2026','90d','205d left','Active'),
('c9','Peters Facility Management GmbH','SVC-2023-0077','Service Agreement',410000,'28 Sep 2026','30 Jun 2026','90d','80d left','Expiring Soon'),
('c10','Neumann Sicherheitsdienst GmbH','SVC-2021-0015','Service Agreement',150000,'31 Jan 2024','31 Oct 2023','—','Expired','Renewal in Progress'),
('c11','Krause Zimmerei GmbH','FWK-2026-0002','Framework',98000,'31 Dec 2027','30 Sep 2027','90d','539d left','Active');

-- ─────────────────────────────────────────────────────────────────────────
-- DATA GOVERNANCE REQUESTS
-- ─────────────────────────────────────────────────────────────────────────

insert into data_governance_requests (id, supplier_name, category, risk, requested_by, requested_at, reason, fields, status, approval_step) values
('dgr-1','BauParts GmbH','Payment Data','Critical','Laura Heinz','18 Jun 2026, 09:14',
  'Company bank account migrated to DKB following merger with Bau Group Holding.',
  '[{"label":"IBAN","before":"•••• •••• •••• •••• 130 00","after":"DE45 1203 0000 1020 3040 50","sensitive":true},{"label":"Bank Name","before":"Commerzbank AG","after":"Deutsche Kreditbank AG"},{"label":"BIC / SWIFT","before":"COBADEFFXXX","after":"BELADEBEXXX"}]',
  'Awaiting Review', 1),
('dgr-2','Wolff Gerüstbau GmbH','Payment Data','Critical','Peter Wolff','22 Jun 2026, 11:40',
  'Switching business banking provider for lower transfer fees on cross-border supplier payments.',
  '[{"label":"IBAN","before":"•••• •••• •••• •••• 220 00","after":"DE12 5001 0517 0648 4898 90","sensitive":true},{"label":"Bank Name","before":"Sparkasse Dortmund","after":"N26 Bank AG"}]',
  'Endorsed — Awaiting 2nd Approval', 2),
('dgr-3','Krüger Elektro GmbH','Contact Data','Standard','Bernd Krüger','02 May 2026, 15:00',
  'Primary contact changed after internal reorganisation.',
  '[{"label":"Primary Contact","before":"Elke Krüger","after":"Bernd Krüger"},{"label":"Email","before":"elke@krueger-elektro.de","after":"bernd@krueger-elektro.de"}]',
  'Approved', 2),
('dgr-4','Lang Gebäudereinigung GmbH','Payment Data','Critical','Monika Lang','10 Jun 2026, 08:20',
  'Requested IBAN update could not be verified against the registered company name.',
  '[{"label":"IBAN","before":"•••• •••• •••• •••• 410 00","after":"DE98 2004 1155 0000 1234 00","sensitive":true}]',
  'Rejected', 1);

-- ─────────────────────────────────────────────────────────────────────────
-- ONBOARDING CASES
-- ─────────────────────────────────────────────────────────────────────────

insert into onboarding_cases (id, company_name, contact_name, status, days_no_response, criticality) values
('onb-1','Bauer Sanitär GmbH','Klaus Bauer','Stale',31,'high'),
('onb-2','Novak Installationstechnik','Josef Novak','Pending',14,'medium'),
('onb-3','Werner & Co KG','Annika Werner','Opened',3,'low'),
('onb-4','Sommer Fenstertechnik','Renate Sommer','Opened',5,'low'),
('onb-5','Krämer Kälteanlagen','Uwe Krämer','Pending',9,'medium'),
('onb-6','Baumann Trockenbau','Sandra Baumann','Stale',40,'high'),
('onb-7','Ziegler Bodenbeläge','Martin Ziegler','Opened',1,'low'),
('onb-8','Vogt Sicherheitstechnik','Nadine Vogt','Pending',20,'medium');

-- ─────────────────────────────────────────────────────────────────────────
-- TICKETS (Task Queue) — 32 total across all criticalities/categories
-- ─────────────────────────────────────────────────────────────────────────

insert into tickets (id, title, criticality, entity_name, entity_type, age_label, primary_action, source, category, target_id) values
('t3','Conflict Minerals Declaration — rejected, resubmission pending','critical','Riedel Fertigungen GmbH','Supplier','12 days ago','Escalate','compliance-monitoring','Document compliance',null),
('t4','ISO 9001 Certificate — expiring in 30 days','high','BauParts GmbH','Supplier','1 day ago','Review','compliance-monitoring','Document compliance','doc-003'),
('t5','IBAN change request — awaiting first-eye endorsement','high','BauParts GmbH','Supplier','2 days ago','Approve','data-governance','Data governance','dgr-1'),
('t6','Invitation stale — 31 days without response','high','Bauer Sanitär GmbH','Prospect','31 days ago','Remind','onboarding','Onboarding','onb-1'),
('t7','Profile completeness 61% — below 65% threshold','high','Riedel Fertigungen GmbH','Supplier','5 days ago','Request','data-quality','Onboarding',null),
('t8','Master Supply Agreement MSA-2023-0031 — 74 days to expiry','high','TechParts Europa AG','Supplier','Today','Review','contracts','Contracts','c2'),
('t9','Trade Licence — expiring in 49 days','medium','Müller Logistik KG','Supplier','3 days ago','Remind','compliance-monitoring','Document compliance','doc-004'),
('t10','Cyber Liability Insurance — expiring in 55 days','medium','Zimmer IT Services','Service Provider','2 days ago','Remind','compliance-monitoring','Document compliance','doc-005'),
('t11','Invitation sent — 14 days without response','medium','Novak Installationstechnik','Prospect','14 days ago','Remind','onboarding','Onboarding','onb-2'),
('t12','Profile completeness 70% — below 80% target','medium','Müller Logistik KG','Supplier','7 days ago','Request','data-quality','Onboarding',null),
('t13','Trade Licence — expiring in 74 days','medium','BauParts GmbH','Supplier','1 day ago','Remind','compliance-monitoring','Document compliance','doc-006'),
('t14','Service Catalogue entry — draft, not yet approved','low','Müller Logistik KG','Supplier','4 days ago','Approve','data-quality','Service agreements',null),
('t15','Profile completeness 83% — below 85% preferred','low','Zimmer IT Services','Service Provider','10 days ago','Request','data-quality','Onboarding',null),

-- new tickets for the 20 new suppliers
('t16','Public Liability Insurance — expired 15 days ago','critical','Steinbach Bau GmbH','Supplier','15 days ago','Review','compliance-monitoring','Document compliance','doc-009'),
('t17','Conflict Minerals Declaration — rejected, resubmission pending','critical','Steinbach Bau GmbH','Supplier','12 days ago','Escalate','compliance-monitoring','Document compliance','doc-010'),
('t18','Public Liability Insurance — expired 3 days ago','critical','Thiel Metallbau GmbH','Supplier','3 days ago','Review','compliance-monitoring','Document compliance','doc-011'),
('t19','Framework Contract FWK-2025-0099 — 8 days to expiry','critical','Thiel Metallbau GmbH','Supplier','2 days ago','Renew','contracts','Contracts','c7'),
('t20','ISO 9001 Certificate — renewal awaiting review','high','Krüger Elektro GmbH','Supplier','1 day ago','Review','compliance-monitoring','Document compliance','doc-012'),
('t21','Environmental Permit — 30-day auto-notification sent','high','Wolff Gerüstbau GmbH','Supplier','3 days ago','Remind','compliance-monitoring','Document compliance','doc-013'),
('t22','IBAN change request — awaiting second-eye approval','high','Wolff Gerüstbau GmbH','Supplier','1 day ago','Approve','data-governance','Data governance','dgr-2'),
('t23','Profile completeness 55% — below 65% threshold','high','Wolff Gerüstbau GmbH','Supplier','6 days ago','Request','data-quality','Onboarding',null),
('t24','ISO 45001 Certificate — 30-day auto-notification sent','high','Lang Gebäudereinigung GmbH','Service Provider','2 days ago','Remind','compliance-monitoring','Document compliance','doc-014'),
('t25','Invitation stale — 40 days without response','high','Baumann Trockenbau','Prospect','40 days ago','Remind','onboarding','Onboarding','onb-6'),
('t26','Trade Licence — expiring in 55 days','medium','Krüger Elektro GmbH','Supplier','4 days ago','Remind','compliance-monitoring','Document compliance','doc-015'),
('t27','Cyber Liability Insurance — expiring in 58 days','medium','Lindemann Trockenbau GmbH','Supplier','5 days ago','Remind','compliance-monitoring','Document compliance','doc-016'),
('t28','Trade Licence — renewal awaiting review','medium','Schuster Rohrtechnik GmbH','Supplier','Today','Review','compliance-monitoring','Document compliance','doc-017'),
('t29','Service Agreement SVC-2023-0077 — 80 days to expiry','medium','Peters Facility Management GmbH','Service Provider','Today','Review','contracts','Contracts','c9'),
('t30','Invitation sent — 9 days without response','medium','Krämer Kälteanlagen','Prospect','9 days ago','Remind','onboarding','Onboarding','onb-5'),
('t31','Invitation sent — 20 days without response','medium','Vogt Sicherheitstechnik','Prospect','20 days ago','Remind','onboarding','Onboarding','onb-8'),
('t32','Profile completeness 80% — below 85% preferred','low','Lang Gebäudereinigung GmbH','Service Provider','8 days ago','Request','data-quality','Onboarding',null),
('t33','Invitation sent — 1 day without response','low','Ziegler Bodenbeläge','Prospect','1 day ago','Remind','onboarding','Onboarding','onb-7'),
('t34','Service Agreement SVC-2021-0015 — renewal in progress','low','Neumann Sicherheitsdienst GmbH','Service Provider','5 days ago','Review','contracts','Contracts','c10');

-- Workflow status spread (everything else defaults to 'To do'). None of the
-- critical tickets are resolved, so the Critical group keeps 5 active items.
update tickets set status = 'In progress' where id in ('t3','t18','t8','t20','t10','t28');
update tickets set status = 'Resolved', resolved = true, resolved_at = now() where id in ('t13','t15','t29','t32');

-- ─────────────────────────────────────────────────────────────────────────
-- SERVICE CATALOGUES (unchanged from the original prototype)
-- ─────────────────────────────────────────────────────────────────────────

insert into catalogues (id, name, trade, region, status, version_label, current_version, awaiting_first_response, valid_from, valid_to, response_model, services, versions) values
('cat-1','Catalog 1 Painting','Painting','Bavaria','Active','Version 3 (2026)','Version 3', false, '2026-01-01','2026-12-31','actively-agree',
  '[{"id":"svc-1","service":"Interior wall painting","category":"Interior","unit":"m²","rate":12.5},{"id":"svc-2","service":"Ceiling painting","category":"Interior","unit":"m²","rate":14.0},{"id":"svc-3","service":"Facade painting","category":"Exterior","unit":"m²","rate":22.8},{"id":"svc-4","service":"Primer application","category":"Preparation","unit":"m²","rate":6.4},{"id":"svc-5","service":"Wallpaper removal","category":"Preparation","unit":"m²","rate":8.9},{"id":"svc-6","service":"Lacquer work, doors","category":"Detail work","unit":"piece","rate":85.0},{"id":"svc-7","service":"Scaffolding setup","category":"Site setup","unit":"day","rate":240.0},{"id":"svc-8","service":"Travel surcharge","category":"Surcharges","unit":"flat","rate":45.0}]',
  '[{"version":"Version 3","publishedAt":"12 May 2026","note":"Rates updated for 2026"},{"version":"Version 2","publishedAt":"03 Nov 2025","note":"Added exterior services"},{"version":"Version 1","publishedAt":"18 Feb 2025","note":"Initial catalogue"}]'),
('cat-2','Catalog 2 Roofing','Roofing','NRW','Active','Version 1.1 (2025)','Version 1.1', true, '2025-06-01','2026-05-31','actively-disagree',
  '[{"id":"svc-r1","service":"Tile roof installation","category":"Installation","unit":"m²","rate":68.0},{"id":"svc-r2","service":"Roof insulation","category":"Insulation","unit":"m²","rate":42.5},{"id":"svc-r3","service":"Gutter replacement","category":"Drainage","unit":"m","rate":28.0},{"id":"svc-r4","service":"Leak inspection","category":"Maintenance","unit":"visit","rate":120.0},{"id":"svc-r5","service":"Storm damage repair","category":"Repair","unit":"hour","rate":74.0}]',
  '[{"version":"Version 1.1","publishedAt":"22 Apr 2025","note":"Corrected gutter rates"},{"version":"Version 1","publishedAt":"10 Mar 2025","note":"Initial catalogue"}]'),
('cat-3','Catalog 3 Piping','Piping','Hesse','Upcoming','Version 2.0 (2026)','Version 2.0', false, '2026-09-01','2027-08-31','actively-agree',
  '[{"id":"svc-p1","service":"Copper pipe installation","category":"Installation","unit":"m","rate":34.0},{"id":"svc-p2","service":"Pipe insulation","category":"Insulation","unit":"m","rate":12.0},{"id":"svc-p3","service":"Pressure testing","category":"Testing","unit":"test","rate":180.0},{"id":"svc-p4","service":"Emergency call-out","category":"Repair","unit":"visit","rate":150.0}]',
  '[{"version":"Version 2.0","publishedAt":"01 Jun 2026","note":"2026/27 season rates"},{"version":"Version 1","publishedAt":"15 Aug 2025","note":"Initial catalogue"}]'),
('cat-4','Catalog 4 Electrical','Electrical','Berlin','Draft','Version 1 (draft)','Version 1', true, '2026-10-01','2027-09-30','actively-agree',
  '[{"id":"svc-e1","service":"Socket installation","category":"Installation","unit":"piece","rate":48.0},{"id":"svc-e2","service":"Distribution board upgrade","category":"Installation","unit":"piece","rate":620.0},{"id":"svc-e3","service":"Safety inspection (E-Check)","category":"Testing","unit":"visit","rate":210.0}]',
  '[{"version":"Version 1","publishedAt":"—","note":"Draft, not yet shared"}]');

insert into catalogue_suppliers (catalogue_id, supplier_ref, name, region, confirmed) values
('cat-1','riedel','Riedel Fertigungen GmbH','Bavaria', true),
('cat-1','bauparts','BauParts GmbH','Bavaria', true),
('cat-1','muellerlogistik','Müller Logistik KG','Bavaria', true),
('cat-1','werner','Werner & Co KG','Bavaria', true),
('cat-1','bauer','Bauer Sanitär GmbH','Bavaria', false),
('cat-1','novak','Novak Installationstechnik','Bavaria', false),
('cat-2','heckmann','Heckmann & Söhne GmbH','NRW', false),
('cat-2','bauparts','BauParts GmbH','NRW', false),
('cat-2','schmidt','Schmidt Consulting GmbH','NRW', false),
('cat-2','techparts','TechParts Europa AG','NRW', false),
('cat-2','werner','Werner & Co KG','NRW', false),
('cat-2','zimmer','Zimmer IT Services','NRW', false),
('cat-3','bauer','Bauer Sanitär GmbH','Hesse', true),
('cat-3','novak','Novak Installationstechnik','Hesse', true),
('cat-3','heckmann','Heckmann & Söhne GmbH','Hesse', true),
('cat-3','muellerlogistik','Müller Logistik KG','Hesse', false),
('cat-3','riedel','Riedel Fertigungen GmbH','Hesse', false),
('cat-4','novak','Novak Installationstechnik','Berlin', false),
('cat-4','techparts','TechParts Europa AG','Berlin', false),
('cat-4','zimmer','Zimmer IT Services','Berlin', false);

insert into activity_log (actor, entity_name, action, detail) values
('System', null, 'Seed data loaded', '30 suppliers, 34 tickets — ready for usability testing.');
