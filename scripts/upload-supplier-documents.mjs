// Uploads real PDF files to Supabase Storage and links them to the matching
// supplier_docs rows (file_path / file_url) — the worked example is
// Heckmann & Söhne GmbH's mock compliance pack.
//
// Requires the same env vars as the app: VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY. Run schema.sql and seed.sql first (the doc rows
// referenced here — doc-020..doc-025 — must already exist).
//
// Usage:
//   node --env-file=.env.local scripts/upload-supplier-documents.mjs
//
// (Node < 20.6 without --env-file support: export the two vars yourself
// first, e.g. `export $(grep -v '^#' .env.local | xargs)`.)

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/upload-supplier-documents.mjs"
  );
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const BUCKET = "supplier-documents";
const MOCK_DIR = new URL("../supabase/mock-documents/", import.meta.url);

// One entry per file: the supplier folder under mock-documents/, which
// supplier_docs row it belongs to, and the local file name. The storage path
// is derived as `<folder>/<kebab-cased file name>`.
const MANIFEST = [
  // Heckmann & Söhne GmbH — full valid compliance pack
  { folder: "heckmann", docId: "doc-020", file: "Certificate_of_Incorporation.pdf" },
  { folder: "heckmann", docId: "doc-021", file: "VAT_Registration_Certificate.pdf" },
  { folder: "heckmann", docId: "doc-022", file: "ISO_9001_Certificate.pdf" },
  { folder: "heckmann", docId: "doc-023", file: "Public_Liability_Insurance.pdf" },
  { folder: "heckmann", docId: "doc-024", file: "Trade_Licence.pdf" },
  { folder: "heckmann", docId: "doc-025", file: "Conflict_Minerals_Declaration.pdf" },
  // Steinbach Bau GmbH — 4 valid docs + the blocked/rejected pair (doc-009/010)
  { folder: "steinbach", docId: "doc-026", file: "Certificate_of_Incorporation.pdf" },
  { folder: "steinbach", docId: "doc-027", file: "VAT_Registration_Certificate.pdf" },
  { folder: "steinbach", docId: "doc-028", file: "ISO_9001_Certificate.pdf" },
  { folder: "steinbach", docId: "doc-029", file: "Trade_Licence.pdf" },
  { folder: "steinbach", docId: "doc-009", file: "Public_Liability_Insurance.pdf" },
  { folder: "steinbach", docId: "doc-010", file: "Conflict_Minerals_Declaration.pdf" },
];

const kebab = (name) => name.replace(/\.pdf$/i, "").replace(/_/g, "-").toLowerCase() + ".pdf";

for (const { folder, docId, file } of MANIFEST) {
  const storagePath = `${folder}/${kebab(file)}`;
  const bytes = await readFile(new URL(`${folder}/${file}`, MOCK_DIR));

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error(`✗ upload failed for ${file}:`, uploadError.message);
    continue;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const fileUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("supplier_docs")
    .update({ file_path: storagePath, file_url: fileUrl })
    .eq("id", docId);

  if (updateError) {
    console.error(`✗ linking ${docId} failed:`, updateError.message);
    continue;
  }

  console.log(`✓ ${docId} ← ${file} → ${fileUrl}`);
}

console.log("\nDone.");
