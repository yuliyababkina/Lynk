import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  RotateCcw,
  FileSignature,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WizardStepper } from "@/components/yarowa/wizard-stepper";
import { WizardFooter } from "@/components/yarowa/wizard-footer";
import { PdfCanvas } from "@/components/yarowa/pdf-canvas";
import { STANDARD_DOCUMENT_TYPES } from "@/lib/onboarding-documents";
import { DOC_STATUS_META, docStatusMeta } from "@/lib/document-status";
import { parseDocumentInfo, type ParsedDocumentInfo } from "@/lib/pdf-metadata";
import { FromFileHint } from "@/components/yarowa/document-browser";
import { useLynkData } from "../lib/LynkDataContext";
import { useI18n } from "@/lib/i18n";
import { CONTRACT_TEMPLATES } from "@/lib/principal";
import { Checkbox } from "@/components/ui/checkbox";
import { translateCatalogueName } from "@/lib/ticket-i18n";
import type { Supplier, SupplierDoc, Contact, OnboardingCase } from "../types";
import type { ProspectDecision } from "../lib/db";

// Status presentation comes from the shared definition so the PM, the supplier,
// and the prospect all see the same label/icon for a given document.

const STEPS = ["Company info", "Documents", "Summary", "Send Contract"] as const;
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

/* Outcome shows in the badge's colour and icon, not just its text: a decided
 * case reads at a glance instead of looking the same as one still in review. */
const CASE_BADGE: Record<string, { variant: string; Icon?: LucideIcon }> = {
  Accepted: { variant: "success", Icon: CheckCircle2 },
  Rejected: { variant: "danger", Icon: XCircle },
  "Changes Requested": { variant: "warning", Icon: AlertTriangle },
  "Contract Sent (Pending Signature)": { variant: "info", Icon: FileSignature },
  "In Review": { variant: "info" },
};

export interface ProspectReviewProps {
  supplier: Supplier;
  docs: SupplierDoc[];
  contact?: Contact;
  caseItem: OnboardingCase;
  onClose: () => void;
  onReview: (id: string, name: string, decision: ProspectDecision, note?: string) => Promise<void>;
  onReset: (supplierId: string) => Promise<void>;
  onSendContract: (supplierId: string, contractName: string, catalogueNames: string[]) => Promise<void>;
  onReviewDocument: (docId: string, decision: "approve" | "decline", comment?: string) => void;
}

