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
  Pencil,
  Trash2,
  FileSignature,
  ClipboardList,
  PenLine,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WizardFooter } from "@/components/yarowa/wizard-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { WizardStepper } from "@/components/yarowa/wizard-stepper";
import { DocumentMetadataForm } from "@/components/yarowa/document-metadata-form";
import { DocumentBrowser, type DocumentBrowserRow } from "@/components/yarowa/document-browser";
import { useLynkData } from "@/lib/LynkDataContext";
import { recogniseDocumentMetadata, type DocumentMetadata } from "@/lib/onboarding-documents";
import { docStatusMeta } from "@/lib/document-status";
import { validityToISODate, type ParsedDocumentInfo } from "@/lib/pdf-metadata";
import { PRINCIPAL_COMPANY, PRINCIPAL_CONTRACTS, type PrincipalContract } from "@/lib/principal";
import { toast } from "@/components/yarowa/toast";
import { LanguageToggle } from "@/components/yarowa/language-toggle";
import { MachineTranslatedTag } from "@/components/yarowa/machine-translated-tag";
import { useI18n } from "@/lib/i18n";
import { translateContent } from "@/lib/content-i18n";
import { cn } from "@/lib/utils";
import { TERMS_SECTIONS, TERMS_VERSION, TERMS_EFFECTIVE_DATE } from "@/lib/terms";
import type { DocStatus, SupplierDoc } from "@/types";
import { getPortalProfile } from "./portal/portal-data";

export interface ProspectOnboardingProps {
  supplierId: string;
  supplierName: string;
  /** Person the invitation was addressed to; greets them by name instead of
   * falling back to the demo persona. */
  contactName?: string;
  onSwitchAccount?: () => void;
}

type Step = "welcome" | "company" | "documents" | "done";

const STEPPER = ["Company info", "Documents", "Contracts", "Complete"] as const;
const STEP_LABEL: Partial<Record<Step, string>> = {
  company: "Company info",
  documents: "Documents",
  done: "Complete",
};

