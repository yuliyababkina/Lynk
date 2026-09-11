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

## 7. Sending real invitation emails (magic link)

Inviting a supplier (Onboarding → Invite Supplier) now sends an actual email
with a working onboarding link, via a Vercel serverless function
(`api/send-invite.js`) that calls [Resend](https://resend.com). Before this
change, "Send Invitation" was fully simulated (a 1.2s fake delay, no email
ever left the app).

### 7.1 Create a Resend account (you do this — I can't create accounts for you)

1. Go to [resend.com](https://resend.com) → sign up (free tier: 100
   emails/day, 3,000/month — plenty for a prototype).
2. Dashboard → **API Keys** → create a key, copy it (starts with `re_`).

### 7.2 Domain verification — read this before testing with your batch of test users

Resend's shared test address (`onboarding@resend.dev`) can **only deliver to
the email address on your own Resend account**. It will silently fail (or
error) if you try to send to any prospect/supplier test address, including
Mailinator/Yopmail addresses.

To actually send to your batch of test users (or real prospects), verify a
domain you control:

1. Dashboard → **Domains** → **Add Domain**.
2. Add the DNS records Resend gives you (SPF, DKIM, and a return-path/tracking
   CNAME) at your domain registrar. Verification usually takes a few minutes,
   sometimes longer depending on DNS propagation.
3. Once verified, set `RESEND_FROM` to an address at that domain, e.g.
   `Lynk <invites@yourdomain.com>`.

If you don't have a spare domain, the pragmatic option for a demo is: leave
`RESEND_FROM` unset (falls back to `onboarding@resend.dev`) and only send
test invites to your own email address until a domain is verified.

### 7.3 Set environment variables in Vercel

Vercel → your project → **Settings → Environment Variables**, add:

- `RESEND_API_KEY` — the key from step 7.1
- `RESEND_FROM` — e.g. `Lynk <invites@yourdomain.com>` (optional until a
  domain is verified — see 7.2)

Neither should have the `VITE_` prefix — that prefix is what tells Vite to
bake a variable into the client-side bundle. These two must stay
server-side-only secrets, read only inside `api/send-invite.js`.

Redeploy after adding them (env var changes require a new deployment to take
effect — "Redeploy" in Vercel, or push a commit).

### 7.4 DMARC (recommended once the domain is verified)

SPF + DKIM (added during domain verification) prove the mail is authorised.
DMARC tells receivers what to do when that check fails, and Gmail/Outlook now
deprioritise bulk mail that has no DMARC policy at all. Add one TXT record
where the domain's DNS lives (Vercel's DNS panel if the nameservers point at
Vercel, otherwise the registrar):

    Name:  _dmarc
    Type:  TXT
    Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com;

Start at `p=none` (monitor only, changes no delivery behaviour), then tighten
to `quarantine` once the aggregate reports look clean.

### 7.5 Sending vs. receiving — these are separate

Everything above only lets the app **send**. It does not create a mailbox, so a
supplier hitting Reply on an invitation has nowhere to land.

To **receive** mail at the domain (e.g. `procurement@yourdomain.com`) you need a
mailbox provider (Google Workspace, Fastmail, Migadu, …) and its **MX** records.
MX is independent of the SPF/DKIM records Resend asked for — adding one does not
give you the other, and both can coexist on the same domain.

### 7.6 Send invitations from the custom domain

The magic link is built client-side from `window.location.origin`, so the link
in the email points at whichever URL the PM was using when they clicked "Send
Invitation". Invite from the production domain rather than a `*.vercel.app`
preview URL, or the emailed link will point into that preview deployment.

### 7.7 The second email: contract ready to sign

Sending the contract from the review's Send step also emails the prospect
(`api/send-contract.js`), listing the contract template and catalogues and
linking back into the signing step via the same invite token — so no login is
needed and the prospect lands exactly where they must sign.

It uses the same `RESEND_API_KEY` / `RESEND_FROM` as the invitation, so nothing
extra to configure. Sending is best-effort: the status change to
`Contract Sent (Pending Signature)` is persisted first, so a mail failure is
logged to the console and never rolls the case back. Cases with no stored email
(the seeded demo prospects) simply skip the email.

### 7.8 How the magic link works

- Inviting a new prospect generates a random token (`crypto.randomUUID()`)
  and stores it on the `onboarding_cases` row (`invite_token` column).
- The email links to `https://<your-deployment>/?invite=<token>`.
- On load, `App.tsx` looks up that token against the loaded onboarding cases
  and, if found, drops the visitor straight into the Prospect Onboarding
  wizard for that specific company — no login required (matches the rest of
  this prototype's no-auth design).
- An unrecognized or already-used token shows an "invitation isn't valid"
  screen instead of falling back to the generic role picker.

**Known limitation:** the wizard reuses the existing demo prospect's document
checklist and profile defaults (there's no separate blank-prospect data
model yet) — the company name in the header will be correct, but seeded
compliance-document states are the demo ones, not blank. Fine for testing
the invite → click → land-in-wizard path end-to-end; would need a follow-up
to fully blank-slate a brand-new prospect's documents.

## Security note

Row-Level Security is enabled but the policies allow full anonymous
read/write (`anon full access`) — intentional, since there's no login flow
in this prototype. Do **not** carry these policies forward once real
supplier data (real IBANs, real contacts) goes into a Supabase project.
