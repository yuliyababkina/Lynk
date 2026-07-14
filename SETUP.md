# Backend setup (Supabase)

The prototype now reads/writes through Supabase (Postgres) instead of the
static arrays in `src/data.ts`. Until you finish the steps below, the app
automatically falls back to that static data — nothing breaks, it just won't
remember anything between reloads.

## 1. Create a Supabase project (you do this — I can't create accounts for you)

1. Go to [supabase.com](https://supabase.com) → sign up (free tier is plenty) → **New project**.
2. Pick any name/region, set a database password (save it somewhere), wait ~2 min for it to provision.

## 2. Load the schema and seed data

In the Supabase dashboard: **SQL Editor → New query**.

1. Paste the contents of `supabase/schema.sql`, run it.
2. Paste the contents of `supabase/seed.sql`, run it.

That gives you 30 suppliers (the original 10 + 20 new ones), 34 tickets, and
matching contracts / compliance documents / data-governance requests /
onboarding cases / service catalogues — spread across every status the UI
knows how to render.

**To reset back to this clean baseline** (e.g. between usability-test
participants), just re-run `seed.sql` again — it truncates the tables first,
so it's always safe to re-run.

## 3. Get your API credentials

Dashboard → **Project Settings → API**. Copy:
- **Project URL**
- **anon public** key

## 4. Local development

```
cp .env.example .env.local
```

Fill in the two values, then `npm run dev` as usual.

## 5. The live Vercel deployment (lynk-black.vercel.app)

For the deployed prototype to persist too, add the same two variables in
**Vercel → your project → Settings → Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then trigger a redeploy (push a commit, or use "Redeploy" in Vercel) — Vite
only bakes in env vars at build time.

## What's actually persisted right now

Wired to the database: ticket resolution (Review/Approve/Renew/Remind/
Request/Escalate on the Task Queue and ticket drawer), renewal accept/reject
decisions, inviting a new supplier (Onboarding), and publishing/updating a
service catalogue. Every one of those also writes a row to `activity_log`,
so you have a running audit trail of what happened during a test session.

**Still visual-only (pre-existing, not something I changed):** the
Endorse/Reject buttons in Data Governance, Remind/Re-send/Revoke in
Onboarding's side panel, and Remind/Revoke/Escalate in the compliance
drawer don't call any handler yet — they were already decorative in the
prototype before this change. Say the word if you want those wired up to
persist too; the DB tables are already there to support it.

## 6. Attaching real files (worked example: Heckmann & Söhne GmbH)

`supplier_docs` can now hold an actual file, not just metadata — `file_path`
(Storage object path) and `file_url` (public URL the UI links to). This is
on top of the schema/seed from steps 1–2, so:

1. Re-run `supabase/schema.sql` (the new bits — the two columns and the
   `supplier-documents` Storage bucket — are written to be safe to re-run).
2. Re-run `supabase/seed.sql` (also safe — it truncates first). This adds
   Heckmann's full compliance pack as 6 rows: Certificate of Incorporation,
   VAT Registration Certificate, ISO 9001, Public Liability Insurance, Trade
   Licence, Conflict Minerals Declaration — all `valid`, no file attached yet.
3. Run the upload script, which pushes the actual mock PDFs (in
   `supabase/mock-documents/heckmann/`) into Storage and links them to
   those 6 rows:
   ```
   npm run docs:upload
   ```
   (uses the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as the app —
   make sure `.env.local` is filled in first)

Once linked, a "View attached document" link appears in the Compliance
drawer and on the supplier profile's Compliance Snapshot, opening the real
PDF in a new tab.

**To do this for another supplier:** drop its PDFs in
`supabase/mock-documents/<supplier-id>/`, add matching rows to `seed.sql`
(or insert them directly), add an entry to the `MANIFEST` array in
`scripts/upload-supplier-documents.mjs`, and re-run `npm run docs:upload`.

## Security note

Row-Level Security is enabled but the policies allow full anonymous
read/write (`anon full access`) — intentional, since there's no login flow
in this prototype. Do **not** carry these policies forward once real
supplier data (real IBANs, real contacts) goes into a Supabase project.