const PRINCIPAL = PRINCIPAL_COMPANY;

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
export function ProspectOnboarding({
  supplierId,
  supplierName,
  contactName,
  onSwitchAccount,
}: ProspectOnboardingProps) {
  const {
    suppliers,
    docs,
    onboardingCases,
    addSupplierDoc,
    updateDocMetadata,
    removeSupplierDoc,
    updateSupplierProfile,
    submitProspectForReview,
    acceptTerms,
    companyApprovedIds,
  } = useLynkData();
  // Live status per document type — the same values the Procurement Manager sees.
  const statusByName = new Map(
    docs.filter((d) => d.supplierId === supplierId).map((d) => [d.documentName, d])
  );
  const dbSupplier = suppliers.find((s) => s.id === supplierId);
  const profile = getPortalProfile(supplierId);
  // Greet whoever the invitation was addressed to. Falls back to the demo
  // persona only for the built-in personas, which carry no invitation.
  const invitedName = contactName?.trim() && contactName.trim() !== "—" ? contactName.trim() : "";
  const firstName = invitedName ? invitedName.split(/\s+/)[0] : profile.firstName;
  // The invited supplier's own company, as entered on the invitation.
  const prospectCompany = dbSupplier?.name ?? supplierName ?? profile.company.legalName;

  // PM review outcome (drives the loop-back / approved states from the flow).
  const myCase = onboardingCases.find((c) => c.id === `onb-${supplierId}`);
  const reviewStatus = myCase?.status;
  const reviewNote = myCase?.reviewNote;

  // Once procurement approves everything, the prospect signs the Principal's
  // contracts (main agreement + pricing catalogues) to activate as a supplier.
  const approved = reviewStatus === "Accepted";
  const [signedContracts, setSignedContracts] = useState<Set<string>>(new Set());
  const [activated, setActivated] = useState(false);
  const allContractsSigned = PRINCIPAL_CONTRACTS.every((c) => signedContracts.has(c.id));

  const [step, setStep] = useState<Step>("welcome");
  // Acceptance is read from the stored onboarding case, not local state: a
  // reload must not let an un-accepted prospect through, and an accepted one
  // must not be asked twice.
  const termsAccepted = Boolean(dbSupplier?.termsAcceptedAt);
  const [savingTerms, setSavingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  async function handleAcceptTerms(accepted: boolean) {
    // Consent is only ever given, never silently revoked from the UI.
    if (!accepted || termsAccepted || savingTerms) return;
    setSavingTerms(true);
    setTermsError(null);
    try {
      await acceptTerms(supplierId, TERMS_VERSION, invitedName || profile.fullName);
    } catch (e) {
      setTermsError(e instanceof Error ? e.message : "Could not record your acceptance.");
    } finally {
      setSavingTerms(false);
    }
  }

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

  // Whoever is filling this in — used as the actor on their own audit entries.
  const actingAs = invitedName || profile.fullName;

  /* ── Correcting the details of a document already on file ───────────────
     What the preview shows may have been read from the PDF rather than typed
     by anyone, so the edit form starts from exactly those values. */
  const [parsedByKey, setParsedByKey] = useState<Record<string, ParsedDocumentInfo | null>>({});
  const notedParsed = (key: string, info: ParsedDocumentInfo | null) =>
    setParsedByKey((prev) => (prev[key] === info ? prev : { ...prev, [key]: info }));

  const [editing, setEditing] = useState<
    { doc: SupplierDoc; prefill: DocumentMetadata; expiryHint?: string } | null
  >(null);
  const [savingMetadata, setSavingMetadata] = useState(false);

  function startEdit(key: string) {
    const def = STANDARD_DOCS.find((d) => d.key === key);
    const doc = def && statusByName.get(def.name);
    if (!def || !doc) return;
    const parsed = parsedByKey[key] ?? null;
    const guess = recogniseDocumentMetadata(def.name);
    // A date input needs yyyy-mm-dd; validity printed as a month and year names
    // no day, so it becomes a hint to confirm rather than a pre-filled value.
    const parsedExpiry = validityToISODate(parsed?.validity);
    // A stored date is free text ("31 Jan 2028") — back to ISO for the input.
    const storedExpiry = validityToISODate(doc.expiryDate);
    setError(null);
    setEditing({
      doc,
      prefill: {
        documentType: doc.documentType || parsed?.documentType || guess.documentType,
        issuingInstitution: doc.issuingInstitution || parsed?.issuingInstitution || guess.issuingInstitution,
        expiryDate: storedExpiry || parsedExpiry,
        doesNotExpire: doc.doesNotExpire || parsed?.doesNotExpire || false,
      },
      expiryHint: storedExpiry || parsedExpiry ? undefined : parsed?.validity,
    });
  }

  async function saveMetadata(metadata: DocumentMetadata) {
    if (!editing) return;
    setSavingMetadata(true);
    try {
      await updateDocMetadata(editing.doc.id, metadata, actingAs);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the document details.");
    } finally {
      setSavingMetadata(false);
    }
  }

  /* ── Deleting a document so it can be uploaded again ────────────────── */
  const [confirmDelete, setConfirmDelete] = useState<SupplierDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function deleteDoc() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const removed = confirmDelete;
      await removeSupplierDoc(removed.id, actingAs);
      // The gate below reads the shared data again, so the optimistic key for
      // this document has to go too — otherwise a deleted required document
      // would still count as uploaded.
      const def = STANDARD_DOCS.find((d) => d.name === removed.documentName);
      if (def) {
        setUploadedKeys((prev) => {
          const next = new Set(prev);
          next.delete(def.key);
          return next;
        });
      }
      setConfirmDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the document.");
    } finally {
      setDeleting(false);
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

  function signContract(c: PrincipalContract) {
    setSignedContracts((prev) => new Set(prev).add(c.id));
    toast({ title: `${c.name} signed`, tone: "success" });
  }

  function activateSupplier() {
    setActivated(true);
    toast({
      title: "You're now a supplier",
      description: `${prospectCompany} is active for ${PRINCIPAL}.`,
      tone: "success",
    });
  }

  const { t } = useI18n();

  // The approved (contracts) state has no `step`; drive the stepper from it.
  const showStepper = step !== "welcome" || approved;
  const stepperCurrent = approved ? (activated ? "Complete" : "Contracts") : STEP_LABEL[step];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-sidebar text-foreground">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center px-6 bg-background border-b border-border">
        <div className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center text-[11px] font-bold">
          L
        </div>
        <span className="ml-2 text-sm font-semibold">Lynk</span>
        <span className="ml-1.5 text-sm text-muted-foreground">· {t("Supplier Portal")}</span>
        <div className="flex-1" />
        <LanguageToggle />
        {onSwitchAccount && (
          <button
            onClick={onSwitchAccount}
            className="ml-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("Roles board")}
          </button>
        )}
      </header>

      {/* Stepper */}
      {showStepper && (
        <div className="shrink-0 bg-background border-b border-border py-3">
          <WizardStepper steps={STEPPER} current={stepperCurrent!} />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* The documents step needs the full width so the preview can show the
            page at 100% scale; the form/summary steps read better in a column. */}
        <div
          className={`mx-auto px-6 py-10 ${
            (step === "documents" && !pending && !editing) || (approved && !activated)
              ? "max-w-[1600px]"
              : "max-w-2xl"
          }`}
        >
          {approved ? (
            activated ? (
              <SupplierActivatedStep company={prospectCompany} />
            ) : (
              <ContractsStep
                signed={signedContracts}
                onSign={signContract}
                allSigned={allContractsSigned}
                onActivate={activateSupplier}
                signerName={invitedName || profile.fullName}
              />
            )
          ) : (
          <>
          {step === "welcome" && (
            <WelcomeStep
              firstName={firstName}
              prospectCompany={prospectCompany}
              termsAccepted={termsAccepted}
              onTermsChange={handleAcceptTerms}
              savingTerms={savingTerms}
              termsError={termsError}
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
              onBack={() => setStep("welcome")}
              approved={companyApprovedIds.has(supplierId)}
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

          {step === "documents" && !pending && editing && (
            <section className="space-y-5">
              <div>
                <h1 className="text-xl font-bold">Edit document details</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Correct what this document says. The uploaded file itself isn't changed
                  {editing.doc.status === "valid"
                    ? " — because procurement already approved these details, the document goes back for review."
                    : "."}
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Card className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:1.25rem] px-(--card-spacing)">
                <DocumentMetadataForm
                  mode="edit"
                  documentName={editing.doc.documentName}
                  initial={editing.prefill}
                  expiryHint={editing.expiryHint}
                  busy={savingMetadata}
                  onCancel={() => setEditing(null)}
                  onConfirm={saveMetadata}
                />
              </Card>
            </section>
          )}

          {step === "documents" && !pending && !editing && (
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
                onParsed={notedParsed}
                /* Editing the details and removing the document act on the
                   document itself, so they sit with it — not among the
                   workflow actions at the bottom. */
                renderHeaderActions={(r) => {
                  const def = STANDARD_DOCS.find((d) => d.name === r.name);
                  const live = statusByName.get(r.name);
                  if (!def || !r.status || !live) return null;
                  return (
                    <>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        title="Edit details"
                        aria-label={`Edit the details of ${r.name}`}
                        onClick={() => startEdit(def.key)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        title="Delete document"
                        aria-label={`Delete ${r.name}`}
                        onClick={() => setConfirmDelete(live)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  );
                }}
                renderActions={(r) => {
                  const def = STANDARD_DOCS.find((d) => d.name === r.name);
                  const declined = r.status === "rejected-resubmit";
                  const uploading = Boolean(def && uploadingKey === def.key);
                  if (!def) return null;
                  return (
                    <div className="flex items-center justify-end gap-2 min-w-0">
                      <p className="text-xs text-muted-foreground min-w-0 truncate mr-1">
                        {declined && r.statusNote ? `Declined — “${r.statusNote}”` : def.hint}
                      </p>
                      {/* Uploading a file again supersedes the stored one and sends
                          the new version back for review. */}
                      <Button
                        variant={!r.status || declined ? "dark" : "outline"}
                        size="sm"
                        className="shrink-0"
                        disabled={uploading}
                        onClick={() => docInputRef.current?.click()}
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {!r.status ? "Upload document" : declined ? "Replace document" : "Replace file"}
                      </Button>
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
              {!requiredStandardDone && (
                <p className="text-xs text-muted-foreground text-right">
                  Upload the required documents (Public Liability Insurance, Trade Licence) to continue.
                </p>
              )}
              <WizardFooter onBack={() => setStep("company")}>
                <Button variant="dark" disabled={!requiredStandardDone || submitting} onClick={submitForReview}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit for Review <ArrowRight className="w-4 h-4" />
                </Button>
              </WizardFooter>

              {/* Deleting is not undoable, so it's confirmed by name. */}
              <Dialog open={Boolean(confirmDelete)} onOpenChange={(o) => !o && !deleting && setConfirmDelete(null)}>
                <DialogContent showCloseButton={false} className="sm:max-w-[440px] rounded-2xl">
                  <DialogTitle className="text-base font-semibold">
                    Delete {confirmDelete?.documentName}?
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    The file and its details are removed from your submission. You can upload a new
                    version afterwards. This can't be undone.
                  </DialogDescription>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(null)}
                    >
                      Keep document
                    </Button>
                    <Button variant="danger" className="flex-1" disabled={deleting} onClick={deleteDoc}>
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </section>
          )}

          {step === "done" && <DoneStep />}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: Welcome ──────────────────────────────────────────────────── */
function WelcomeStep({
  firstName,
  prospectCompany,
  termsAccepted,
  onTermsChange,
  savingTerms,
  termsError,
  onNext,
  reviewStatus,
  reviewNote,
}: {
  firstName: string;
  /** The invited supplier's own company — from the invitation, not hard-coded. */
  prospectCompany: string;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  savingTerms?: boolean;
  termsError?: string | null;
  onNext: () => void;
  reviewStatus?: string;
  reviewNote?: string;
}) {
  const { t, lang } = useI18n();
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

      {/* Consent gate: nothing is entered until the terms are accepted. */}
      <Card className="rounded-2xl border border-border ring-0 shadow-none text-left mt-6 [--card-spacing:1.25rem] px-(--card-spacing)">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">{t("Terms & Conditions")}</h2>
            {lang !== "en" && <MachineTranslatedTag />}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            Version {TERMS_VERSION} · {TERMS_EFFECTIVE_DATE}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t("Please read these before entering your company data.")}
        </p>

        {/* The terms themselves, readable without leaving the page. */}
        <div
          className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-3 space-y-3"
          tabIndex={0}
          aria-label="Terms and Conditions"
        >
          {TERMS_SECTIONS.map((sec) => (
            <div key={sec.heading}>
              <p className="text-xs font-semibold">{translateContent(sec.heading, "en", lang).text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{translateContent(sec.body, "en", lang).text}</p>
            </div>
          ))}
        </div>

        <label className="mt-3 flex items-start gap-2.5 cursor-pointer">
          <Checkbox
            checked={termsAccepted}
            disabled={termsAccepted || savingTerms}
            onCheckedChange={(c) => onTermsChange(c === true)}
            className="mt-0.5"
            aria-describedby="terms-hint"
          />
          <span className="text-sm">
            I have read and agree to the Terms &amp; Conditions and the{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-accent underline underline-offset-2"
            >
              Privacy Policy
            </a>
            , and I am authorised to accept them for {prospectCompany}.
          </span>
        </label>

        {savingTerms && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Recording your acceptance…
          </p>
        )}
        {termsError && <p className="text-xs text-destructive mt-2">{termsError}</p>}
        {termsAccepted && (
          <p className="text-xs text-success-ink mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" /> Accepted — version {TERMS_VERSION}
          </p>
        )}
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-accent/5 p-3 text-left">
        <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          This link is private and expires in 72 hours. Your data is protected under GDPR. Only authorised
          procurement staff at {PRINCIPAL} can access your profile.
        </p>
      </div>

      {!rejected && (
        <>
          <Button variant="dark" className="w-full mt-6" disabled={!termsAccepted} onClick={onNext}>
            {changesRequested ? "Update & Resubmit My Details" : "Review & Confirm My Details"}{" "}
            <ArrowRight className="w-4 h-4" />
          </Button>
          {!termsAccepted && (
            <p id="terms-hint" className="text-xs text-muted-foreground mt-2">
              Accept the Terms &amp; Conditions to continue.
            </p>
          )}
        </>
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
  onBack,
  approved = false,
}: {
  form: Form;
  setField: (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  onSubmit: () => void;
  onBack: () => void;
  /** PM has approved this section — shown as a marker; fields become read-only. */
  approved?: boolean;
}) {
  return (
    <section className="space-y-6">
      {approved && (
        <div className="flex items-start gap-2.5 rounded-lg bg-success-soft p-3">
          <CheckCircle2 className="w-4 h-4 text-success-ink shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-success-ink">Approved by procurement</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {PRINCIPAL} has verified your company details — no changes needed here.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-primary" />
        <h1 className="text-base font-semibold">Company Details</h1>
        {approved && (
          <Badge variant="success-outline" className="ml-auto">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </Badge>
        )}
      </div>
      <div className="space-y-4">
        <FormField label="Legal Name" value={form.legalName} onChange={setField("legalName")} readOnly={approved} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="VAT ID" value={form.vatId} onChange={setField("vatId")} readOnly={approved} />
          <FormField label="Registration No." value={form.registrationNo} onChange={setField("registrationNo")} readOnly={approved} />
        </div>
        <FormField label="Website" value={form.website} onChange={setField("website")} readOnly={approved} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <MapPin className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold">Registered Address</h2>
      </div>
      <div className="space-y-4">
        <FormField label="Street" value={form.street} onChange={setField("street")} readOnly={approved} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" value={form.city} onChange={setField("city")} readOnly={approved} />
          <FormField label="Postcode" value={form.postcode} onChange={setField("postcode")} readOnly={approved} />
        </div>
        <FormField label="Country" value={form.country} onChange={setField("country")} readOnly={approved} />
      </div>

      <WizardFooter onBack={onBack}>
        <Button variant="dark" disabled={saving} onClick={onSubmit}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {approved ? "Continue" : "Submit My Details"} <ArrowRight className="w-4 h-4" />
        </Button>
      </WizardFooter>
    </section>
  );
}

function FormField({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={cn(
          "h-10 rounded-lg border-border bg-background",
          readOnly && "bg-muted/40 text-muted-foreground cursor-default focus-visible:ring-0"
        )}
      />
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
            `If approved, ${PRINCIPAL} will send you the main contract and pricing catalogues to review and sign`,
            "Signing the contracts activates your supplier account",
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

/* ── Post-approval: review & sign the Principal's contracts ──────────────── */
function ContractsStep({
  signed,
  onSign,
  allSigned,
  onActivate,
  signerName,
}: {
  signed: Set<string>;
  onSign: (c: PrincipalContract) => void;
  allSigned: boolean;
  onActivate: () => void;
  signerName: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(PRINCIPAL_CONTRACTS[0].id);
  const [agreed, setAgreed] = useState(false);
  const selected = PRINCIPAL_CONTRACTS.find((c) => c.id === selectedId) ?? PRINCIPAL_CONTRACTS[0];
  const isSelectedSigned = signed.has(selected.id);
  const signedCount = PRINCIPAL_CONTRACTS.filter((c) => signed.has(c.id)).length;
  const SelectedIcon = selected.kind === "catalogue" ? ClipboardList : FileSignature;

  function select(id: string) {
    setSelectedId(id);
    setAgreed(false);
  }
  function sign() {
    onSign(selected);
    setAgreed(false);
    // Advance to the next still-unsigned contract to keep the flow moving.
    const next = PRINCIPAL_CONTRACTS.find((c) => c.id !== selected.id && !signed.has(c.id));
    if (next) setSelectedId(next.id);
  }
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-lg bg-success-soft p-3">
        <CheckCircle2 className="w-4 h-4 text-success-ink shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-success-ink">Approved by procurement</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {PRINCIPAL} has verified your details and documents.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold">Review &amp; sign your contracts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {PRINCIPAL} has sent the documents below — the main agreement and the price catalogues that apply to
          your work orders. Review each carefully and sign all of them to activate your supplier account.
        </p>
      </div>

      {/* Two-pane: documents to sign on the left, the selected one previewed big on the right. */}
      <div className="flex gap-4 items-stretch min-h-[62vh]">
        {/* Left — list of documents to sign */}
        <div className="w-[300px] shrink-0 flex flex-col">
          <div className="space-y-2">
            {PRINCIPAL_CONTRACTS.map((c) => {
              const RowIcon = c.kind === "catalogue" ? ClipboardList : FileSignature;
              const rowSigned = signed.has(c.id);
              const active = c.id === selected.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c.id)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 rounded-xl border p-3 transition-colors",
                    active ? "border-primary bg-secondary/50" : "border-border hover:bg-secondary/40"
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary">
                    <RowIcon className="w-4 h-4 text-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.kind === "catalogue" ? "Pricing catalogue" : "Contract"}
                    </span>
                  </span>
                  {rowSigned ? (
                    <CheckCircle2 className="w-4 h-4 text-success-ink shrink-0 mt-0.5" aria-label="Signed" />
                  ) : (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-warning shrink-0" aria-label="Awaiting signature" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            {signedCount} of {PRINCIPAL_CONTRACTS.length} signed
          </p>
        </div>

        {/* Right — big preview + inline sign */}
        <div className="flex-1 min-w-0 border border-border rounded-2xl overflow-hidden flex flex-col bg-card">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
            <SelectedIcon className="w-4 h-4 text-medium-ink shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{selected.name}</div>
              <div className="text-xs text-muted-foreground truncate">{selected.meta}</div>
            </div>
            {isSelectedSigned && (
              <Badge variant="success-outline" className="shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Signed
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-secondary/40 p-6">
            <ContractPreview contract={selected} />
          </div>

          <div className="border-t border-border px-4 py-4 shrink-0">
            {isSelectedSigned ? (
              <div className="flex items-center gap-2 text-sm font-medium text-success-ink">
                <CheckCircle2 className="w-4 h-4" />
                Signed by {signerName}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                  <span className="text-sm">
                    I have read and agree to this {selected.kind === "catalogue" ? "pricing catalogue" : "agreement"},
                    and I am authorised to sign on behalf of my company.
                  </span>
                </label>
                <div className="flex justify-end">
                  <Button variant="dark" disabled={!agreed} onClick={sign}>
                    <PenLine className="w-4 h-4" />
                    Sign as {signerName}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <WizardFooter>
        <Button variant="dark" disabled={!allSigned} onClick={onActivate}>
          Activate supplier account <ArrowRight className="w-4 h-4" />
        </Button>
      </WizardFooter>
    </section>
  );
}

function SupplierActivatedStep({ company }: { company: string }) {
  return (
    <section className="text-center pt-6">
      <div className="w-12 h-12 rounded-full bg-success-soft mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-success" />
      </div>
      <h1 className="text-2xl font-bold mt-4">You're now a supplier 🎉</h1>
      <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
        Contracts signed. {company} is active for {PRINCIPAL} and can now receive work orders. Manage your
        documents, contracts and details anytime from your supplier portal.
      </p>
    </section>
  );
}

// Faux paper document shown big in the Contracts pane — a stand-in for the real
// PDF the Principal would send.
function ContractPreview({ contract }: { contract: PrincipalContract }) {
  const isCatalogue = contract.kind === "catalogue";
  return (
    <div className="mx-auto w-full max-w-[620px] bg-white text-slate-900 shadow-md rounded-sm p-10">
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">{PRINCIPAL}</div>
          <div className="text-[11px] text-slate-500">Procurement</div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
          {isCatalogue ? "Price List" : "Agreement"}
        </div>
      </div>

      <div className="mt-7 text-xl font-bold leading-tight">{contract.name}</div>
      <div className="text-xs text-slate-500 mt-1">{contract.meta}</div>
      <p className="text-sm text-slate-600 mt-4 leading-relaxed">{contract.summary}</p>

      <div className="mt-6 space-y-2.5">
        {[100, 94, 97, 88, 72, 96, 80].map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-slate-100" style={{ width: `${w}%` }} />
        ))}
      </div>

      {isCatalogue && (
        <div className="mt-6 border border-slate-200 rounded overflow-hidden text-xs">
          <div className="grid grid-cols-[1fr_auto] gap-4 bg-slate-50 font-semibold text-slate-600 px-3 py-2">
            <span>Service</span>
            <span>Rate (applied to work orders)</span>
          </div>
          {[
            ["Standard call-out", "€ 85 / h"],
            ["Materials handling", "€ 40 / h"],
            ["Emergency response", "€ 120 / h"],
            ["Weekend surcharge", "+ 25 %"],
          ].map(([service, rate]) => (
            <div key={service} className="grid grid-cols-[1fr_auto] gap-4 px-3 py-2 border-t border-slate-100">
              <span className="text-slate-700">{service}</span>
              <span className="text-slate-700 font-medium">{rate}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-dashed border-slate-200 pt-5 flex items-end justify-between">
        <div>
          <div className="h-px w-36 bg-slate-300" />
          <div className="text-[11px] text-slate-500 mt-1">Supplier signature</div>
        </div>
        <div className="text-[10px] text-slate-400 max-w-[45%] text-right">
          Mock document — for UI/UX prototype only
        </div>
      </div>
    </div>
  );
}
