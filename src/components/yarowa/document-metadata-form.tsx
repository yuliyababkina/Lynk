import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DOCUMENT_TYPE_OPTIONS, type DocumentMetadata } from "@/lib/onboarding-documents";

/*
 * Shown right after a file is picked: the app pre-fills what it recognised from
 * the document, and the uploader must review/correct the values before the file
 * is saved. Nothing is stored until "Confirm & upload" — so every document
 * carries human-verified metadata.
 */
export function DocumentMetadataForm({
  fileName,
  documentName,
  initial,
  busy,
  onCancel,
  onConfirm,
}: {
  fileName: string;
  documentName: string;
  initial: DocumentMetadata;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (metadata: DocumentMetadata) => void;
}) {
  const [meta, setMeta] = useState<DocumentMetadata>(initial);
  const set = <K extends keyof DocumentMetadata>(k: K, v: DocumentMetadata[K]) =>
    setMeta((m) => ({ ...m, [k]: v }));

  // An expiring document needs a date; a non-expiring one doesn't.
  const valid =
    meta.documentType.trim() !== "" &&
    meta.issuingInstitution.trim() !== "" &&
    (meta.doesNotExpire || meta.expiryDate.trim() !== "");

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
        <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-medium text-foreground">We pre-filled these details from your document</p>
          <p className="text-muted-foreground mt-0.5">
            Please check each field and correct anything that's wrong before confirming.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">File</Label>
        <p className="text-sm font-medium truncate">{fileName}</p>
        <p className="text-xs text-muted-foreground">Uploading as: {documentName}</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="doc-type" className="text-xs text-muted-foreground">
          Document type
        </Label>
        <select
          id="doc-type"
          value={meta.documentType}
          onChange={(e) => set("documentType", e.target.value)}
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a type…</option>
          {DOCUMENT_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="doc-issuer" className="text-xs text-muted-foreground">
          Issuing institution
        </Label>
        <Input
          id="doc-issuer"
          value={meta.issuingInstitution}
          onChange={(e) => set("issuingInstitution", e.target.value)}
          placeholder="e.g. TÜV Süd, Chamber of Commerce, Allianz"
          className="h-10 rounded-lg border-border bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-expiry" className="text-xs text-muted-foreground">
          Expiry date
        </Label>
        <Input
          id="doc-expiry"
          type="date"
          value={meta.expiryDate}
          disabled={meta.doesNotExpire}
          onChange={(e) => set("expiryDate", e.target.value)}
          className="h-10 rounded-lg border-border bg-background disabled:opacity-50"
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={meta.doesNotExpire}
            onCheckedChange={(c) => {
              const on = c === true;
              set("doesNotExpire", on);
              if (on) set("expiryDate", "");
            }}
          />
          This certificate does not expire
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="dark" className="flex-1" disabled={busy || !valid} onClick={() => onConfirm(meta)}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Confirm &amp; upload
        </Button>
      </div>
      {!valid && (
        <p className="text-xs text-muted-foreground text-center">
          Fill in the type, issuer, and either an expiry date or "does not expire".
        </p>
      )}
    </div>
  );
}
