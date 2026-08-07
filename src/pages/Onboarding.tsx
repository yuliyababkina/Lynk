import { useMemo, useState } from "react";
import { FileText, ExternalLink, Building2, MapPin, Mail, Phone, CheckCircle2, AlertTriangle, XCircle, Trash2, Loader2, Bell, Ban } from "lucide-react";
import { useLynkData } from "../lib/LynkDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "@/components/yarowa/pill";
import { RowActionsMenu, type RowAction } from "@/components/yarowa/row-actions-menu";
import {
  invitationCell,
  companyInfoCell,
  documentsCell,
  signableCell,
  lastChange,
  formatLastChange,
  type Cell,
} from "@/lib/onboarding-columns";
import { toast } from "@/components/yarowa/toast";
import { PRINCIPAL_COMPANY, PROCUREMENT_MANAGER, PROCUREMENT_MANAGER_ROLE } from "@/lib/principal";
import { ProspectReview } from "./ProspectReview";
import type { DocStatus, OnboardingStatus, OnboardingCase } from "../types";
import type { ProspectDecision } from "../lib/db";
import { useI18n } from "@/lib/i18n";

// Uploaded-document status → badge (mirrors the supplier portal).
const DOC_STATUS_META: Record<DocStatus, { label: string; variant: string }> = {
  valid: { label: "Valid", variant: "success-outline" },
  "warning-60": { label: "Expiring", variant: "orange-outline" },
  "warning-30": { label: "Expiring", variant: "warning-outline" },
  "pending-review": { label: "Pending review", variant: "warning-outline" },
  "rejected-resubmit": { label: "Resubmit", variant: "critical-outline" },
  blocked: { label: "Blocked", variant: "critical-outline" },
};

/** One stage column: a badge, or muted "—" when the stage isn't reached yet. */
function StageCell({ cell, tr }: { cell: Cell; tr: (s: string) => string }) {
  if (cell.tone === "muted") return <span className="text-xs text-muted-foreground">{cell.label}</span>;
  const variant = { info: "info", warning: "warning", success: "success", danger: "danger" }[cell.tone];
  return <Badge variant={variant as never}>{tr(cell.label)}</Badge>;
}

/*
 * How urgently each case needs the Procurement Manager to act. Cases waiting on
 * the PM come first, then ones that need chasing, then those waiting on the
 * supplier, and finally the settled ones.
 */
/*
 * Tabs split the pipeline by lifecycle phase: everything up to and including the
 * review decision is the Application; once the contract goes out the case is in
 * its Contract phase. Stale stays as a cross-cutting shortcut to the cases that
 * have gone quiet.
 */
const ONB_TABS = ["All", "Application", "Contract", "Stale"] as const;
type OnbTab = (typeof ONB_TABS)[number];

const CONTRACT_PHASE: OnboardingStatus[] = ["Contract Sent (Pending Signature)", "Accepted"];

function inTab(c: OnboardingCase, tab: OnbTab): boolean {
  switch (tab) {
    case "Application":
      return !CONTRACT_PHASE.includes(c.status);
    case "Contract":
      return CONTRACT_PHASE.includes(c.status);
    case "Stale":
      return c.status === "Stale";
    default:
      return true;
  }
}

const URGENCY_RANK: Record<OnboardingStatus, number> = {
  "In Review": 0,
  Stale: 1,
  "Changes Requested": 2,
  // Sent for signature — progressing, waiting on the supplier.
  "Contract Sent (Pending Signature)": 3,
  Pending: 4,
  Opened: 5,
  Rejected: 6,
  Accepted: 7,
  // No live invitation, so nobody is waiting on anybody.
  Draft: 8,
};

