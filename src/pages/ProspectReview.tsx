import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Mail,
  Phone,
  FileText,
  FileX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  ShieldCheck,
  Pencil,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WizardStepper } from "@/components/yarowa/wizard-stepper";
import { PdfCanvas } from "@/components/yarowa/pdf-canvas";
import { STANDARD_DOCUMENT_TYPES } from "@/lib/onboarding-documents";
import { DOC_STATUS_META, docStatusMeta } from "@/lib/document-status";
import type { Supplier, SupplierDoc, Contact, OnboardingCase } from "../types";
import type { ProspectDecision } from "../lib/db";

// Status presentation comes from the shared definition so the PM, the supplier,
// and the prospect all see the same label/icon for a given document.

const STEPS = ["Company info", "Documents", "Decision"] as const;
type Step = (typeof STEPS)[number];

type ReviewStatus = "pending" | "confirmed" | "fix";
interface SectionReview {
  status: ReviewStatus;
  comment: string;
}

/** One row in the review checklist: an expected document type, merged with the
 * supplier's actual upload if one exists. `doc` is undefined when missing. */
interface DocRow {
  key: string;
  name: string;
  category: string;
  doc?: SupplierDoc;
}

/** Standard checklist ∪ whatever the supplier actually uploaded — so a
 * document that hasn't been submitted still shows up, as "Missing", instead
 * of silently disappearing from the review. */
function buildChecklist(docs: SupplierDoc[]): DocRow[] {
  const byName = new Map(docs.map((d) => [d.documentName, d]));
  const rows: DocRow[] = STANDARD_DOCUMENT_TYPES.map((t) => {
    const doc = byName.get(t.name);
    byName.delete(t.name);
    return { key: doc?.id ?? `missing-${t.name}`, name: t.name, category: t.category, doc };
  });
  for (const doc of byName.values()) {
    rows.push({ key: doc.id, name: doc.documentName, category: doc.documentCategory || "Document", doc });
  }
  return rows;
}

export interface ProspectReviewProps {
  supplier: Supplier;
  docs: SupplierDoc[];
  contact?: Contact;
  caseItem: OnboardingCase;
  onClose: () => void;
  onReview: (id: string, name: string, decision: ProspectDecision, note?: string) => Promise<void>;
  onReviewDocument: (docId: string, decision: "approve" | "decline", comment?: string) => void;
}

