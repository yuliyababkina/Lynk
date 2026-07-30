import { useRef, useState } from "react";
import {
  Building2,
  MapPin,
  Upload,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStepper } from "@/components/yarowa/wizard-stepper";
import { DocumentMetadataForm } from "@/components/yarowa/document-metadata-form";
import { DocumentBrowser, type DocumentBrowserRow } from "@/components/yarowa/document-browser";
import { useLynkData } from "@/lib/LynkDataContext";
import { recogniseDocumentMetadata, type DocumentMetadata } from "@/lib/onboarding-documents";
import { docStatusMeta } from "@/lib/document-status";
import type { DocStatus } from "@/types";
import { getPortalProfile } from "./portal/portal-data";

export interface ProspectOnboardingProps {
  supplierId: string;
  supplierName: string;
  onSwitchAccount?: () => void;
}

type Step = "welcome" | "company" | "documents" | "principal" | "done";

const STEPPER = ["Company info", "Documents", "Principal Docs", "Complete"] as const;
const STEP_LABEL: Partial<Record<Step, string>> = {
  company: "Company info",
  documents: "Documents",
  principal: "Principal Docs",
  done: "Complete",
};

const PRINCIPAL = "Yarowa AG";

/* ── Compliance-document checklist rows ──────────────────────────────────── */
interface DocRowDef {
  key: string;
  name: string;
  hint: string;
  required?: boolean;
}

// Step 3 — standard docs every supplier needs. Each is uploadable.
const STANDARD_DOCS: DocRowDef[] = [
  { key: "cert-inc", name: "Certificate of Incorporation", hint: "On file from previous onboarding" },
  { key: "vat", name: "VAT Registration Certificate", hint: "DE289347821 — verified" },
  { key: "pli", name: "Public Liability Insurance", hint: "Please upload: minimum €2M coverage required", required: true },
  { key: "bank", name: "Bank Confirmation Letter", hint: "IBAN confirmed — no action needed" },
  { key: "trade", name: "Trade Licence", hint: "Your licence expired Jan 2026 — upload renewed version", required: true },
];

// Step 4 — principal-specific docs already satisfied for this relationship.
const PRINCIPAL_DOCS: { name: string; hint: string; state: "uploaded" | "verified"; optional?: boolean }[] = [
  { name: "ISO 9001 Certificate", hint: "Required for Yarowa AG — quality management certification", state: "uploaded" },
  { name: "Conflict Minerals Declaration", hint: "On file — OECD compliant", state: "verified" },
  { name: "Signed Code of Conduct", hint: "Please sign and upload the Principal's code of conduct", state: "uploaded" },
  { name: "ESG Self-Assessment", hint: "Completed — score 75/100", state: "verified", optional: true },
];

