import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PencilLine, Upload, Send, CircleCheck, Loader2, FileText, Lock, Trash2, Repeat, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailDrawer } from "@/components/yarowa/detail-drawer";
import { DocumentMetadataForm } from "@/components/yarowa/document-metadata-form";
import { CompactDropzone } from "@/components/yarowa/compact-dropzone";
import { FilePreviewLightbox } from "@/components/yarowa/file-preview-lightbox";
import { MockDocumentPage } from "@/components/yarowa/mock-document-page";
import { PdfCanvas } from "@/components/yarowa/pdf-canvas";
import { toast } from "@/components/yarowa/toast";
import { useLynkData } from "@/lib/LynkDataContext";
import { useDocumentUpload, formatFileSize } from "@/lib/use-document-upload";
import { docStatusMeta } from "@/lib/document-status";
import { cn } from "@/lib/utils";
import {
  primaryActionLabel,
  secondaryActions,
  type ActivityItem,
  type CompanyDetails,
  type PortalFieldKey,
  type Tone,
} from "@/pages/portal/portal-data";
import { PORTAL_FIELDS, fieldError, hasSensitiveField } from "@/pages/portal/portal-fields";
import type { DocumentMetadata } from "@/lib/onboarding-documents";
import type { ChatContext } from "@/types";

export interface PortalActivitySelection {
  /** The ticket being fixed; absent when opened from a quick-action card. */
  item?: ActivityItem;
  sectionLabel: string;
  tone: Tone;
  /** Quick-action entry point — the panel opens empty, with nothing preselected. */
  quick?: "upload" | "data";
}

/** Where a finished item belongs afterwards. */
export type ActivityOutcome = "pending-approval" | "resolved";

/** One field of a submitted change request, kept so it can be reviewed later. */
export interface ChangeRecord {
  key: string;
  label: string;
  before: string;
  after: string;
}

const ACTION_ICON: Record<string, typeof PencilLine> = {
  Update: PencilLine,
  Upload: Upload,
  Chat: Send,
  Remind: Send,
  Review: CircleCheck,
};

function secondaryVariant(label: string): "secondary" | "outline" {
  return label === "Chat" ? "secondary" : "outline";
}

/* ── The document a ticket is about, as it stands today ───────────────────── */

function CurrentFile({ supplierId, docName }: { supplierId: string; docName: string }) {
  const { docs } = useLynkData();
  const doc = docs.find((d) => d.supplierId === supplierId && d.documentName === docName);

  if (!doc) {
    return (
      <div className="rounded-lg border border-border bg-background p-3 mb-3">
        <div className="text-xs text-muted-foreground mb-1">CURRENT FILE</div>
        <p className="text-sm font-medium">{docName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Not uploaded yet</p>
      </div>
    );
  }

  const meta = docStatusMeta(doc.status);
  // The badge says how long is left rather than repeating the status word — the
  // supplier already knows it needs attention, not when.
  const expiry =
    doc.daysUntilExpiry < 0
      ? `Expired ${Math.abs(doc.daysUntilExpiry)} days ago`
      : doc.daysUntilExpiry === 0
        ? "Expires today"
        : `Expiring in ${doc.daysUntilExpiry} days`;

  return (
    <div className="rounded-lg border border-border bg-background p-3 mb-3">
      <div className="text-xs text-muted-foreground mb-1">CURRENT FILE</div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{doc.documentName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doc.documentCategory} · {doc.expiryDate}
          </p>
        </div>
        <Badge variant={meta.variant as never} className="shrink-0">
          <meta.Icon className="w-3 h-3" />
          {expiry}
        </Badge>
      </div>
    </div>
  );
}


/*
 * One thumbnail for every document in the panel, whatever it is behind the
 * glass: a real PDF, a stand-in page, or a file picked a second ago. Documents
 * are portrait, so the frame is A4-proportioned and the page fills its width —
 * a landscape strip showed a sliver of the top edge and read as broken.
 */
const THUMB_FRAME =
  "mx-auto block w-[136px] aspect-[1/1.414] rounded-md overflow-hidden border border-border bg-white hover:border-accent transition-colors";

function DocumentThumbnail({
  fileUrl,
  mock,
  label,
  onClick,
}: {
  fileUrl?: string;
  mock?: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} aria-label={`Preview ${label} full size`} className={THUMB_FRAME}>
      {fileUrl ? (
        /* PdfCanvas sizes its canvas to the PDF's own page width and scrolls;
           inside the frame it has to fit instead. */
        <PdfCanvas
          fileUrl={fileUrl}
          className="h-full p-0! overflow-hidden pointer-events-none [&_canvas]:w-full! [&_canvas]:h-auto! [&_canvas]:shadow-none"
        />
      ) : (
        <div className="origin-top-left scale-[0.22] w-[455%] pointer-events-none">{mock}</div>
      )}
    </button>
  );
}