export function ProspectReview({
  supplier,
  docs,
  contact,
  caseItem,
  onClose,
  onReview,
  onReset,
  onSendContract,
  onReviewDocument,
}: ProspectReviewProps) {
  // An already-decided case (Accepted/Rejected) opens on the Summary, where the
  // outcome — and the Reset action for a rejected case — is shown, so the PM
  // isn't forced to click through the review steps again.
  const { t } = useI18n();
  const [companyFixing, setCompanyFixing] = useState(false);
  const [step, setStep] = useState<Step>(
    caseItem.status === "Accepted" || caseItem.status === "Rejected" ? "Summary" : "Company info"
  );
  /*
   * Section review state is per-session, so reopening a decided case used to
   * show Company info as "Not reviewed" — nonsense once the application has
   * been accepted. Both of these statuses are only reachable through the send
   * step, which requires the company section to be confirmed, so seed it.
   */
  const [company, setCompany] = useState<SectionReview>(() =>
    caseItem.status === "Accepted" || caseItem.status === "Contract Sent (Pending Signature)"
      ? { status: "confirmed", comment: "" }
      : { status: "pending", comment: "" }
  );
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
        {(() => {
          const meta = CASE_BADGE[caseItem.status] ?? { variant: "info" };
          return (
            <Badge variant={meta.variant as never}>
              {meta.Icon && <meta.Icon className="w-3 h-3" />}
              {t(caseItem.status)}
            </Badge>
          );
        })()}
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
            <SectionReviewControl
              section={company}
              onChange={setCompany}
              disabled={decided}
              fixing={companyFixing}
              onFixingChange={setCompanyFixing}
            />
            <StepNav
              onNext={() => setStep("Documents")}
              nextLabel="Next: Documents"
              secondary={
                // Low-emphasis escape hatch beside the primary: flag something in
                // this section without leaving the step.
                !decided && company.status !== "fix" && !companyFixing ? (
                  <Button variant="ghost" onClick={() => setCompanyFixing(true)}>
                    {t("Request a change")}
                  </Button>
                ) : undefined
              }
            />
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
          onNext={() => setStep("Summary")}
        />
      )}

      {step === "Send Contract" && (
        <div className="max-w-2xl mx-auto">
          <SendContractStep
            supplier={supplier}
            recipientEmail={caseItem.email}
            onBack={() => setStep("Summary")}
            onSend={async (contractName: string, catalogueNames: string[]) => {
              await onSendContract(supplier.id, contractName, catalogueNames);
              onClose();
            }}
          />
        </div>
      )}

      {step === "Summary" && (
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
            onReset={onReset}
            onNextSendContract={() => setStep("Send Contract")}
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

  // Every uploaded document needs a decision before the summary makes sense.
  const pendingCount = rows.filter((r) => r.doc?.status === "pending-review").length;

  const [pageInfo, setPageInfo] = useState<{ current: number; total: number } | null>(null);
  useEffect(() => setPageInfo(null), [selected?.key]);

  // Read type / issuer / validity out of the PDF; stored (confirmed) values win.
  const [parsed, setParsed] = useState<ParsedDocumentInfo | null>(null);
  useEffect(() => {
    setParsed(null);
    const url = selected?.doc?.fileUrl;
    if (!url) return;
    let cancelled = false;
    parseDocumentInfo(url).then((i) => !cancelled && setParsed(i));
    return () => {
      cancelled = true;
    };
  }, [selected?.doc?.fileUrl]);

  const d = selected?.doc;
  const info = d
    ? {
        documentType: d.documentType || parsed?.documentType,
        issuingInstitution: d.issuingInstitution || parsed?.issuingInstitution,
        expiryDate: d.expiryDate || parsed?.validity,
        doesNotExpire: d.doesNotExpire || parsed?.doesNotExpire,
        fromFile: {
          type: !d.documentType && Boolean(parsed?.documentType),
          issuer: !d.issuingInstitution && Boolean(parsed?.issuingInstitution),
          validity: !d.expiryDate && !d.doesNotExpire && Boolean(parsed?.validity || parsed?.doesNotExpire),
        },
      }
    : null;

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
              <div className="px-4 py-2.5 border-b border-border flex items-start justify-between gap-3">
                <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.category}</p>
                {selected.doc && info && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-2 text-xs">
                    <dt className="text-muted-foreground">Document type</dt>
                    <dd>
                      {info.documentType || "—"}
                      {info.fromFile.type && <FromFileHint />}
                    </dd>
                    <dt className="text-muted-foreground">Issued by</dt>
                    <dd>
                      {info.issuingInstitution || "—"}
                      {info.fromFile.issuer && <FromFileHint />}
                    </dd>
                    <dt className="text-muted-foreground">Validity</dt>
                    <dd>
                      {info.doesNotExpire ? (
                        <span className="inline-flex items-center gap-1.5 text-success-ink">
                          <ShieldCheck className="w-3 h-3" /> This certificate does not expire
                        </span>
                      ) : info.expiryDate ? (
                        `Expires ${info.expiryDate}`
                      ) : (
                        "—"
                      )}
                      {info.fromFile.validity && <FromFileHint />}
                    </dd>
                  </dl>
                )}
                </div>
                {/* Status, same badge style as the list on the left */}
                {(() => {
                  const m = docStatusMeta(selected.doc?.status);
                  return (
                    <Badge variant={m.variant as any} className="shrink-0">
                      <m.Icon className="w-3 h-3" />
                      {m.label}
                    </Badge>
                  );
                })()}
              </div>

              <PdfCanvas
                key={selected.key}
                fileUrl={selected.doc?.fileUrl}
                className="flex-1 min-h-0"
                onPageInfo={setPageInfo}
              />

              {/* Pages within the open document */}
              <div className="flex items-center justify-center py-2 border-t border-border text-xs text-muted-foreground tabular-nums">
                {selected.doc?.fileUrl && pageInfo
                  ? `${pageInfo.current} of ${pageInfo.total} page${pageInfo.total === 1 ? "" : "s"}`
                  : "—"}
              </div>

              {/* Document navigation sits on the same level as the review actions */}
              <div className="border-t border-border p-3 flex items-center justify-between gap-3">
                {/* Boundary buttons are hidden, not disabled — works for any
                    number of documents, including a single one. */}
                {idx > 0 ? (
                  <Button variant="outline" size="sm" className="shrink-0" title="Previous document" onClick={goPrev}>
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                ) : (
                  <span />
                )}
                {/* Review actions, with "Next document" always furthest right. */}
                <div className="flex items-center gap-2 min-w-0">
                  {selected.doc ? (
                    <DocActionBar key={selected.doc.id} doc={selected.doc} disabled={disabled} onReviewDocument={onReviewDocument} />
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileX className="w-3.5 h-3.5" /> Not yet uploaded by the supplier.
                    </span>
                  )}
                  {idx < rows.length - 1 && (
                    /* Once a document is approved, moving on is the primary action. */
                    <Button
                      variant={selected.doc?.status === "valid" ? "default" : "outline"}
                      size="sm"
                      className="shrink-0"
                      title="Next document"
                      onClick={goNext}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a document to preview.
            </div>
          )}
        </div>
      </div>

      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextLabel="Next: Summary"
        nextDisabled={pendingCount > 0}
        nextHint={`${pendingCount} document${pendingCount === 1 ? "" : "s"} still awaiting your review`}
      />
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
  const { t } = useI18n();
  const [declining, setDeclining] = useState(false);
  const [comment, setComment] = useState("");
  const approved = doc.status === "valid";

  // Rendered inside the footer row, so no wrapper of its own.
  if (declining) {
    return (
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <input
          autoFocus
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            approved
              ? "What should the supplier update? (shared with the supplier)"
              : "Why is this document being declined? (shared with the supplier)"
          }
          className="flex-1 min-w-0 h-9 rounded-lg border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setDeclining(false)}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="shrink-0"
          disabled={!comment.trim()}
          onClick={() => {
            // Same outcome either way: the supplier has to resubmit this document.
            onReviewDocument(doc.id, "decline", comment.trim());
            setDeclining(false);
            setComment("");
          }}
        >
          {t("Send request")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Status lives in the header badge; only the feedback needs repeating here. */}
      {doc.status === "rejected-resubmit" && doc.statusNote && (
        <span className="text-xs text-destructive truncate">“{doc.statusNote}”</span>
      )}
      {!disabled && (
        <div className="flex gap-2 shrink-0">
          {/* Approve stays the emphasised action; asking for a change is the
              low-emphasis option and sits closest to "Next document", matching
              the Company info step. */}
          {!approved && (
            <Button variant="success" size="sm" onClick={() => onReviewDocument(doc.id, "approve")}>
              <CheckCircle2 className="w-4 h-4" /> {t("Approve")}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDeclining(true)}>
            <AlertTriangle className="w-4 h-4" /> {t("Request a change")}
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
  fixing: controlledFixing,
  onFixingChange,
}: {
  section: SectionReview;
  onChange: (s: SectionReview) => void;
  disabled?: boolean;
  /** Lets the step footer open the "request a change" flow from outside. */
  fixing?: boolean;
  onFixingChange?: (v: boolean) => void;
}) {
  const [localFixing, setLocalFixing] = useState(false);
  const [draft, setDraft] = useState("");

  /*
   * A decided case can't be re-reviewed, but it still has to show the outcome.
   * Returning null here left an accepted application looking as though its
   * company information had never been checked.
   */
  const fixing = controlledFixing ?? localFixing;
  const setFixing = (v: boolean) => (onFixingChange ? onFixingChange(v) : setLocalFixing(v));

  if (disabled) {
    if (section.status === "confirmed") {
      return (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft/40 px-3 py-2 text-sm text-success-ink">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Verified and accepted
        </div>
      );
    }
    if (section.status === "fix") {
      return (
        <div className="mt-5 rounded-lg border border-warning/40 bg-warning-soft/40 px-3 py-2.5 text-sm text-warning-ink">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Fix requested
          </span>
          {section.comment && <p className="text-xs text-warning-ink/90 mt-1">“{section.comment}”</p>}
        </div>
      );
    }
    return null;
  }

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

function StepNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  nextHint,
  secondary,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  /** Explains why the step can't be left yet. */
  nextHint?: string;
  /** Low-emphasis action shown immediately left of Next. */
  secondary?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between mt-6 gap-4">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> {t("Back")}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        {nextDisabled && nextHint && <span className="text-xs text-muted-foreground">{nextHint}</span>}
        {secondary}
        <Button variant="default" disabled={nextDisabled} onClick={onNext}>
          {nextLabel} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
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
  onReset,
  onNextSendContract,
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
  onReset: (supplierId: string) => Promise<void>;
  onNextSendContract: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [reason, setReason] = useState("");

  const declinedRows = rows.filter((r) => r.doc?.status === "rejected-resubmit");
  const missingRows = rows.filter((r) => !r.doc);

  const companyOk = company.status === "confirmed";
  // Onboarding can't be fully approved with documents missing, declined, or
  // still pending review — any of those routes back to the supplier as an
  // update request instead of silently blocking Accept.
  const hasIssues = company.status === "fix" || declinedRows.length > 0 || missingRows.length > 0;
  /*
   * Sending is blocked only by something the PM hasn't accepted yet: the company
   * section, or a document that is missing, still pending review, declined, or
   * expired. A document that is approved but merely nearing expiry
   * (warning-60/30) counts as accepted — previously only "valid" counted, so a
   * single expiring document disabled the primary action for good while the
   * hint text still claimed nothing was awaiting review.
   */
  const unacceptedRows = rows.filter(
    (r) =>
      !r.doc ||
      r.doc.status === "pending-review" ||
      r.doc.status === "rejected-resubmit" ||
      r.doc.status === "blocked"
  );
  const canAccept = companyOk && unacceptedRows.length === 0;
  const blocker = !companyOk
    ? "Confirm the company information to continue."
    : unacceptedRows.length > 0
      ? `${unacceptedRows.length} document${unacceptedRows.length === 1 ? "" : "s"} still need your approval.`
      : null;

  const feedbackParts: string[] = [];
  if (company.status === "fix" && company.comment) feedbackParts.push(`Company info: ${company.comment}`);
  declinedRows.forEach((r) => feedbackParts.push(`${r.name}: ${r.doc?.statusNote ?? "please re-upload"}`));
  missingRows.forEach((r) => feedbackParts.push(`${r.name}: please upload this document`));
  const combinedFeedback = feedbackParts.join("\n");

  const isRejected = caseStatus === "Rejected";
  const { setCompanyApproved } = useLynkData();
  const { t } = useI18n();

  async function decide(decision: ProspectDecision, note?: string) {
    setBusy(true);
    try {
      // Record whether the PM approved the Company-info section, so the prospect
      // sees it marked "Approved by procurement" on their side.
      setCompanyApproved(supplier.id, company.status === "confirmed");
      await onReview(supplier.id, supplier.name, decision, note);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await onReset(supplier.id);
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
    <StepShell title="Summary" subtitle="Summary of your review. Approved items are ready; items needing an update are editable.">
      {decided && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            caseStatus === "Accepted"
              ? "bg-success-soft text-success-ink"
              : caseStatus === "Rejected"
                ? "bg-critical-soft text-critical-ink"
                : "border border-border bg-secondary/40"
          }`}
        >
          {caseStatus === "Accepted" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : caseStatus === "Rejected" ? (
            <XCircle className="w-4 h-4 shrink-0" />
          ) : null}
          <span>
            This application is already <span className="font-semibold">{t(caseStatus)}</span>.
          </span>
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

      {isRejected ? (
        resetting ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              This clears the submitted application and returns the case to{" "}
              <span className="font-medium text-foreground">Invited</span>. The existing magic link keeps working,
              so the prospect can start over.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => setResetting(false)}>
                Cancel
              </Button>
              <Button variant="dark" className="flex-1" disabled={busy} onClick={reset}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reset onboarding
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" disabled={busy} onClick={() => setResetting(true)}>
            <RotateCcw className="w-4 h-4" />
            Reset the onboarding process
          </Button>
        )
      ) : rejecting ? (
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
        <>
          {blocker && <p className="text-xs text-muted-foreground text-center mb-3">{blocker}</p>}
          <WizardFooter onBack={onBack}>
            {/* Secondary + destructive: consequential, but visually subordinate
                to the one clear primary path beside it. */}
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={() => setRejecting(true)}
            >
              {t("Reject application")}
            </Button>
            {hasIssues ? (
              <Button variant="dark" disabled={busy} onClick={() => decide("changes", combinedFeedback)}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Request update ({feedbackParts.length})
              </Button>
            ) : (
              // Approving isn't the finish line — the contract and catalogues
              // still have to go out for signature, so the primary names that step.
              <Button variant="default" disabled={busy || !canAccept} onClick={onNextSendContract}>
                {t("Next: Send Contract and Service catalogs")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </WizardFooter>
        </>
      )}

      {/* The main branch already has Back inside its footer. */}
      {(isRejected || rejecting) && (
        <div className="mt-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> {t("Back")}
          </Button>
        </div>
      )}
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

/* ── Send Contract & Service Catalogs ─────────────────────────────────────
 * The step between an approved review and an active supplier: the PM picks the
 * contract template and the price lists that apply, and sends them for
 * signature. Sending moves the case to "Contract Sent (Pending Signature)" —
 * the supplier still has to sign before they become active.
 */
function SendContractStep({
  supplier,
  recipientEmail,
  onBack,
  onSend,
}: {
  supplier: Supplier;
  /** Where the "ready to sign" email goes — shown so the PM can see it. */
  recipientEmail?: string;
  onBack: () => void;
  onSend: (contractName: string, catalogueNames: string[]) => Promise<void>;
}) {
  const { catalogues } = useLynkData();
  const { t } = useI18n();
  const [template, setTemplate] = useState<string>(CONTRACT_TEMPLATES[0]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggle = (name: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  async function send() {
    setBusy(true);
    try {
      await onSend(template, [...picked]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepShell
      title={t("Send Contract & Service Catalogs")}
      subtitle={t(
        "Choose what to send {company} for signature. The case moves to awaiting signature once sent.",
        { company: supplier.name }
      )}
    >
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t("Contract template")}
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {CONTRACT_TEMPLATES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t("Service catalogues")}
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            {t("Select the price lists that apply to this supplier's work orders.")}
          </p>
          <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
            {catalogues.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.name)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-secondary/50"
              >
                <Checkbox checked={picked.has(c.name)} tabIndex={-1} className="pointer-events-none" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium truncate">{translateCatalogueName(c.name, t)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.versionLabel} · {t(c.region)} · {t(c.trade)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {picked.size === 0 && (
            <p className="text-xs text-muted-foreground mt-2">{t("Select at least one service catalogue.")}</p>
          )}
        </div>
      </div>

      {recipientEmail && (
        <p className="text-xs text-muted-foreground pt-4">
          {t("An email with a signing link goes to {email}.", { email: recipientEmail })}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-5">
        <Button variant="outline" onClick={onBack} disabled={busy}>
          <ArrowLeft className="w-4 h-4" /> {t("Back")}
        </Button>
        <Button variant="default" onClick={send} disabled={busy || picked.size === 0}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t("Send contracts")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </StepShell>
  );
}
