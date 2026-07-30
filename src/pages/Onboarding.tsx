import { useMemo, useState } from "react";
import { FileText, ExternalLink, Building2, MapPin, Mail, Phone, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useLynkData } from "../lib/LynkDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/yarowa/pill";
import { ProspectReview } from "./ProspectReview";
import type { DocStatus, OnboardingStatus, OnboardingCase } from "../types";
import type { ProspectDecision } from "../lib/db";

// Uploaded-document status → badge (mirrors the supplier portal).
const DOC_STATUS_META: Record<DocStatus, { label: string; variant: string }> = {
  valid: { label: "Valid", variant: "success-outline" },
  "warning-60": { label: "Expiring", variant: "orange-outline" },
  "warning-30": { label: "Expiring", variant: "warning-outline" },
  "pending-review": { label: "Pending review", variant: "warning-outline" },
  "rejected-resubmit": { label: "Resubmit", variant: "critical-outline" },
  blocked: { label: "Blocked", variant: "critical-outline" },
};

function onbStatusVariant(s: OnboardingStatus): string {
  switch (s) {
    case "Accepted":
      return "success";
    case "Rejected":
    case "Stale":
      return "danger";
    case "Changes Requested":
    case "Pending":
      return "warning";
    default:
      return "info"; // In Review, Opened
  }
}

function onbMetric(c: OnboardingCase): string {
  switch (c.status) {
    case "In Review":
      return "Submitted — awaiting review";
    case "Accepted":
      return "Activated in Lynk";
    case "Changes Requested":
      return "Changes requested — awaiting resubmission";
    case "Rejected":
      return "Rejected";
    default:
      return `${c.daysNoResponse}d no response`;
  }
}

export function Onboarding({
  initialSelectedId,
}: {
  initialSelectedId?: string | null;
}) {
  const { onboardingCases: ONBOARDING_CASES, suppliers: SUPPLIERS, docs: DOCS, reviewProspect, reviewDocument } =
    useLynkData();
  const [tab, setTab] = useState<"All" | "Stale">("All");
  const [selected, setSelected] = useState<string | null>(initialSelectedId ?? null);
  const [reviewing, setReviewing] = useState(false);

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

  const filtered = useMemo(
    () => (tab === "Stale" ? cases.filter((c) => c.status === "Stale") : cases),
    [tab, cases]
  );

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
        onReviewDocument={reviewDocument}
      />
    );
  }

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold mb-1">Onboarding</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Prospect invitations that are stale or incomplete. Follow up to keep your pipeline moving.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Open Invitations", value: cases.length },
            { label: "High Priority", value: highPriority },
            { label: "Stale", value: stale },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-4">
          <Pill active={tab === "All"} onClick={() => setTab("All")} count={cases.length}>
            All
          </Pill>
          <Pill active={tab === "Stale"} onClick={() => setTab("Stale")} count={stale}>
            Stale
          </Pill>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">COMPANY</th>
                <th className="px-4 py-2 font-medium">STAGE</th>
                <th className="px-4 py-2 font-medium">STATUS</th>
                <th className="px-4 py-2 font-medium">METRIC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openCase(c)}
                  className={`border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 ${
                    selected === c.id ? "bg-secondary/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.companyName}</div>
                    <div className="text-xs text-muted-foreground">{c.contactName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">Prospect</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={onbStatusVariant(c.status) as any}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{onbMetric(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground mt-2">{filtered.length} cases</div>
      </div>

      {selectedCase && (
        <div className="w-[380px] shrink-0 bg-card border border-border rounded-lg p-4 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="font-semibold">{selectedCase.companyName}</div>
          <div className="text-xs text-muted-foreground mb-4">{selectedCase.contactName} · Prospect</div>

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
    </div>
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
