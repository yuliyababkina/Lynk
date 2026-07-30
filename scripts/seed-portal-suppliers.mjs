// Seeds the supplier-PORTAL personas into the database so the portal and the
// Procurement Manager app share ONE source of truth:
//   • supplier_martin_weber  — EuroBau Components GmbH (active Supplier)
//   • supplier_mehmet_yilmaz  — Yilmaz Elektrotechnik GmbH (Prospect, onboarding)
//
// Values mirror src/pages/portal/portal-data.ts (company + documents) so nothing
// visually changes — the data is just real and persisted now, and any document
// the supplier uploads from the portal lands in the same tables the PM reads.
// Idempotent: safe to re-run (upsert on id).
//
// Usage:
//   node --env-file=.env.local scripts/seed-portal-suppliers.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Run with --env-file=.env.local");
  process.exit(1);
}
const supabase = createClient(url, anonKey);

// Portal doc status → main-app DocStatus (src/types.ts).
const STATUS_MAP = { valid: "valid", expiring: "warning-60", "action-required": "pending-review" };

const PERSONAS = [
  {
    supplier: {
      id: "supplier_martin_weber",
      name: "EuroBau Components GmbH",
      stage: "Supplier",
      trade: "Building Components",
      region: "Berlin",
      compliance: "Pending Review",
      rating: null,
      open_tickets: 0,
      contacts: [
        { name: "Martin Weber", role: "Supplier Manager", email: "martin.weber@eurobau-components.de", phone: "+49 30 1234 042", primary: true },
      ],
      regions_served: ["Berlin", "Brandenburg"],
      capabilities: ["Structural Components", "Facade Systems"],
      vat_id: "DE 118 204 771",
      iban: "DE89 3704 0044 0532 0130 00",
      address: "Industriestraße 42, 10115 Berlin, Germany",
      last_active: "Today",
    },
    prefix: "eb",
    docs: [
      { n: "Certificate of Incorporation", cat: "Legal", exp: "Jan 2028", st: "valid" },
      { n: "VAT Registration Certificate", cat: "Tax", exp: "Ongoing", st: "valid" },
      { n: "ISO 9001 Certificate", cat: "Quality", exp: "14 Nov 2026", st: "valid" },
      { n: "Public Liability Insurance", cat: "Insurance", exp: "6 Aug 2026", st: "expiring" },
      { n: "Trade Licence", cat: "Legal", exp: "31 Jan 2027", st: "valid" },
      { n: "Conflict Minerals Declaration", cat: "Compliance", exp: "30 Sep 2026", st: "valid" },
    ],
  },
  {
    supplier: {
      id: "supplier_mehmet_yilmaz",
      name: "Yilmaz Elektrotechnik GmbH",
      stage: "Prospect",
      trade: "Electrical",
      region: "NRW",
      compliance: "Pending Review",
      rating: null,
      open_tickets: 1,
      contacts: [
        { name: "Mehmet Yilmaz", role: "Supplier Manager", email: "mehmet.yilmaz@yilmaz-elektrotechnik.de", phone: "+49 203 1234 062", primary: true },
      ],
      regions_served: ["NRW"],
      capabilities: ["Electrical Installation", "Building Automation"],
      vat_id: "DE 294 817 532",
      iban: "DE89 3704 0044 0532 0130 00",
      address: "Mülheimer Straße 62, 47057 Duisburg, Germany",
      last_active: "Today",
    },
    prefix: "yz",
    docs: [
      { n: "Certificate of Incorporation", cat: "Legal", exp: "Ongoing", st: "valid" },
      { n: "VAT Registration Certificate", cat: "Tax", exp: "Ongoing", st: "valid" },
      { n: "Trade Licence", cat: "Legal", exp: "Pending review", st: "action-required" },
    ],
  },
];

for (const { supplier, prefix, docs } of PERSONAS) {
  const sup = await supabase.from("suppliers").upsert(supplier);
  if (sup.error) {
    console.error(`✗ supplier ${supplier.id} failed:`, sup.error.message);
    process.exit(1);
  }
  console.log(`✓ supplier ${supplier.id} — ${supplier.name} (${supplier.stage})`);

  const rows = docs.map((d, i) => ({
    id: `doc-${prefix}-${i + 1}`,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    trade: supplier.trade,
    document_name: d.n,
    document_category: d.cat,
    expiry_date: d.exp,
    days_until_expiry: 0,
    status: STATUS_MAP[d.st],
    history: [],
  }));
  const docRes = await supabase.from("supplier_docs").upsert(rows);
  if (docRes.error) {
    console.error(`✗ supplier_docs for ${supplier.id} failed:`, docRes.error.message);
    process.exit(1);
  }
  console.log(`  ✓ ${rows.length} supplier_docs rows`);

  // Prospects appear in the Procurement Manager's Onboarding list. Uses the
  // same deterministic id (`onb-<supplierId>`) the submit flow upserts, so this
  // seed and a live submission converge on one row instead of duplicating.
  if (supplier.stage === "Prospect") {
    const onb = await supabase.from("onboarding_cases").upsert({
      id: `onb-${supplier.id}`,
      company_name: supplier.name,
      contact_name: supplier.contacts[0]?.name ?? "",
      status: "In Review",
      days_no_response: 0,
      criticality: "medium",
    });
    if (onb.error) {
      console.error(`✗ onboarding_case for ${supplier.id} failed:`, onb.error.message);
      process.exit(1);
    }
    console.log(`  ✓ onboarding_case (In Review)`);
  }
}

console.log("\nDone.");