/* ── What was already submitted, for an item nobody can act on any more ───── */

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-words">{value}</span>
    </div>
  );
}

/**
 * The file sitting with the principal, shown read-only: the page itself, the
 * metadata the supplier confirmed when they sent it, and when that happened.
 * Without this, "Pending Approval" is a dead end — the supplier can see that
 * something is being reviewed but not what.
 */
function SubmittedDocument({ supplierId, docName }: { supplierId: string; docName: string }) {
  const { docs } = useLynkData();
  const [zoomed, setZoomed] = useState(false);
  const doc = docs.find((d) => d.supplierId === supplierId && d.documentName === docName);

  if (!doc) {
    return (
      <>
        {/* Same card as a document that is on file, so the two don't read as
            different features — only the badge and the note differ. */}
        <div className="rounded-lg border border-border bg-background p-3 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-xs text-muted-foreground">SUBMITTED FOR REVIEW</div>
            <Badge variant="neutral" className="shrink-0">
              <FileText className="w-3 h-3" />
              Not on file
            </Badge>
          </div>

          <div className="mb-3">
            <DocumentThumbnail
              label={docName}
              mock={<MockDocumentPage documentName={docName} />}
              onClick={() => setZoomed(true)}
            />
          </div>

          <div className="space-y-1.5">
            <MetaRow label="Document" value={docName} />
          </div>

          <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
            Stand-in page — this document isn't in the document store yet, so there is no file to render.
          </p>

          <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setZoomed(true)}>
            <Eye className="w-3.5 h-3.5" /> View full size
          </Button>
        </div>
        {zoomed && (
          <FilePreviewLightbox fileName={docName} onClose={() => setZoomed(false)}>
            <MockDocumentPage documentName={docName} />
          </FilePreviewLightbox>
        )}
      </>
    );
  }

  const meta = docStatusMeta(doc.status);
  // History dates arrive either as a plain label from the seed data or as an ISO
  // timestamp from a real upload — only the second needs formatting.
  const raw = doc.history?.[doc.history.length - 1]?.date;
  const parsed = raw ? Date.parse(raw) : NaN;
  const submitted = Number.isNaN(parsed)
    ? raw
    : new Date(parsed).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <div className="rounded-lg border border-border bg-background p-3 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs text-muted-foreground">SUBMITTED FOR REVIEW</div>
          <Badge variant={meta.variant as never} className="shrink-0">
            <meta.Icon className="w-3 h-3" />
            {meta.label}
          </Badge>
        </div>

        {/* Seeded demo documents carry metadata but no PDF — the stand-in page
            keeps every item in Pending and Resolved reviewable. */}
        <div className="mb-3">
          <DocumentThumbnail
            label={doc.documentName}
            fileUrl={doc.fileUrl}
            mock={
              <MockDocumentPage
                documentName={doc.documentName}
                category={doc.documentCategory}
                documentType={doc.documentType}
                issuingInstitution={doc.issuingInstitution}
                expiry={doc.doesNotExpire ? "No expiry" : doc.expiryDate}
              />
            }
            onClick={() => setZoomed(true)}
          />
        </div>

        <div className="space-y-1.5">
          <MetaRow label="Document" value={doc.documentName} />
          <MetaRow label="Type" value={doc.documentType} />
          <MetaRow label="Issued by" value={doc.issuingInstitution} />
          <MetaRow label="Expiry" value={doc.doesNotExpire ? "Does not expire" : doc.expiryDate} />
          <MetaRow label="Submitted" value={submitted} />
        </div>

        {doc.statusNote && (
          <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{doc.statusNote}</p>
        )}

        <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setZoomed(true)}>
          <Eye className="w-3.5 h-3.5" /> View full size
        </Button>
      </div>
      {zoomed && (
        <FilePreviewLightbox
          fileUrl={doc.fileUrl}
          fileName={doc.documentName}
          onClose={() => setZoomed(false)}
        >
          <MockDocumentPage
            documentName={doc.documentName}
            category={doc.documentCategory}
            documentType={doc.documentType}
            issuingInstitution={doc.issuingInstitution}
            expiry={doc.doesNotExpire ? "No expiry" : doc.expiryDate}
          />
        </FilePreviewLightbox>
      )}
    </>
  );
}