export function ProspectReview({
  supplier,
  docs,
  contact,
  caseItem,
  onClose,
  onReview,
  onReviewDocument,
}: ProspectReviewProps) {
  const [step, setStep] = useState<Step>("Company info");
  const [company, setCompany] = useState<SectionReview>({ status: "pending", comment: "" });
  const rows = useMemo(() => buildChecklist(docs), [docs]);
  const [selectedKey, setSelectedKey] = useState<string | null>(rows[0]?.key ?? null);
  const decided = caseItem.status === "Accepted" || caseItem.status === "Rejected";

  const editDocument = (key: string) => {
    setSelectedKey(key);
    setStep("Documents");
  };

  return (
    <div className="p-6">
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to onboarding
      </button>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            {contact?.name ? `${contact.name} · ` : ""}Prospect · Onboarding review
          </p>
        </div>
        <Badge variant="info">{caseItem.status}</Badge>
      </div>

      <div className="mb-6">
        <WizardStepper steps={STEPS} current={step} onStepClick={(s) => setStep(s as Step)} />
      </div>

      {step === "Company info" && (
        <div className="max-w-2xl mx-auto">
          <StepShell title="Company information" subtitle="Details the supplier submitted for their profile.">
            <dl className="space-y-3">
              <Row icon={<Building2 className="w-4 h-4" />} label="Legal name" value={supplier.name} />
              <Row label="VAT ID" value={supplier.vatId || "—"} />
              <Row label="Trade" value={supplier.trade || "—"} />
              <Row label="Region" value={supplier.region || "—"} />
              <Row icon={<MapPin className="w-4 h-4" />} label="Address" value={supplier.address || "—"} />
              {contact && (
                <>
                  <Row icon={<Mail className="w-4 h-4" />} label="Contact" value={contact.name} />
                  {contact.email && <Row label="Email" value={contact.email} />}
                  {contact.phone && <Row icon={<Phone className="w-4 h-4" />} label="Phone" value={contact.phone} />}
                </>
              )}
            </dl>
            <SectionReviewControl section={company} onChange={setCompany} disabled={decided} />
            <StepNav onNext={() => setStep("Documents")} nextLabel="Next: Documents" />
          </StepShell>
        </div>
      )}

      {step === "Documents" && (
        <DocumentsReviewStep
          rows={rows}
          disabled={decided}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onReviewDocument={onReviewDocument}
          onBack={() => setStep("Company info")}
          onNext={() => setStep("Decision")}
        />
      )}

      {step === "Decision" && (
        <div className="max-w-2xl mx-auto">
          <DecisionStep
            supplier={supplier}
            company={company}
            rows={rows}
            decided={decided}
            caseStatus={caseItem.status}
            onEditCompany={() => setStep("Company info")}
            onEditDocument={editDocument}
            onBack={() => setStep("Documents")}
            onReview={onReview}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  );
}

/* ── Documents review: list + preview (document width) + approve/decline ──── */
function DocumentsReviewStep({
  rows,
  disabled,
  selectedKey,
  onSelect,
  onReviewDocument,
  onBack,
  onNext,
}: {
  rows: DocRow[];
  disabled: boolean;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onReviewDocument: (docId: string, decision: "approve" | "decline", comment?: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const selected = rows.find((r) => r.key === selectedKey) ?? rows[0];
  const idx = selected ? rows.findIndex((r) => r.key === selected.key) : -1;
  const goPrev = () => idx > 0 && onSelect(rows[idx - 1].key);
  const goNext = () => idx >= 0 && idx < rows.length - 1 && onSelect(rows[idx + 1].key);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Uploaded documents</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review each document — open the preview, then approve or decline with a comment.
        </p>
      </div>

      <div className="flex gap-4 h-[70vh] min-h-[440px]">
        {/* Left: checklist (includes documents not yet uploaded, marked Missing) */}
        <div className="w-72 shrink-0 overflow-y-auto space-y-1.5 pr-1">
          {rows.map((r) => {
            const meta = DOC_STATUS_META[r.doc?.status ?? "missing"];
            const active = selected?.key === r.key;
            return (
              <button
                key={r.key}
                onClick={() => onSelect(r.key)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  active ? "border-primary bg-secondary/60" : "border-border hover:bg-secondary/40"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{r.name}</span>
                </span>
                <Badge variant={meta.variant as any} className="shrink-0">
                  <meta.Icon className="w-3 h-3" />
                  {meta.label}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Right: preview at document width, centered in the remaining space */}
        <div className="flex-1 min-w-0 flex justify-center">
          {selected ? (
            <div className="w-full flex flex-col border border-border rounded-xl overflow-hidden bg-card">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-sm font-semibold truncate">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.category}</p>
                {selected.doc && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-2 text-xs">
                    <dt className="text-muted-foreground">Document type</dt>
                    <dd>{selected.doc.documentType || "—"}</dd>
                    <dt className="text-muted-foreground">Issued by</dt>
                    <dd>{selected.doc.issuingInstitution || "—"}</dd>
                    <dt className="text-muted-foreground">Validity</dt>
                    <dd>
                      {selected.doc.doesNotExpire ? (
                        <span className="flex items-center gap-1.5 text-success-ink">
                          <ShieldCheck className="w-3 h-3" /> This certificate does not expire
                        </span>
                      ) : selected.doc.expiryDate ? (
                        `Expires ${selected.doc.expiryDate}`
                      ) : (
                        "—"
                      )}
                    </dd>
                  </dl>
                )}
              </div>

              <PdfCanvas fileUrl={selected.doc?.fileUrl} className="flex-1 min-h-0" />

              {/* Navigation — bottom of the card, not the header */}
              <div className="flex items-center justify-center gap-3 py-2 border-t border-border">
                <Button variant="outline" size="icon" disabled={idx <= 0} onClick={goPrev} aria-label="Previous document" title="Previous document">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums w-14 text-center">
                  {idx + 1} / {rows.length}
                </span>
                <Button variant="outline" size="icon" disabled={idx >= rows.length - 1} onClick={goNext} aria-label="Next document" title="Next document">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {selected.doc ? (
                <DocActionBar key={selected.doc.id} doc={selected.doc} disabled={disabled} onReviewDocument={onReviewDocument} />
              ) : (
                <div className="border-t border-border p-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileX className="w-3.5 h-3.5" /> Not yet uploaded by the supplier.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a document to preview.
            </div>
          )}
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Next: Decision" />
    </div>
  );
}

function DocActionBar({
  doc,
  disabled,
  onReviewDocument,
}: {
  doc: SupplierDoc;
  disabled: boolean;
  onReviewDocument: (docId: string, decision: "approve" | "decline", comment?: string) => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [comment, setComment] = useState("");

  if (declining) {
    return (
      <div className="border-t border-border p-3 space-y-2">
        <textarea
          autoFocus
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Why is this document being declined? (shared with the supplier)"
          className="w-full rounded-lg border border-border bg-background p-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setDeclining(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!comment.trim()}
            onClick={() => {
              onReviewDocument(doc.id, "decline", comment.trim());
              setDeclining(false);
              setComment("");
            }}
          >
            Confirm decline
          </Button>
        </div>
      </div>
    );
  }

  const meta = DOC_STATUS_META[doc.status];
  return (
    <div className="border-t border-border p-3 flex items-center justify-between gap-3">
      <div className="text-xs min-w-0">
        <span className={`flex items-center gap-1.5 truncate ${meta.iconClass}`}>
          <meta.Icon className="w-3.5 h-3.5 shrink-0" />
          {doc.status === "rejected-resubmit" && doc.statusNote ? `Declined — “${doc.statusNote}”` : meta.label}
        </span>
      </div>
      {!disabled && (
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setDeclining(true)}>
            <XCircle className="w-4 h-4" /> Decline
          </Button>
          <Button variant="success" size="sm" onClick={() => onReviewDocument(doc.id, "approve")}>
            <CheckCircle2 className="w-4 h-4" /> Approve
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Building blocks ─────────────────────────────────────────────────────── */
function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:1.5rem] px-(--card-spacing)">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {children}
    </Card>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-right">{value}</dd>
    </div>
  );
}

function SectionReviewControl({
  section,
  onChange,
  disabled,
}: {
  section: SectionReview;
  onChange: (s: SectionReview) => void;
  disabled?: boolean;
}) {
  const [fixing, setFixing] = useState(false);
  const [draft, setDraft] = useState("");

  if (disabled) return null;

  if (section.status === "confirmed") {
    return (
      <div className="mt-5 flex items-center justify-between rounded-lg border border-success/30 bg-success-soft/40 px-3 py-2">
        <span className="flex items-center gap-2 text-sm text-success-ink">
          <CheckCircle2 className="w-4 h-4" /> Section confirmed
        </span>
        <Button variant="ghost" size="xs" onClick={() => onChange({ status: "pending", comment: "" })}>
          Undo
        </Button>
      </div>
    );
  }

  if (section.status === "fix") {
    return (
      <div className="mt-5 rounded-lg border border-warning/40 bg-warning-soft/40 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-warning-ink">
            <AlertTriangle className="w-4 h-4" /> Fix requested
          </span>
          <Button variant="ghost" size="xs" onClick={() => onChange({ status: "pending", comment: "" })}>
            Undo
          </Button>
        </div>
        {section.comment && <p className="text-xs text-warning-ink/90 mt-1">“{section.comment}”</p>}
      </div>
    );
  }

  if (fixing) {
    return (
      <div className="mt-5 space-y-2">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="What does the supplier need to fix in this section?"
          className="w-full rounded-lg border border-border bg-background p-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setFixing(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={!draft.trim()}
            onClick={() => {
              onChange({ status: "fix", comment: draft.trim() });
              setFixing(false);
            }}
          >
            Save comment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex gap-2">
      <Button variant="success" size="sm" className="flex-1" onClick={() => onChange({ status: "confirmed", comment: "" })}>
        <CheckCircle2 className="w-4 h-4" /> Confirm section
      </Button>
      <Button variant="outline" size="sm" className="flex-1" onClick={() => setFixing(true)}>
        Request a fix / comment
      </Button>
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel }: { onBack?: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex items-center justify-between mt-6">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      ) : (
        <span />
      )}
      <Button variant="default" onClick={onNext}>
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/* ── Decision step ───────────────────────────────────────────────────────── */
function DecisionStep({
  supplier,
  company,
  rows,
  decided,
  caseStatus,
  onEditCompany,
  onEditDocument,
  onBack,
  onReview,
  onClose,
}: {
  supplier: Supplier;
  company: SectionReview;
  rows: DocRow[];
  decided: boolean;
  caseStatus: string;
  onEditCompany: () => void;
  onEditDocument: (key: string) => void;
  onBack: () => void;
  onReview: (id: string, name: string, decision: ProspectDecision, note?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const declinedRows = rows.filter((r) => r.doc?.status === "rejected-resubmit");
  const missingRows = rows.filter((r) => !r.doc);
  const pendingRows = rows.filter((r) => r.doc?.status === "pending-review");
  const approvedCount = rows.filter((r) => r.doc?.status === "valid").length;

  const companyOk = company.status === "confirmed";
  // Onboarding can't be fully approved with documents missing, declined, or
  // still pending review — any of those routes back to the supplier as an
  // update request instead of silently blocking Accept.
  const hasIssues = company.status === "fix" || declinedRows.length > 0 || missingRows.length > 0;
  const canAccept = companyOk && rows.length > 0 && approvedCount === rows.length;

  const feedbackParts: string[] = [];
  if (company.status === "fix" && company.comment) feedbackParts.push(`Company info: ${company.comment}`);
  declinedRows.forEach((r) => feedbackParts.push(`${r.name}: ${r.doc?.statusNote ?? "please re-upload"}`));
  missingRows.forEach((r) => feedbackParts.push(`${r.name}: please upload this document`));
  const combinedFeedback = feedbackParts.join("\n");

  async function decide(decision: ProspectDecision, note?: string) {
    setBusy(true);
    try {
      await onReview(supplier.id, supplier.name, decision, note);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const companyMeta =
    company.status === "confirmed"
      ? { variant: "success-outline", Icon: CheckCircle2, iconClass: "text-success", label: "Confirmed", note: "" }
      : company.status === "fix"
        ? { variant: "critical-outline", Icon: AlertTriangle, iconClass: "text-destructive", label: "Needs update", note: company.comment }
        : { variant: "neutral", Icon: Circle, iconClass: "text-muted-foreground", label: "Not reviewed", note: "" };

  return (
    <StepShell title="Decision" subtitle="Summary of your review. Approved items are ready; items needing an update are editable.">
      {decided && (
        <div className="mb-4 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
          This application is already <span className="font-semibold">{caseStatus}</span>.
        </div>
      )}

      <div className="rounded-xl border border-border divide-y divide-border/60 mb-5">
        <SummaryItem label="Company info" meta={companyMeta} onEdit={companyMeta.label !== "Confirmed" ? onEditCompany : undefined} />
        {rows.map((r) => {
          const key = r.doc?.status ?? "missing";
          const base = DOC_STATUS_META[key];
          const note = r.doc?.status === "rejected-resubmit" ? r.doc.statusNote ?? "" : "";
          return (
            <SummaryItem
              key={r.key}
              label={r.name}
              meta={{ variant: base.variant, Icon: base.Icon, iconClass: base.iconClass, label: base.label, note }}
              onEdit={key !== "valid" ? () => onEditDocument(r.key) : undefined}
            />
          );
        })}
      </div>

      {rejecting ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejection (shared with the supplier)"
            className="w-full rounded-lg border border-border bg-background p-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" disabled={busy || !reason.trim()} onClick={() => decide("reject", reason.trim())}>
              Confirm rejection
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {hasIssues ? (
            <Button variant="dark" className="w-full" disabled={busy} onClick={() => decide("changes", combinedFeedback)}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Request update ({feedbackParts.length})
            </Button>
          ) : (
            <Button variant="success" className="w-full" disabled={busy || !canAccept} onClick={() => decide("accept")}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Accept &amp; activate supplier
            </Button>
          )}
          {!canAccept && !hasIssues && (
            <p className="text-xs text-muted-foreground text-center">
              {pendingRows.length} document{pendingRows.length === 1 ? "" : "s"} still awaiting your review.
            </p>
          )}
          <Button variant="danger" className="w-full" disabled={busy} onClick={() => setRejecting(true)}>
            Reject application
          </Button>
        </div>
      )}

      <div className="mt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>
    </StepShell>
  );
}

function SummaryItem({
  label,
  meta,
  onEdit,
}: {
  label: string;
  meta: { variant: string; Icon: LucideIcon; iconClass: string; label: string; note?: string };
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <meta.Icon className={`w-4 h-4 shrink-0 ${meta.iconClass}`} />
          <span className="text-sm font-medium truncate">{label}</span>
          {onEdit && (
            <button
              onClick={onEdit}
              title="Review / edit"
              aria-label={`Edit ${label}`}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {meta.note && <p className="text-xs text-muted-foreground mt-0.5 ml-6">“{meta.note}”</p>}
      </div>
      <Badge variant={meta.variant as any} className="shrink-0">
        {meta.label}
      </Badge>
    </div>
  );
}
