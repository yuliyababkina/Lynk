import { useRef, useState } from "react";
import { FileText, Upload, Loader2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { DocumentMetadataForm } from "@/components/yarowa/document-metadata-form";
import { DocumentBrowser } from "@/components/yarowa/document-browser";
import { useLynkData } from "@/lib/LynkDataContext";
import { recogniseDocumentMetadata, type DocumentMetadata } from "@/lib/onboarding-documents";
import { docStatusMeta } from "@/lib/document-status";
import { getPortalProfile } from "./portal-data";

export interface PortalDocumentsProps {
  supplierId: string;
}

export function PortalDocuments({ supplierId }: PortalDocumentsProps) {
  const { docs: allDocs, addSupplierDoc } = useLynkData();
  const profile = getPortalProfile(supplierId);
  const supplierName = profile.company.legalName;
  const activeUpdate = profile.requestedUpdates[0];

  const docs = allDocs.filter((d) => d.supplierId === supplierId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Picked file waits for the uploader to confirm the recognised metadata.
  const [pending, setPending] = useState<{ file: File; name: string; prefill: DocumentMetadata } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    const name = file.name.replace(/\.pdf$/i, "");
    setPending({ file, name, prefill: recogniseDocumentMetadata(name) });
  }

  async function confirmUpload(metadata: DocumentMetadata) {
    if (!pending) return;
    setUploading(true);
    try {
      await addSupplierDoc(pending.file, supplierId, supplierName, undefined, pending.name, metadata);
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* All documents */}
      <section className="flex-1 min-w-0 p-6 space-y-3 bg-sidebar">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Compliance files shared with your principals, with expiry status and actions.
            </p>
          </div>
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFile}
            />
            <Button variant="dark" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading…" : "Upload document"}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {pending && (
          <Card className="rounded-xl border border-border ring-0 shadow-none [--card-spacing:1.25rem] px-(--card-spacing) max-w-xl">
            <DocumentMetadataForm
              fileName={pending.file.name}
              documentName={pending.name}
              initial={pending.prefill}
              busy={uploading}
              onCancel={() => setPending(null)}
              onConfirm={confirmUpload}
            />
          </Card>
        )}

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          All Documents
        </h2>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet — upload your first PDF above.</p>
        ) : (
          <DocumentBrowser
            rows={docs.map((d) => ({
              key: d.id,
              name: d.documentName,
              category: d.documentCategory,
              status: d.status,
              statusNote: d.statusNote,
              fileUrl: d.fileUrl,
              documentType: d.documentType,
              issuingInstitution: d.issuingInstitution,
              expiryDate: d.expiryDate,
              doesNotExpire: d.doesNotExpire,
            }))}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            height="h-[60vh] min-h-[400px]"
          />
        )}
      </section>

      {/* Requested updates rail */}
      {activeUpdate && (
        <aside className="lg:w-[440px] shrink-0 p-6 border-t lg:border-t-0 lg:border-l border-border bg-card">
          <RequestedUpdatePanel update={activeUpdate} />
        </aside>
      )}
    </div>
  );
}
