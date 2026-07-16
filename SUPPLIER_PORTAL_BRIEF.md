# Supplier Portal — Build Brief (for coding agent)

**Product:** Lynk
**Author:** Yuliya Babkina
**Date:** 2026-07-16
**Status:** Draft, demo-stage build. Grounded in the actual state of this repo at time of writing, plus shared UX mockups/flowchart.
**Audience:** Coding agent working directly in this repo (`lynk-procurement-prototype`)

**Scope note:** This adds a Supplier Portal experience to the existing PM app, in this same repo, for demo purposes — not a production build. See `supplier-portal-architecture-brief-v0.1.md` §0 for why (short version: two separate repos is the target for the real product, but this is still a demo, so one repo). See project memory `lynk_supplier_portal_architecture` for the full reasoning trail if you need it.

---

## 1. Goal

Add a Supplier Portal so both the Procurement Manager (PM) experience and the Supplier/Prospect experience can be demoed from one app, one dataset — mirroring how the Figma Make concept file ("LYNK") already simulates three roles from one project. Build it inside this repo, reusing everything the PM app already established, not as a parallel design system.

## 2. Build it the same way as the PM app — reuse, don't reinvent

Stack (already in `package.json`): Vite + React 18 + TypeScript + Tailwind v4 + shadcn/ui (`components.json`: style `radix-rhea`, baseColor `stone`, `cssVariables: true`) + Supabase, with graceful fallback to static mock data in `src/data.ts` when Supabase env vars aren't set (`src/lib/db.ts`, `isSupabaseConfigured`). Keep using this fallback pattern — don't require a live Supabase project to demo the portal.

**Use the existing shadcn primitives directly** — `src/components/ui/{badge,button,card,checkbox,dialog,input,label,select,separator,table,alert}.tsx`. Don't reinstall or reconfigure shadcn, don't introduce a second visual language. In particular, reuse Badge's existing semantic variants (`critical`, `high`, `medium`, `low`, `success`, `warning`, `orange`, `purple`, `neutral`, `dark`) for all status chips — these already map to the accessible soft-tint + ink-text tokens in `src/styles/tokens.css`. Don't invent new colors for "approved/pending/rejected/expired."

**Compose new UI in `src/components/yarowa/`**, the same way existing components do: thin wrappers around shadcn primitives + `lucide-react` icons + `cn()` from `@/lib/utils`, kebab-case filenames, companion `.stories.tsx` for anything visually reusable (see `wizard-stepper.stories.tsx`, `badge.stories.tsx` as examples).

