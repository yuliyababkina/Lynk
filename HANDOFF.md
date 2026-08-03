# Lynk — context handoff

Working notes for picking this up in a fresh session. Written 3 Aug 2026.
Branch: `yuliyababkina-fix-vercel-build-types`.

---

## 1. What Lynk is

Supplier lifecycle management (invite → onboard → qualify → monitor compliance).
Three role views, switched from a landing "roles board" — there is no login:

| Role | Entry | Code |
|---|---|---|
| Procurement Manager (Sabine Müller) | `Landing` → PM app | `src/App.tsx` |
| Supplier (active, e.g. Martin Weber / EuroBau) | supplier portal | `src/pages/SupplierPortal.tsx` |
| Prospect (onboarding) | full-screen wizard | `src/pages/ProspectOnboarding.tsx` |

**The Principal** — the company whose procurement team invites suppliers — is
**Urban Habitat Management GmbH**. It is the single source in
`src/lib/principal.ts` (name, short name, PM, profile, procurement email).
Every supplier and prospect relates to it and Sabine always writes on its
behalf. Wincasa / GCH / AT Immobilien remain in mock data as *secondary*
Principals purely so the portal looks realistic — no logic acts on them.

## 2. Stack

React 18 + Vite + TypeScript, Tailwind v4, shadcn/ui (`src/components/ui`),
custom components in `src/components/yarowa`. Supabase (Postgres + Storage) is
the backend. Vercel hosts it; `api/` holds serverless functions. pdf.js renders
document previews.

Route-level code splitting is in place (`React.lazy` in `App.tsx`), which is
why the initial bundle is ~430 kB rather than ~910 kB.

## 3. Data layer — the important part

```
src/lib/db.ts              all Supabase reads/writes + row→app mappers
src/lib/LynkDataContext.tsx  single provider; every mutation goes through it
src/data.ts                static mock fallback when Supabase env vars are absent
```

`db.ts` falls back to `src/data.ts` when Supabase isn't configured, so the
prototype always runs. Mutations are no-ops in that mode.

Key tables: `suppliers`, `supplier_docs`, `onboarding_cases`, `tickets`,
`contracts`, `data_governance_requests`, `catalogues`, `activity_log`.
Storage bucket `supplier-documents` is public with anon insert.

**Conventions that matter**

- Onboarding case id is always `onb-<supplierId>` — helpers `onboardingCaseId()`
  / `onboardingSupplierId()` in `db.ts`. Don't re-derive it by hand.
- A document's row id is `doc-<supplierId>-<slug>`, so re-uploading the same
  document type **replaces** it instead of piling up duplicates.
- Storage object paths are unique per upload (`…-<timestamp>.pdf`): the bucket
  policy grants INSERT only, so `upsert` on an existing object is rejected by
  RLS. The `supplier_docs` row is the authority on which file is current.
- RLS is "anon full access" everywhere — fine for a no-login prototype, never
  for real supplier data.

## 4. Flows built

### Invitation with magic link
`invite-supplier-modal` mints a token → `POST /api/send-invite` (Resend) →
prospect clicks `?invite=<token>` → `App.tsx` resolves it to the onboarding case
and opens that prospect's wizard. An unknown token shows an explicit
"link isn't valid" screen.

Inviting creates **both** an `onboarding_cases` row and a `suppliers` row
(`ensureProspectSupplier` in `db.ts`). This matters: `supplier_docs.supplier_id`
is a foreign key onto `suppliers`, and the wizard writes the company profile
onto that row. Without it, uploads failed the FK and the company-info step
silently updated nothing.

### Prospect onboarding wizard
Welcome (terms gate) → Company info → Documents → Principal Docs → Complete.
Documents step uses the shared `DocumentBrowser` (list + 100 %-scale preview).

On a document already on file the prospect can:

- **Replace the file** — a new upload supersedes the stored one (same
  `doc-<supplierId>-<slug>` row) and goes back to `pending-review`.
- **Edit details** — corrects type / issuer / validity without touching the file.
  The form starts from what the preview shows, including values `pdf-metadata`
  read from the PDF. Editing an *approved* document resets it to
  `pending-review`: the PM approved the previous values.
- **Delete** — confirmed by name, then the document reads as `missing` again.
  Only the `supplier_docs` row is removed; the Storage object stays, because the
  bucket policy grants no DELETE (the row is the authority on what exists).

All three write an `activity_log` entry with the supplier as actor, and all
three are blocked by the terms gate like every other supplier-side write.

### Terms & Conditions gate
Terms live in `src/lib/terms.ts`, versioned (`TERMS_VERSION`). Acceptance is
stored **on `suppliers`** (`terms_accepted_at` / `terms_version` /
`terms_accepted_by`) — not on the onboarding case, because acceptance outlives
onboarding and established suppliers have no case.

Enforcement is in `LynkDataContext`: `updateSupplierProfile` and
`addSupplierDoc` throw if the supplier has no acceptance, so nothing can be
saved even around the UI. Established suppliers were backfilled by the
migration; only prospects are pending.

### PM review of a prospect
`src/pages/Onboarding.tsx` (list) → `src/pages/ProspectReview.tsx` (stepper:
Company info → Documents → Summary). Per-document Approve / Decline with a
comment; leaving the Documents step is blocked while anything is still
`pending-review`. Decision: accept (activates the supplier), request changes
(loops back to the prospect with feedback), or reject.