/** An edit the supplier made, as before → after. */
function SubmittedChanges({ changes, pending }: { changes: ChangeRecord[]; pending: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 mb-4">
      <div className="text-xs text-muted-foreground mb-2">
        {pending ? "SUBMITTED FOR APPROVAL" : "WHAT YOU CHANGED"}
      </div>
      <div className="space-y-2.5">
        {changes.map((c) => (
          <div key={c.key}>
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="text-xs line-through text-muted-foreground break-words">{c.before || "—"}</div>
            <div className="text-sm font-medium break-words">{c.after}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
        {pending
          ? "Your current details stay active until this is endorsed."
          : "Applied to your profile and shared with your principals."}
      </p>
    </div>
  );
}

/* ── Picked-but-not-yet-saved file ────────────────────────────────────────── */

function PickedFile({
  fileName,
  fileSize,
  previewUrl,
  disabled,
  onReplace,
  onRemove,
}: {
  fileName: string;
  fileSize: string;
  previewUrl: string;
  disabled?: boolean;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <div className="rounded-lg border border-border bg-background p-3 mb-3">
        <div className="mb-2">
          <DocumentThumbnail label={fileName} fileUrl={previewUrl} onClick={() => setZoomed(true)} />
        </div>
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">{fileSize}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" className="flex-1" disabled={disabled} onClick={onReplace}>
            <Repeat className="w-3.5 h-3.5" /> Replace
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled={disabled} onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
        </div>
      </div>
      {zoomed && (
        <FilePreviewLightbox
          fileUrl={previewUrl}
          fileName={fileName}
          fileSize={fileSize}
          onClose={() => setZoomed(false)}
        />
      )}
    </>
  );
}

/* ── Editable profile fields ──────────────────────────────────────────────── */

function FieldRow({
  fieldKey,
  value,
  error,
  onChange,
}: {
  fieldKey: PortalFieldKey;
  value: string;
  error?: string | null;
  onChange: (v: string) => void;
}) {
  const spec = PORTAL_FIELDS[fieldKey];
  return (
    <div className="space-y-1">
      <Label htmlFor={`f-${fieldKey}`} className="text-xs text-muted-foreground flex items-center gap-1">
        {spec.label}
        {/* The lock stays on while the field is editable: the supplier can type a
            new value, but it only takes effect once a principal endorses it. */}
        {spec.sensitive && <Lock className="w-3 h-3" />}
      </Label>
      <Input
        id={`f-${fieldKey}`}
        type={spec.type ?? "text"}
        value={value}
        placeholder={spec.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 rounded-lg border-border bg-background",
          spec.mono && "font-mono",
          error && "border-destructive"
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ── Panel ────────────────────────────────────────────────────────────────── */

export function PortalActivityDrawer({
  selection,
  supplierId,
  supplierName,
  company,
  onClose,
  onCompanyChange,
  onItemDone,
  changeRequests,
  onOpenChat,
}: {
  selection: PortalActivitySelection;
  supplierId: string;
  supplierName: string;
  company: CompanyDetails;
  onClose: () => void;
  onCompanyChange: (next: CompanyDetails) => void;
  onItemDone: (itemId: string, outcome: ActivityOutcome, changes?: ChangeRecord[]) => void;
  /** Change requests already submitted, keyed by item id. */
  changeRequests?: Record<string, ChangeRecord[]>;
  /** Opens the principal's conversation with this ticket already attached. */
  onOpenChat?: (draft: string, context?: ChatContext) => void;
}) {
  const { item, sectionLabel, tone, quick } = selection;

  // A quick-action card opens the same panel with nothing preselected, so the
  // supplier never meets a second, differently-shaped upload screen.
  const kind = item?.kind ?? (quick === "data" ? "data" : "document");
  const primary = item ? primaryActionLabel(item) : kind === "data" ? "Update" : "Upload";
  const editable = primary !== null;

  const upload = useDocumentUpload(supplierId, supplierName);

  /* A ticket names the fields it is about. The quick-action card names none, so
     it opens on the payment block — the change a supplier actually comes here to
     make, and the one that has to go through endorsement. */
  const fieldKeys = useMemo<PortalFieldKey[]>(
    () => item?.fields ?? (quick === "data" ? ["iban", "bankName", "bic"] : []),
    [item, quick]
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fieldKeys.map((k) => [k, PORTAL_FIELDS[k].read(company)]))
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const submittedChanges = item ? (changeRequests?.[item.id] ?? item.submitted) : undefined;
  const sensitive = hasSensitiveField(fieldKeys);
  const changedKeys = fieldKeys.filter((k) => values[k] !== PORTAL_FIELDS[k].read(company));
  const errors = Object.fromEntries(
    fieldKeys.map((k) => [k, touched[k] ? fieldError(k, values[k] ?? "") : null])
  );
  const allValid = fieldKeys.every((k) => fieldError(k, values[k] ?? "") === null);

  const dirty = Boolean(upload.pending) || changedKeys.length > 0;

  // Esc closes, and goes through the same unsaved-changes check as the X.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // A lightbox opened from inside the panel sits above it and owns Escape —
      // otherwise one press closes the preview and the panel underneath it.
      if (document.querySelector('[role="dialog"]')) return;
      if (dirty) setConfirmingClose(true);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, onClose]);

  function attemptClose() {
    if (dirty) setConfirmingClose(true);
    else onClose();
  }

  async function submitDocument(metadata: DocumentMetadata) {
    const ok = await upload.confirm(metadata, item?.docName);
    if (!ok) return;
    if (item) onItemDone(item.id, "pending-approval");
    toast({
      title: "Document submitted",
      description: `${item?.docName ?? upload.pending?.name ?? "Your document"} is now awaiting review.`,
      tone: "success",
    });
    onClose();
  }

  function submitFields() {
    setSaving(true);
    if (sensitive) {
      /* A change request records the before/after and waits for endorsement.
         The stored record is deliberately NOT written here — until a principal
         endorses it, the old payment details are the ones that count. */
      const record = changedKeys.map((k) => ({
        key: k,
        label: PORTAL_FIELDS[k].label,
        before: PORTAL_FIELDS[k].read(company),
        after: values[k].trim(),
      }));
      if (item) onItemDone(item.id, "pending-approval", record);
      toast({
        title: "Submitted for approval",
        description: `${changedKeys.length} change${changedKeys.length === 1 ? "" : "s"} sent for endorsement.`,
        tone: "success",
      });
    } else {
      let next = company;
      const record = changedKeys.map((k) => ({
        key: k,
        label: PORTAL_FIELDS[k].label,
        before: PORTAL_FIELDS[k].read(company),
        after: values[k].trim(),
      }));
      for (const k of changedKeys) next = PORTAL_FIELDS[k].write(next, values[k].trim());
      onCompanyChange(next);
      if (item) onItemDone(item.id, "resolved", record);
      toast({ title: "Changes saved", description: "Your profile is up to date.", tone: "success" });
    }
    setSaving(false);
    onClose();
  }

  const canSubmitDocument = Boolean(upload.pending);
  const canSubmitFields = changedKeys.length > 0 && allValid;

  return (
    <DetailDrawer
      onClose={attemptClose}
      header={<Badge variant={tone as never}>{sectionLabel}</Badge>}
    >
      <h3 className="font-semibold text-base mb-1">
        {item?.title ?? (kind === "data" ? "Request a data change" : "Upload a document")}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {item?.detail ?? (kind === "data" ? "Correct your company profile" : "Add or renew a compliance file")}
      </p>

      {item && (
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div>
            <div className="text-muted-foreground mb-0.5">PRINCIPAL</div>
            <div className="font-medium">{item.principal}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">UPDATED</div>
            <div className="font-medium">{item.ageLabel}</div>
          </div>
        </div>
      )}

      {/* Document and mixed items: what is on file, then the replacement */}
      {editable && kind !== "data" && (
        <>
          {item?.docName && <CurrentFile supplierId={supplierId} docName={item.docName} />}

          {upload.pending ? (
            <PickedFile
              fileName={upload.pending.file.name}
              fileSize={formatFileSize(upload.pending.file.size)}
              previewUrl={upload.pending.previewUrl}
              disabled={upload.uploading}
              onReplace={upload.clear}
              onRemove={upload.clear}
            />
          ) : (
            <CompactDropzone onFile={upload.selectFile} disabled={upload.uploading} />
          )}

          {upload.error && <p className="text-xs text-destructive mt-2">{upload.error}</p>}

          {upload.pending && (
            <div className="mt-3">
              <DocumentMetadataForm
                fileName={upload.pending.file.name}
                documentName={item?.docName ?? upload.pending.name}
                initial={upload.pending.prefill}
                busy={upload.uploading}
                onCancel={upload.clear}
                onConfirm={submitDocument}
              />
            </div>
          )}
        </>
      )}

      {/* Mixed items carry the related profile field under the file */}
      {editable && kind === "mixed" && fieldKeys.length > 0 && (
        <div className="space-y-3 mt-4 pt-4 border-t border-border">
          {fieldKeys.map((k) => (
            <FieldRow
              key={k}
              fieldKey={k}
              value={values[k] ?? ""}
              error={errors[k]}
              onChange={(v) => {
                setValues((prev) => ({ ...prev, [k]: v }));
                setTouched((prev) => ({ ...prev, [k]: true }));
              }}
            />
          ))}
          <p className="text-xs text-muted-foreground">Saved together with the file.</p>
        </div>
      )}

      {/* Data items: just the fields the ticket is about */}
      {editable && kind === "data" && (
        <div className="space-y-3">
          {fieldKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Open the field you want to change from Company details.
            </p>
          ) : (
            fieldKeys.map((k) => (
              <FieldRow
                key={k}
                fieldKey={k}
                value={values[k] ?? ""}
                error={errors[k]}
                onChange={(v) => {
                  setValues((prev) => ({ ...prev, [k]: v }));
                  setTouched((prev) => ({ ...prev, [k]: true }));
                }}
              />
            ))
          )}
          {sensitive && fieldKeys.length > 0 && (
            <p className="text-xs text-muted-foreground">
              These fields decide where payments go, so a principal has to endorse the change before it
              takes effect. Your current details stay active meanwhile.
            </p>
          )}
          {fieldKeys.length > 0 && (
            <Button
              variant="dark"
              className="w-full"
              disabled={!canSubmitFields || saving}
              onClick={submitFields}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {sensitive ? "Submit for approval" : "Save changes"}
            </Button>
          )}
        </div>
      )}

      {/* Nothing left to fix — so the panel reviews what was submitted instead */}
      {!editable && (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {sectionLabel === "Pending Approval"
              ? "Waiting on your principal. Here is exactly what they received."
              : "Closed — kept here so you can see what was submitted."}
          </p>
          {submittedChanges ? (
            <SubmittedChanges changes={submittedChanges} pending={sectionLabel === "Pending Approval"} />
          ) : item?.docName ? (
            <SubmittedDocument supplierId={supplierId} docName={item.docName} />
          ) : (
            <p className="text-xs text-muted-foreground mb-4">Nothing recorded for this item.</p>
          )}
        </>
      )}

      {item && secondaryActions(item).length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {secondaryActions(item).map((a) => {
            const Icon = ACTION_ICON[a];
            return (
              <Button
                key={a}
                variant={secondaryVariant(a)}
                className="w-full"
                onClick={
                  a === "Chat"
                    ? () =>
                        /* The ticket travels into the composer as a link, so the
                           supplier doesn't have to re-type what it is about. */
                        onOpenChat?.(
                          "",
                          item.docName
                            ? { type: "document", id: item.docName, label: item.docName }
                            : { type: "data-change", id: item.id, label: item.title }
                        )
                    : undefined
                }
              >
                {Icon && <Icon size={14} />}
                {a}
              </Button>
            );
          })}
        </div>
      )}

      {confirmingClose && (
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-sm font-medium">Discard your changes?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {upload.pending ? "The file you picked hasn't been submitted." : "Your edits haven't been saved."}
          </p>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmingClose(false)}>
              Keep editing
            </Button>
            <Button variant="danger" size="sm" className="flex-1" onClick={onClose}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Document submit lives inside the metadata form; this says why it's absent */}
      {editable && kind !== "data" && !canSubmitDocument && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Choose a file to continue.
        </p>
      )}
    </DetailDrawer>
  );
}