**Reuse these existing components as-is instead of rebuilding them:**
- `wizard-stepper.tsx` — drive the prospect onboarding flow (Company info → Documents → Review → Submit). Already exactly this shape.
- `file-upload-card.tsx` — document upload dropzone. Generic already; only swap the `description`/`buttonLabel` props for compliance-document copy instead of the current XLS copy.
- `document-viewer.tsx` / `document-lightbox.tsx` — viewing an uploaded document.
- `toast.tsx` — confirmation toasts, same pattern `App.tsx` already uses for resolve/renewal actions.
- `alert-banner.tsx` — for the "1 document needs attention" / rejection-with-reason banners in the mockups.
- `pill.tsx` — segmented tab control (already used for Onboarding's All/Stale filter) if something lighter than shadcn Tabs is needed.

**Layout conventions to copy exactly, not reinterpret:** header breadcrumb bar (`Lynk / [Portal] / [Page]`, `h-14 border-b bg-card`, initials-avatar top right — see `App.tsx` header and `Sidebar` footer), `p-6` page padding, `bg-card border border-border rounded-lg` for panels/cards (see `SupplierProfile.tsx`, `Onboarding.tsx`). Pull these classes from those files rather than re-deriving spacing/color choices.

**No router.** This repo uses one `View` union type + `useState` switch in `App.tsx` (see the existing pattern for `dashboard` / `suppliers` / `onboarding` / etc.). Extend this same pattern for the portal views — don't introduce React Router for this.

## 3. Entry point: a persona switcher, not real auth

This is a demo — there's no login yet. Add a lightweight persona switcher so Yuliya can flip between views, mirroring the 3-role picker already built in the Figma Make concept file (`figma.com/make/UxA0Qdifb74Hont9jkrJID`). Reuse these exact names — they're already established in that prototype and in project memory, keep the demo consistent rather than inventing new example companies:

- **Sabine Müller — Procurement Manager** → existing app, unchanged.
- **Martin Weber — Active Supplier (EuroBau Components)** → Supplier Portal, account-hub state.
- **Mehmet Yilmaz — Prospect (Yilmaz Elektrotechnik)** → Supplier Portal, onboarding state.

## 4. Data model additions — additive only, don't touch the existing `suppliers` table/type

The existing `suppliers` table/type represents the PM's own roster and stays exactly as is — no changes there. The Supplier Portal needs a **relationship model** on top of it, because the same supplier company can be an active Supplier for one Principal while still a Prospect for another, simultaneously (see project memory `lynk_supplier_portal_architecture` for why).

New types, add to `src/types.ts`:

```ts
export interface Principal {
  id: string;
  name: string; // e.g. "Wincasa", "GCH", "AT Immobilien" — match the shared mockups
  associatesCount?: number;
}

export type RelationshipStatus = "Prospect" | "Supplier" | "Provider" | "Inactive";

export interface SupplierPrincipalRelationship {
  id: string;
  supplierProfileId: string; // the logged-in supplier's own profile (Martin Weber / Mehmet Yilmaz)
  principalId: string;
  status: RelationshipStatus;
  unreadCount: number;
  pendingCount: number;
  rejectedCount: number;
  lastMessage?: { from: string; text: string; at: string };
}
```

New mock data, add to `src/data.ts`: a `PRINCIPALS` array (Wincasa, GCH, AT Immobilien) and a `SUPPLIER_RELATIONSHIPS` array giving both Martin Weber and Mehmet Yilmaz relationships across those principals with **mixed statuses** — that mix is the entire point of the demo (same supplier, different status per principal).

**Documents stay global, per supplier profile.** Reuse the existing `SupplierDoc` shape and `supplier_docs` table/mock array (already keyed by `supplierId`) — don't fork documents per principal. What's per-relationship is the *review status* of those shared documents against one principal's requirements; model that as a lightweight `{ principalId, docId, reviewStatus }` join, mock-only is fine for this pass, no need for a real Supabase table unless it's easy.

## 5. Layout — use the real desktop Figma design, not the earlier phone mockups

A real desktop design exists: Figma file "Lynk Manager — Mock-ups" (`figma.com/design/KBX5oKVLH6QlkRyBb1RgES`, node 6066:2836, Martin Weber persona). It uses the **same sidebar-shell pattern as this PM app** — build the portal shell the same way (`Sidebar` component pattern from `src/components/yarowa/sidebar.tsx`, adapted for the portal's own nav items), not a mobile bottom-tab layout. This supersedes the earlier phone mockups for layout/nav — their content model (shared docs, per-relationship status) still holds, just not their bottom-tab shape.

**Sidebar nav, in order:** Overview → Requested Updates → Documents → Price agreements → Company details → Principals.

**Note:** the Figma frame's header breadcrumb currently reads "Lynk / Procurement Platform" — almost certainly a leftover from duplicating the PM app template. Use something like "Lynk / Supplier Portal" instead; flag to Yuliya rather than silently keeping the PM label.

## 6. Pages to build

Each one maps to a shared reference — use it, don't design from scratch:

1. **Overview** (`src/pages/portal/Overview.tsx`) — "Good morning, [name]" dashboard. Stat cards (documents / open requests / compliance-by-principal ratio), and ticket buckets (Action required / Expiring soon / Pending approval / Resolved), each ticket row tagged with the principal it belongs to. Include the **"Compliance by principal"** widget (e.g. a 1/3 ratio across Wincasa/GCH/AT) — this is the clearest on-screen expression of the relationship model, don't drop it.
2. **Principals** (`src/pages/portal/Principals.tsx`) — one row per `SupplierPrincipalRelationship` for the logged-in supplier: principal name, relationship status, unread/pending/rejected counts. This is a full sidebar page here, not a nested tab.
3. **Requested Updates** (`src/pages/portal/RequestedUpdates.tsx`) — list + detail panel, e.g. "Please verify your banking details — [Principal] Components GmbH", with actions "Review & update my details" / "Nothing has changed — confirm current details". Each request is scoped to one principal relationship.
4. **Documents** (`src/pages/portal/Documents.tsx`) — "All Documents" list (Certificate of Incorporation, VAT Registration Certificate, ISO 9001 Certificate, Public Liability Insurance, Trade Licence, Conflict Minerals Declaration — reuse these exact document names, they already exist in `supplier_docs` mock data) + detail panel showing which principal(s) are evaluating each document and their status, with a CTA like "Upload renewed certificate now →". This is the **global, shared** document vault (§4) — one list, not one per principal.
5. **Price agreements** (`src/pages/portal/PriceAgreements.tsx`) — not yet detailed in the Figma frame beyond the nav item; check with Yuliya before building this one, likely ties into the existing `Catalogue`/service-catalogue data.
6. **Company details** (`src/pages/portal/CompanyDetails.tsx`) — the shared supplier profile (company info, VAT ID, contacts) — this is the "one shared record" from §4, edits here should be reflected across every principal relationship.
7. **Onboarding wizard** (`src/pages/portal/Onboarding.tsx`, built on `WizardStepper`) — for relationships with `status = "Prospect"`: magic-link landing → company info → upload docs → submit → application status (under review / changes requested → resubmit / accepted). Reference: the onboarding flowchart (Mehmet Yilmaz example) — changes-requested loops back to the same application, it does not start a new one. This likely replaces the whole shell (a prospect relationship probably doesn't get the full sidebar yet) — confirm with Yuliya.

## 7. Confirm before building — don't guess

- **Associates:** mockups show "X associates" nested under each Principal (e.g. "Wincasa · 3 associates"). Whether a relationship lives at the Principal-account level only, or an Associate can hold its own distinct relationship/status, isn't decided (see architecture brief §7). For this pass, model relationships at the Principal level only — don't build Associate-level relationships unless told otherwise.
- **Price agreements page:** not detailed anywhere yet beyond the nav label — don't invent its contents, ask first.
- **Onboarding shell:** confirm whether a Prospect relationship gets the full sidebar shell (with most items disabled/hidden) or a standalone wizard screen outside the normal shell.

## 8. Out of scope for this pass

- Real auth (ONE platform integration) — the persona switcher is a stand-in.
- Real multi-tenant RLS isolation — get the mock data structured correctly; don't spend time writing Postgres RLS policies for this (existing `schema.sql` already documents current RLS as permissive "prototype only," same applies here).
- Self-service sign-up — onboarding only starts from a PM-side invite. The existing `InviteSupplierModal`'s `match: "new"` path already sends an invite and creates an `OnboardingCase` — wire the new Prospect relationship into that same action rather than building a second invite mechanism.

---
*Source: design conversation 2026-07-16, grounded in the repo as read at time of writing, the shared Supplier Portal phone mockups + onboarding flowchart (content model), and the real desktop Figma file "Lynk Manager — Mock-ups" (layout/nav, §5). See `supplier-portal-architecture-brief-v0.1.md` (in the LYNK 2 project folder) for the underlying architecture reasoning, and project memory `lynk_supplier_portal_architecture` for the full trail.*
