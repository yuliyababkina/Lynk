// Uploads Mehmet Yilmaz's REAL compliance pack (supabase/mock-documents/yilmaz)
// to Storage and sets it as the supplier's document set — one row per type,
// each linked to its PDF, status `pending-review` (fresh submission awaiting the
// Procurement Manager's review). Replaces any existing Yilmaz docs so the set
// matches the pack exactly.
//
// Usage:
//   node --env-file=.env.local scripts/upload-yilmaz-documents.mjs

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Run with --env-file=.env.local");
  process.exit(1);
}
const supabase = createClient(url, anonKey);

const SUPPLIER_ID = "supplier_mehmet_yilmaz";
const SUPPLIER_NAME = "Yilmaz Elektrotechnik GmbH";
const TRADE = "Electrical";
const BUCKET = "supplier-documents";
const DIR = new URL("../supabase/mock-documents/yilmaz/", import.meta.url);
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

const DOCS = [
  { file: "Certificate_of_Incorporation.pdf", name: "Certificate of Incorporation", category: "Legal" },
  { file: "VAT_Registration_Certificate.pdf", name: "VAT Registration Certificate", category: "Tax" },
  { file: "Trade_Licence.pdf", name: "Trade Licence", category: "Legal" },
  { file: "Public_Liability_Insurance.pdf", name: "Public Liability Insurance", category: "Insurance" },
  { file: "ISO_9001_Certificate.pdf", name: "ISO 9001 Certificate", category: "Quality" },
  { file: "Conflict_Minerals_Declaration.pdf", name: "Conflict Minerals Declaration", category: "Compliance" },
];

// Start clean so the set matches the pack exactly.
const del = await supabase.from("supplier_docs").delete().eq("supplier_id", SUPPLIER_ID);
if (del.error) {
  console.error("✗ clearing existing docs failed:", del.error.message);
  process.exit(1);
}
console.log("• cleared existing Yilmaz documents");

for (const d of DOCS) {
  const s = slug(d.name);
  const storagePath = `${SUPPLIER_ID}/${s}.pdf`;
  const bytes = await readFile(new URL(d.file, DIR));

  const up = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) {
    console.error(`✗ upload ${d.file}:`, up.error.message);
    continue;
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const ins = await supabase.from("supplier_docs").insert({
    id: `doc-${SUPPLIER_ID}-${s}`,
    supplier_id: SUPPLIER_ID,
    supplier_name: SUPPLIER_NAME,
    trade: TRADE,
    document_name: d.name,
    document_category: d.category,
    expiry_date: null,
    days_until_expiry: 0,
    status: "pending-review",
    status_note: "Uploaded by supplier — awaiting review.",
    history: [{ date: "2026-07-28", event: `${d.name} uploaded`, actor: SUPPLIER_NAME, type: "upload" }],
    file_path: storagePath,
    file_url: pub.publicUrl,
  });
  if (ins.error) {
    console.error(`✗ link ${d.name}:`, ins.error.message);
    continue;
  }
  console.log(`✓ ${d.name} → ${pub.publicUrl}`);
}
console.log("\nDone.");