export function Onboarding({
  initialSelectedId,
}: {
  initialSelectedId?: string | null;
}) {
  const {
    onboardingCases: ONBOARDING_CASES,
    suppliers: SUPPLIERS,
    docs: DOCS,
    reviewProspect,
    resetProspect,
    sendContract,
    reviewDocument,
    deleteOnboardingCase,
    revokeInvitation,
  } = useLynkData();
  const [tab, setTab] = useState<OnbTab>("All");
  const { t: tr, lang } = useI18n();
  const [selected, setSelected] = useState<string | null>(initialSelectedId ?? null);
  const [reviewing, setReviewing] = useState(false);
  const [deletingCase, setDeletingCase] = useState<OnboardingCase | null>(null);
  const [revokingCase, setRevokingCase] = useState<OnboardingCase | null>(null);

  /* Re-sends the original invitation email. Best-effort, like the first send:
     the reminder is a nudge, so a mail failure must not look like a hard error. */
  async function sendReminder(c: OnboardingCase) {
    if (!c.email || !c.inviteToken) {
      toast({
        title: tr("No live invitation to remind about"),
        description: tr("Send a new invitation instead."),
        tone: "warning",
      });
      return;
    }
    try {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: c.email,
          companyName: c.companyName,
          contactName: c.contactName,
          link: `${window.location.origin}/?invite=${c.inviteToken}`,
          principal: PRINCIPAL_COMPANY,
          sender: PROCUREMENT_MANAGER,
          senderRole: PROCUREMENT_MANAGER_ROLE,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "failed");
      toast({ title: tr("Reminder sent"), description: c.email, tone: "success" });
    } catch (e) {
      console.error("[Lynk] reminder email failed:", e);
      toast({ title: tr("Could not send the reminder"), description: c.email, tone: "critical" });
    }
  }

  function actionsFor(c: OnboardingCase): RowAction[] {
    const items: RowAction[] = [];
    /* Offered for any case still in its application phase. A seeded case may not
       carry a token; sendReminder says so plainly rather than the action being
       silently absent, which made the menu look broken on most rows. */
    if (c.status !== "Accepted" && c.status !== "Draft") {
      items.push({ label: "Send reminder", icon: <Bell className="w-4 h-4" />, onSelect: () => sendReminder(c) });
      items.push({
        label: "Revoke Invitation",
        icon: <Ban className="w-4 h-4" />,
        onSelect: () => setRevokingCase(c),
      });
    }
    items.push({
      label: "Delete prospect",
      icon: <Trash2 className="w-4 h-4" />,
      destructive: true,
      onSelect: () => setDeletingCase(c),
    });
    return items;
  }

  const linkedFor = (c: OnboardingCase) =>
    SUPPLIERS.find((s) => s.id === c.id.replace(/^onb-/, "")) ??
    SUPPLIERS.find((s) => s.name === c.companyName);

  // Clicking a prospect with a full submitted profile opens the review stepper;
  // legacy invitation-only cases just show the timeline panel.
  function openCase(c: OnboardingCase) {
    setSelected(c.id);
    setReviewing(Boolean(linkedFor(c)));
  }

  // Newly invited prospects (added via addOnboardingCase) already sit at the
  // front of ONBOARDING_CASES — see LynkDataContext.
  const cases = useMemo(() => ONBOARDING_CASES, [ONBOARDING_CASES]);

  const filtered = useMemo(() => {
    const list = cases.filter((c) => inTab(c, tab));
    // Most urgent first; within the same status the longest-waiting case leads.
    return [...list].sort(
      (a, b) =>
        URGENCY_RANK[a.status] - URGENCY_RANK[b.status] || b.daysNoResponse - a.daysNoResponse
    );
  }, [tab, cases]);

  const stale = cases.filter((c) => c.status === "Stale").length;
  const highPriority = cases.filter((c) => c.criticality === "high").length;
  const selectedCase = cases.find((c) => c.id === selected);

  // Prospects that came through the onboarding wizard use the case id
  // `onb-<supplierId>`, so we can pull the full submitted profile + documents
  // straight from the shared suppliers / supplier_docs data.
  const linkedSupplier = selectedCase
    ? SUPPLIERS.find((s) => s.id === selectedCase.id.replace(/^onb-/, "")) ??
      SUPPLIERS.find((s) => s.name === selectedCase.companyName)
    : undefined;
  // De-dupe by id (primary key) so the review never renders duplicate rows even
  // if the in-memory list briefly carries an optimistic + fetched copy.
  const submittedDocs = linkedSupplier
    ? Array.from(
        new Map(DOCS.filter((d) => d.supplierId === linkedSupplier.id).map((d) => [d.id, d])).values()
      )
    : [];
  const primaryContact = linkedSupplier?.contacts?.find((c) => c.primary) ?? linkedSupplier?.contacts?.[0];

  // Full-page review stepper for a submitted prospect.
  if (reviewing && selectedCase && linkedSupplier) {
    return (
      <ProspectReview
        supplier={linkedSupplier}
        docs={submittedDocs}
        contact={primaryContact}
        caseItem={selectedCase}
        onClose={() => setReviewing(false)}
        onReview={reviewProspect}
        onReset={resetProspect}
        onSendContract={sendContract}
        onReviewDocument={reviewDocument}
      />
    );
  }

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold mb-1">{tr("Onboarding")}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {tr("Prospect invitations that are stale or incomplete. Follow up to keep your pipeline moving.")}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Open Invitations", value: cases.length },
            { label: "High Priority", value: highPriority },
            { label: "Stale", value: stale },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">{tr(c.label)}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-4">
          {ONB_TABS.map((t) => (
            <Pill
              key={t}
              active={tab === t}
              onClick={() => setTab(t)}
              count={cases.filter((c) => inTab(c, t)).length}
            >
              {tr(t)}
            </Pill>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">{tr("COMPANY")}</th>
                <th className="px-4 py-2 font-medium">{tr("INVITATION")}</th>
                <th className="px-4 py-2 font-medium">{tr("COMPANY INFO")}</th>
                <th className="px-4 py-2 font-medium">{tr("DOCUMENTS")}</th>
                <th className="px-4 py-2 font-medium">{tr("CONTRACT")}</th>
                <th className="px-4 py-2 font-medium">{tr("PRICE AGREEMENTS")}</th>
                <th className="px-4 py-2 font-medium">{tr("LAST CHANGE")}</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                // Each stage column reads from the linked profile + documents,
                // so a row shows where the case actually stands per stage.
                const linked = linkedFor(c);
                const caseDocs = linked ? DOCS.filter((doc) => doc.supplierId === linked.id) : [];
                const cells = [
                  invitationCell(c),
                  companyInfoCell(c, linked),
                  documentsCell(caseDocs),
                  signableCell(c),
                  signableCell(c),
                ];
                return (
                  <tr
                    key={c.id}
                    onClick={() => openCase(c)}
                    className={`group border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 ${
                      selected === c.id ? "bg-secondary/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.companyName}</div>
                      <div className="text-xs text-muted-foreground">{c.contactName}</div>
                    </td>
                    {cells.map((cell, i) => (
                      <td key={i} className="px-4 py-3">
                        <StageCell cell={cell} tr={tr} />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatLastChange(lastChange(caseDocs), lang)}
                    </td>
                    {/* Right-aligned row actions, revealed on hover. */}
                    <td className="px-4 py-3 w-10">
                      <div className="flex justify-end">
                        <RowActionsMenu actions={actionsFor(c)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground mt-2">{tr("{count} cases", { count: filtered.length })}</div>
      </div>

      {selectedCase && (
        <div className="w-[380px] shrink-0 bg-card border border-border rounded-lg p-4 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="min-w-0">
              <div className="font-semibold">{selectedCase.companyName}</div>
              <div className="text-xs text-muted-foreground">{selectedCase.contactName} · Prospect</div>
            </div>
            {/* Removing the case from the pipeline altogether — distinct from
                rejecting it, which is a decision the supplier is told about.
                Quiet by default: it is housekeeping, not part of the review. */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              title="Delete onboarding case"
              aria-label={`Delete the onboarding case for ${selectedCase.companyName}`}
              onClick={() => setDeletingCase(selectedCase)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {linkedSupplier ? (
            <>
              {/* Submitted profile — the data the prospect filled in the wizard */}
              <SectionLabel icon={<Building2 className="w-3.5 h-3.5" />}>Company details</SectionLabel>
              <dl className="space-y-2 mb-4">
                <ReviewField label="Legal name" value={linkedSupplier.name} />
                <ReviewField label="VAT ID" value={linkedSupplier.vatId || "—"} />
                <ReviewField label="Trade" value={linkedSupplier.trade || "—"} />
                <ReviewField label="Region" value={linkedSupplier.region || "—"} />
              </dl>

              <SectionLabel icon={<MapPin className="w-3.5 h-3.5" />}>Registered address</SectionLabel>
              <p className="text-sm mb-4">{linkedSupplier.address || "—"}</p>

              {primaryContact && (
                <>
                  <SectionLabel>Primary contact</SectionLabel>
                  <div className="text-sm mb-1">{primaryContact.name}</div>
                  {primaryContact.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {primaryContact.email}
                    </div>
                  )}
                  {primaryContact.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 mb-4">
                      <Phone className="w-3 h-3" /> {primaryContact.phone}
                    </div>
                  )}
                </>
              )}

              {/* Uploaded documents */}
              <SectionLabel icon={<FileText className="w-3.5 h-3.5" />}>
                Documents ({submittedDocs.length})
              </SectionLabel>
              <div className="space-y-1.5 mb-4">
                {submittedDocs.length === 0 && (
                  <p className="text-xs text-muted-foreground">No documents submitted yet.</p>
                )}
                {submittedDocs.map((doc) => {
                  const meta = DOC_STATUS_META[doc.status] ?? { label: doc.status, variant: "warning-outline" };
                  const openable = Boolean(doc.fileUrl);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      disabled={!openable}
                      onClick={() => openable && window.open(doc.fileUrl, "_blank", "noopener")}
                      className={`w-full flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-left ${
                        openable ? "hover:bg-secondary/50 cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium truncate">{doc.documentName}</span>
                        {openable && <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />}
                      </span>
                      <Badge variant={meta.variant as any} className="shrink-0">
                        {meta.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>

              <SectionLabel>PM Review</SectionLabel>
              <ReviewActions
                key={selectedCase.id}
                caseItem={selectedCase}
                supplierId={linkedSupplier.id}
                supplierName={linkedSupplier.name}
                onReview={reviewProspect}
              />
            </>
          ) : (
            <>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Invitation timeline</div>
              <div className="text-sm mb-4">
                Invitation sent, {selectedCase.daysNoResponse} days ago. No response from contact yet.
              </div>
              <div className="flex gap-2">
                <Button variant="default" className="flex-1">Send Reminder</Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1">Re-send Magic Link</Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="danger" className="flex-1">Revoke Invitation</Button>
              </div>
            </>
          )}
        </div>
      )}

      <Dialog open={Boolean(revokingCase)} onOpenChange={(o) => !o && setRevokingCase(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-[440px] rounded-2xl">
          <DialogTitle className="text-base font-semibold">
            {tr("Revoke the invitation for {company}?", { company: revokingCase?.companyName ?? "" })}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {tr(
              "The existing link stops working immediately, so the prospect can no longer open their onboarding. The case stays here as a draft and you can send a new invitation later."
            )}
          </DialogDescription>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setRevokingCase(null)}>
              {tr("Keep invitation")}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={async () => {
                const target = revokingCase;
                setRevokingCase(null);
                if (!target) return;
                await revokeInvitation(target.id);
                toast({ title: tr("Invitation revoked"), description: target.companyName, tone: "warning" });
              }}
            >
              <Ban className="w-4 h-4" />
              {tr("Revoke Invitation")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {deletingCase && (
        <DeleteCaseDialog
          caseItem={deletingCase}
          /* An accepted prospect is a live supplier and stays; anything else
             exists only for this case, so it goes with it. */
          removesProspect={Boolean(linkedFor(deletingCase)) && deletingCase.status !== "Accepted"}
          docCount={
            linkedFor(deletingCase)
              ? DOCS.filter((d) => d.supplierId === linkedFor(deletingCase)!.id).length
              : 0
          }
          onClose={() => setDeletingCase(null)}
          onConfirm={async (reason) => {
            await deleteOnboardingCase(deletingCase.id, reason);
            setDeletingCase(null);
            setSelected(null);
            setReviewing(false);
          }}
        />
      )}
    </div>
  );
}

/*
 * Deleting a case is not undoable and leaves no row behind, so the reason the PM
 * gives here is the only surviving record of it — hence required, and written to
 * the activity log before anything is removed.
 */
function DeleteCaseDialog({
  caseItem,
  removesProspect,
  docCount,
  onClose,
  onConfirm,
}: {
  caseItem: OnboardingCase;
  removesProspect: boolean;
  docCount: number;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the case.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[460px] rounded-2xl">
        <DialogTitle className="text-base font-semibold">Delete {caseItem.companyName}?</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {removesProspect ? (
            <>
              The case, the prospect's profile
              {docCount > 0 && <> and {docCount} uploaded document{docCount === 1 ? "" : "s"}</>} are
              removed. This can't be undone — reject the application instead if the supplier should be
              told the outcome.
            </>
          ) : (
            <>
              The onboarding case is removed. The supplier profile stays, because it is already active in
              Lynk. This can't be undone.
            </>
          )}
        </DialogDescription>

        <div className="space-y-1.5">
          <label htmlFor="delete-reason" className="text-xs text-muted-foreground">
            Reason for deleting <span className="text-destructive">*</span>
          </label>
          <textarea
            id="delete-reason"
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. duplicate invitation, company no longer trading, invited in error"
            className="w-full rounded-lg border border-border bg-background p-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Kept in the activity log — the only record left once the case is gone.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={onClose}>
            Keep case
          </Button>
          <Button variant="danger" className="flex-1" disabled={busy || !reason.trim()} onClick={confirm}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete case
          </Button>
        </div>
        {!reason.trim() && (
          <p className="text-xs text-muted-foreground text-center">Give a reason to enable deletion.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      {icon}
      {children}
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-sm text-right truncate">{value}</dd>
    </div>
  );
}

function StatusNote({
  tone,
  icon,
  children,
}: {
  tone: "success" | "warning" | "danger";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls = {
    success: "border-success/30 bg-success-soft/40 text-success-ink",
    warning: "border-warning/30 bg-warning-soft/40 text-warning-ink",
    danger: "border-destructive/30 bg-destructive/5 text-destructive",
  }[tone];
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${cls}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function ReviewActions({
  caseItem,
  supplierId,
  supplierName,
  onReview,
}: {
  caseItem: OnboardingCase;
  supplierId: string;
  supplierName: string;
  onReview: (id: string, name: string, decision: ProspectDecision, note?: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"idle" | "changes" | "reject">("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(decision: ProspectDecision, n?: string) {
    setBusy(true);
    try {
      await onReview(supplierId, supplierName, decision, n);
    } finally {
      setBusy(false);
    }
  }

  // Already decided — show the outcome (matches the flow diagram's end states).
  if (caseItem.status === "Accepted") {
    return (
      <StatusNote tone="success" icon={<CheckCircle2 className="w-4 h-4" />}>
        Accepted — supplier profile is now active in Lynk. A confirmation email was sent.
      </StatusNote>
    );
  }
  if (caseItem.status === "Rejected") {
    return (
      <StatusNote tone="danger" icon={<XCircle className="w-4 h-4" />}>
        Application rejected.
        {caseItem.reviewNote && <div className="mt-1 text-xs opacity-90">“{caseItem.reviewNote}”</div>}
      </StatusNote>
    );
  }
  if (caseItem.status === "Changes Requested") {
    return (
      <StatusNote tone="warning" icon={<AlertTriangle className="w-4 h-4" />}>
        Changes requested — awaiting the supplier's resubmission.
        {caseItem.reviewNote && <div className="mt-1 text-xs opacity-90">“{caseItem.reviewNote}”</div>}
      </StatusNote>
    );
  }

  if (mode === "idle") {
    return (
      <div className="space-y-2">
        <Button variant="success" className="w-full" disabled={busy} onClick={() => decide("accept")}>
          Accept application
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => setMode("changes")}>
            Request changes
          </Button>
          <Button variant="danger" className="flex-1" disabled={busy} onClick={() => setMode("reject")}>
            Reject
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder={mode === "changes" ? "What does the supplier need to change?" : "Reason for rejection"}
        className="w-full rounded-lg border border-border bg-background p-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() => {
            setMode("idle");
            setNote("");
          }}
        >
          Cancel
        </Button>
        <Button
          variant={mode === "reject" ? "danger" : "default"}
          className="flex-1"
          disabled={busy || !note.trim()}
          onClick={() => decide(mode === "changes" ? "changes" : "reject", note.trim())}
        >
          {mode === "changes" ? "Send feedback" : "Confirm rejection"}
        </Button>
      </div>
    </div>
  );
}