Separate from those three: the quiet bin icon at the top of the case panel
**deletes** the case. A rejection is a decision the supplier is told about and
stays on file; a deletion is the case never having been in the pipeline. It
requires a reason, which is written to `activity_log` *before* the rows go —
that entry is the only record left. An un-activated prospect is removed with its
documents (the `suppliers` row exists only to carry them); an already-accepted
supplier keeps its profile and loses only the case. Storage objects stay, as
with document deletion.

### Document status vocabulary
`src/lib/document-status.ts` is the one definition of label + icon + colour,
used by PM, supplier and prospect views so a document never reads differently
depending on who looks at it. `missing` is not stored — it's the absence of an
upload for an expected type.

### Document metadata
`src/lib/pdf-metadata.ts` extracts type / issuer / validity from the PDF's text
layer; values shown with a "(from file)" marker. Human-confirmed values (entered
in `document-metadata-form`) always win. Requires the `supplier_docs` metadata
migration — see below.

## 5. Migrations

`supabase/migrations/`

| File | Adds | Applied to live DB |
|---|---|---|
| `2026-07-15_add_ticket_status.sql` | ticket workflow status | yes |
| `2026-07-30_add_document_metadata.sql` | `supplier_docs`: document_type, issuing_institution, does_not_expire, metadata_confirmed | **no** — verified 3 Aug 2026 |
| `2026-07-31_add_terms_acceptance.sql` | `suppliers`: terms_accepted_at/version/by + backfill of non-prospects | yes |

**The document-metadata migration is still outstanding.** Both the upload and the
edit path fall back to writing only the columns that exist, so nothing breaks —
but the type and issuer a supplier confirms cannot be stored, which is why those
values still read "(from file)" after a reload. Paste
`2026-07-30_add_document_metadata.sql` into the SQL Editor (it is safe to
re-run) to close the gap.

`onboarding_cases.email` / `invite_token` were added via `supabase/schema.sql`.

**DDL cannot be run from the agent session** — only the anon key is available.
Any new migration has to be pasted into Supabase → SQL Editor by hand.

## 6. Environment

`.env.local` (gitignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Vercel also holds `RESEND_API_KEY` (server-only, deliberately **no** `VITE_`
prefix so Vite can't inline it into the browser bundle).

`RESEND_FROM` is unset, so the function falls back to `onboarding@resend.dev`,
which **only delivers to the Resend account owner's address**
(`yuliya.babkina@leverx.com`). Sending to anyone else needs a verified domain —
see `SETUP.md` §7.2. `urbanhabitat-management.de` is fictional and cannot be
verified; a domain whose DNS you control is required.

`api/` functions only run on Vercel or under `vercel dev` — plain `npm run dev`
does not serve them.

## 7. Known gaps / open decisions

- **Privacy Policy is a stub** (`href="#"`), no page behind it.
- **Principal's HRB / VAT are invented** (`HRB 87421`, `DE 812 447 903`) — they
  were given as `XXXXX` placeholders.
- **Backfilled consent dates are the migration date**, not the real onboarding
  date, which isn't stored. `terms_accepted_by` says `(date backfilled)` so the
  record doesn't imply a fresh consent.
- **Trade/region of an invited prospect are `—`**: the invite modal collects
  trades but doesn't pass them into the supplier row.
- Principal Docs (wizard step 4) are decorative — no real uploads behind them.
- `Principals.tsx` in the portal hardcodes Martin's relationships.

## 8. Owner's next steps (outside the codebase)

These need access an agent session doesn't have:

1. **Verify a sending domain in Resend.** Until then `RESEND_FROM` stays unset,
   the function falls back to `onboarding@resend.dev`, and invitations only
   reach the Resend account owner's own address. `urbanhabitat-management.de` is
   fictional — use a domain whose DNS you control (a `leverx.com` subdomain via
   corporate IT, or a cheap domain bought for the prototype). Then set
   `RESEND_FROM` in Vercel and redeploy. Steps in `SETUP.md` §7.2.
2. **Decide the Principal's real register/VAT numbers** if the invented ones
   shouldn't stand (`src/lib/principal.ts`).
3. **Decide whether a Privacy Policy page is needed**, or whether the link stays
   a placeholder for the prototype.

## 9. Audit trail

`activity_log` records each action. Its `actor` column defaults to the
Procurement Manager in the schema, which is correct for everything the PM does
and wrong for anything the supplier does — it was crediting Sabine with consent
the supplier had given. `logActivity(entity, action, detail, actor)` therefore
takes an optional actor, and supplier-side actions (terms acceptance) pass it.
Anything new that a *supplier* triggers should pass it too.

## 10. Agent-session constraints

- **Cannot push.** No SSH key, no `gh`, and the osxkeychain has no github.com
  credential. The repo is public, so *reads* (`git ls-remote`) work but writes
  don't. Commits are made locally; push from GitHub Desktop.
- Cannot run DDL, create accounts, verify domains, or set Vercel env vars.
- The in-app browser preview has no native PDF plugin, which is why previews
  render through pdf.js to canvas rather than an `<iframe>`.