export function ProspectOnboarding({ supplierId, supplierName, onSwitchAccount }: ProspectOnboardingProps) {
  const { suppliers, docs, onboardingCases, addSupplierDoc, updateSupplierProfile, submitProspectForReview } =
    useLynkData();
  // Live status per document type — the same values the Procurement Manager sees.
  const statusByName = new Map(
    docs.filter((d) => d.supplierId === supplierId).map((d) => [d.documentName, d])
  );
  const dbSupplier = suppliers.find((s) => s.id === supplierId);
  const profile = getPortalProfile(supplierId);
  const firstName = profile.firstName;

  // PM review outcome (drives the loop-back / approved states from the flow).
  const myCase = onboardingCases.find((c) => c.id === `onb-${supplierId}`);
  const reviewStatus = myCase?.status;
  const reviewNote = myCase?.reviewNote;

  const [step, setStep] = useState<Step>("welcome");

  // ── Company form ──────────────────────────────────────────────────────
  const [form, setForm] = useState(() => ({
    legalName: dbSupplier?.name ?? profile.company.legalName,
    vatId: dbSupplier?.vatId ?? profile.company.vatId,
    registrationNo: profile.company.registrationNo,
    website: profile.company.website,
    street: profile.company.address.street,
    city: profile.company.address.city,
    postcode: profile.company.address.postcode,
    country: profile.company.address.country,
  }));
  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const [savingCompany, setSavingCompany] = useState(false);

  async function submitCompany() {
    setSavingCompany(true);
    try {
      const address = `${form.street}, ${form.postcode} ${form.city}, ${form.country}`;
      await updateSupplierProfile(supplierId, { name: form.legalName, vatId: form.vatId, address });
      setStep("documents");
    } finally {
      setSavingCompany(false);
    }
  }

  // ── Document uploads (step 3) ─────────────────────────────────────────
  const [uploadedKeys, setUploadedKeys] = useState<Set<string>>(new Set());
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A picked file waits here while the uploader reviews the recognised metadata;
  // nothing is stored until they confirm.
  const [pending, setPending] = useState<{ row: DocRowDef; file: File; prefill: DocumentMetadata } | null>(null);

  // Same list + preview browser the Procurement Manager uses.
  const docRows: DocumentBrowserRow[] = STANDARD_DOCS.map((d) => {
    const live = statusByName.get(d.name);
    return {
      key: d.key,
      name: d.name,
      category: live?.documentCategory || d.name,
      status: live?.status,
      statusNote: live?.statusNote,
      fileUrl: live?.fileUrl,
      documentType: live?.documentType,
      issuingInstitution: live?.issuingInstitution,
      expiryDate: live?.expiryDate,
      doesNotExpire: live?.doesNotExpire,
    };
  });
  const [selectedDocKey, setSelectedDocKey] = useState<string>(STANDARD_DOCS[0].key);
  const selectedRowName = docRows.find((r) => r.key === selectedDocKey)?.name ?? STANDARD_DOCS[0].name;
  const docInputRef = useRef<HTMLInputElement>(null);

  function pickDoc(row: DocRowDef, file: File) {
    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    setPending({ row, file, prefill: recogniseDocumentMetadata(row.name) });
  }

  async function confirmUpload(metadata: DocumentMetadata) {
    if (!pending) return;
    const { row, file } = pending;
    setUploadingKey(row.key);
    try {
      await addSupplierDoc(file, supplierId, supplierName, profile.role, row.name, metadata);
      setUploadedKeys((prev) => new Set(prev).add(row.key));
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadingKey(null);
    }
  }

  // Required documents must be on file and not declined — judged from the shared
  // data, so a document the PM declined blocks the step again.
  const requiredStandardDone = STANDARD_DOCS.filter((d) => d.required).every((d) => {
    const live = statusByName.get(d.name);
    return (live && live.status !== "rejected-resubmit") || uploadedKeys.has(d.key);
  });

  // ── Submit for review (end of step 4) ─────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  async function submitForReview() {
    setSubmitting(true);
    try {
      await submitProspectForReview(supplierId, supplierName, profile.fullName);
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  }

  const showStepper = step !== "welcome";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-sidebar text-foreground">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center px-6 bg-background border-b border-border">
        <div className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center text-[11px] font-bold">
          L
        </div>
        <span className="ml-2 text-sm font-semibold">Lynk</span>
        <span className="ml-1.5 text-sm text-muted-foreground">· Supplier Portal</span>
        <div className="flex-1" />
        {onSwitchAccount && (
          <button
            onClick={onSwitchAccount}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Roles board
          </button>
        )}
      </header>

      {/* Stepper */}
      {showStepper && (
        <div className="shrink-0 bg-background border-b border-border py-3">
          <WizardStepper steps={STEPPER} current={STEP_LABEL[step]!} />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* The documents step needs the full width so the preview can show the
            page at 100% scale; the form/summary steps read better in a column. */}
        <div
          className={`mx-auto px-6 py-10 ${
            step === "documents" && !pending ? "max-w-[1600px]" : "max-w-2xl"
          }`}
        >
          {step === "welcome" && (
            <WelcomeStep
              firstName={firstName}
              onNext={() => setStep("company")}
              reviewStatus={reviewStatus}
              reviewNote={reviewNote}
            />
          )}

          {step === "company" && (
            <CompanyStep
              form={form}
              setField={setField}
              saving={savingCompany}
              onSubmit={submitCompany}
            />
          )}

          {step === "documents" && pending && (
            <section className="space-y-5">
              <div>
                <h1 className="text-xl font-bold">Review document details</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Confirm the details below so your principals can verify this document.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Card className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:1.25rem] px-(--card-spacing)">
                <DocumentMetadataForm
                  fileName={pending.file.name}
                  documentName={pending.row.name}
                  initial={pending.prefill}
                  busy={uploadingKey === pending.row.key}
                  onCancel={() => setPending(null)}
                  onConfirm={confirmUpload}
                />
              </Card>
            </section>
          )}

          {step === "documents" && !pending && (
            <section className="space-y-5">
              <div>
                <h1 className="text-xl font-bold">Standard Compliance Documents</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  These documents are required for all suppliers on the Lynk platform.
                  <br />
                  Documents already on file are shown as verified — only upload what's missing.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DocumentBrowser
                rows={docRows}
                selectedKey={selectedDocKey}
                onSelect={setSelectedDocKey}
                renderActions={(r) => {
                  const def = STANDARD_DOCS.find((d) => d.name === r.name);
                  return (
                    <div className="border-t border-border p-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground min-w-0 truncate">
                        {r.status === "rejected-resubmit" && r.statusNote
                          ? `Declined — “${r.statusNote}”`
                          : def?.hint ?? ""}
                      </p>
                      {(!r.status || r.status === "rejected-resubmit") && def && (
                        <Button
                          variant="dark"
                          size="sm"
                          className="shrink-0"
                          disabled={uploadingKey === def.key}
                          onClick={() => docInputRef.current?.click()}
                        >
                          {uploadingKey === def.key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {r.status === "rejected-resubmit" ? "Replace document" : "Upload document"}
                        </Button>
                      )}
                    </div>
                  );
                }}
              />
              {/* Single hidden picker, targeted at whichever document is selected. */}
              <input
                ref={docInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  const def = STANDARD_DOCS.find((d) => d.name === selectedRowName);
                  if (f && def) pickDoc(def, f);
                }}
              />
              <Button
                variant="dark"
                className="w-full"
                disabled={!requiredStandardDone}
                onClick={() => setStep("principal")}
              >
                Continue to Principal Documents <ArrowRight className="w-4 h-4" />
              </Button>
              {!requiredStandardDone && (
                <p className="text-xs text-muted-foreground text-center">
                  Upload the required documents (Public Liability Insurance, Trade Licence) to continue.
                </p>
              )}
            </section>
          )}

          {step === "principal" && (
            <section className="space-y-5">
              <div>
                <h1 className="text-xl font-bold">Additional Documents for {PRINCIPAL}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  These additional documents are specifically required for your new relationship with{" "}
                  {PRINCIPAL} as Principal.
                </p>
              </div>
              <div className="space-y-3">
                {PRINCIPAL_DOCS.map((d) => (
                  <StatusRow key={d.name} name={d.name} hint={d.hint} state={d.state} optional={d.optional} />
                ))}
              </div>
              <Button variant="dark" className="w-full" disabled={submitting} onClick={submitForReview}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Documents <ArrowRight className="w-4 h-4" />
              </Button>
            </section>
          )}

          {step === "done" && <DoneStep />}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: Welcome ──────────────────────────────────────────────────── */
function WelcomeStep({
  firstName,
  onNext,
  reviewStatus,
  reviewNote,
}: {
  firstName: string;
  onNext: () => void;
  reviewStatus?: string;
  reviewNote?: string;
}) {
  // Accepted is a terminal, celebratory state — no need to re-run the wizard.
  if (reviewStatus === "Accepted") {
    return (
      <section className="text-center pt-6">
        <div className="w-12 h-12 rounded-full bg-success-soft mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-success" />
        </div>
        <h1 className="text-2xl font-bold mt-4">You're approved 🎉</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          Your application was accepted. Yilmaz Elektrotechnik GmbH is now an active supplier for {PRINCIPAL}.
        </p>
      </section>
    );
  }

  const changesRequested = reviewStatus === "Changes Requested";
  const rejected = reviewStatus === "Rejected";

  return (
    <section className="text-center pt-6">
      <div className="w-12 h-12 rounded-xl bg-secondary mx-auto flex items-center justify-center text-2xl">
        🏗️
      </div>
      <h1 className="text-2xl font-bold mt-4">Welcome, {firstName}</h1>
      <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
        You've been invited to extend your existing supplier relationship to a new Principal — {PRINCIPAL}.
        Your existing data has been pre-filled. Please review, confirm, and upload any missing documents.
      </p>

      {changesRequested && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft/50 p-3 text-left">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning-ink">Changes requested by procurement</p>
            {reviewNote && <p className="text-xs text-warning-ink/90 mt-0.5">“{reviewNote}”</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Please update your details/documents and resubmit.
            </p>
          </div>
        </div>
      )}

      {rejected && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left">
          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Application not approved</p>
            {reviewNote && <p className="text-xs text-destructive/90 mt-0.5">“{reviewNote}”</p>}
          </div>
        </div>
      )}

      <Card className="rounded-2xl border border-border ring-0 shadow-none text-left mt-6 [--card-spacing:1.25rem] px-(--card-spacing)">
        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <div>
            <p className="text-sm font-semibold">Invitation from Sabine Müller</p>
            <p className="text-xs text-muted-foreground">Procurement Manager · Lynk Platform</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3">
          <p className="text-sm italic text-muted-foreground">
            "Hi {firstName}, we'd like to extend our supplier relationship with Yilmaz Elektrotechnik GmbH
            to cover a new Principal account with {PRINCIPAL}. Your existing profile has been pre-filled —
            please confirm your details and upload any new requirements. — Sabine"
          </p>
        </div>
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-accent/5 p-3 text-left">
        <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          This link is private and expires in 72 hours. Your data is protected under GDPR. Only authorised
          Lynk procurement staff can access your profile.
        </p>
      </div>

      {!rejected && (
        <Button variant="dark" className="w-full mt-6" onClick={onNext}>
          {changesRequested ? "Update & Resubmit My Details" : "Review & Confirm My Details"}{" "}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </section>
  );
}

/* ── Step 2: Company info ─────────────────────────────────────────────── */
type Form = {
  legalName: string;
  vatId: string;
  registrationNo: string;
  website: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
};
function CompanyStep({
  form,
  setField,
  saving,
  onSubmit,
}: {
  form: Form;
  setField: (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  onSubmit: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-primary" />
        <h1 className="text-base font-semibold">Company Details</h1>
      </div>
      <div className="space-y-4">
        <FormField label="Legal Name" value={form.legalName} onChange={setField("legalName")} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="VAT ID" value={form.vatId} onChange={setField("vatId")} />
          <FormField label="Registration No." value={form.registrationNo} onChange={setField("registrationNo")} />
        </div>
        <FormField label="Website" value={form.website} onChange={setField("website")} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <MapPin className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold">Registered Address</h2>
      </div>
      <div className="space-y-4">
        <FormField label="Street" value={form.street} onChange={setField("street")} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" value={form.city} onChange={setField("city")} />
          <FormField label="Postcode" value={form.postcode} onChange={setField("postcode")} />
        </div>
        <FormField label="Country" value={form.country} onChange={setField("country")} />
      </div>

      <Button variant="dark" className="w-full" disabled={saving} onClick={onSubmit}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Submit My Details <ArrowRight className="w-4 h-4" />
      </Button>
    </section>
  );
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={onChange} className="h-10 rounded-lg border-border bg-background" />
    </div>
  );
}

/* ── Document rows ────────────────────────────────────────────────────── */
function UploadRow({
  row,
  status,
  statusNote,
  uploading,
  onFile,
}: {
  row: DocRowDef;
  /** Live status from the shared data (undefined = not uploaded yet). */
  status?: DocStatus;
  statusNote?: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = status ? docStatusMeta(status) : null;
  // A declined document has to be replaced, so keep the upload affordance.
  const canUpload = !status || status === "rejected-resubmit";
  return (
    <Card className="rounded-xl border border-border ring-0 shadow-none [--card-spacing:1rem] px-(--card-spacing)">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {row.name}
              {row.required && <span className="text-destructive"> *</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "rejected-resubmit" && statusNote ? `Declined — “${statusNote}”` : row.hint}
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />
        <div className="flex items-center gap-2 shrink-0">
          {meta && (
            <Badge variant={meta.variant as any}>
              <meta.Icon className="w-3 h-3" />
              {meta.label}
            </Badge>
          )}
          {canUpload && (
            <Button variant="outline" size="xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {status === "rejected-resubmit" ? "Replace" : "Upload"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatusRow({
  name,
  hint,
  state,
  optional,
}: {
  name: string;
  hint: string;
  state: "uploaded" | "verified";
  optional?: boolean;
}) {
  return (
    <Card
      className={`rounded-xl border ring-0 shadow-none [--card-spacing:1rem] px-(--card-spacing) ${
        state === "verified" ? "border-success/30 bg-success-soft/40" : "border-accent/30 bg-accent/5"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {name}
              {optional && <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
          </div>
        </div>
        <Badge variant={state === "verified" ? "success-outline" : "warning-outline"} className="shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          {state === "verified" ? "Verified" : "Uploaded"}
        </Badge>
      </div>
    </Card>
  );
}

/* ── Step 5: Done ─────────────────────────────────────────────────────── */
function DoneStep() {
  return (
    <section className="text-center pt-6">
      <div className="w-12 h-12 rounded-full bg-success-soft mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-success" />
      </div>
      <h1 className="text-2xl font-bold mt-4">You're all done!</h1>
      <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
        Your profile and all required documents have been submitted. Sabine Müller at Lynk will now complete
        the qualification review. You'll receive an email once a decision has been made.
      </p>

      <Card className="rounded-2xl border border-border ring-0 shadow-none text-left mt-6 [--card-spacing:1.25rem] px-(--card-spacing)">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          What happens next
        </p>
        <ol className="space-y-2">
          {[
            "Procurement team reviews your qualification score",
            "You'll be notified by email of the outcome",
            `If approved, Yilmaz Elektrotechnik GmbH will be activated as a supplier for ${PRINCIPAL}`,
          ].map((t, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-primary font-semibold">{i + 1}</span>
              <span className="text-muted-foreground">{t}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-accent/5 p-3 text-left">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Your data is protected under GDPR. You can request deletion at any time.
        </p>
      </div>
    </section>
  );
}
