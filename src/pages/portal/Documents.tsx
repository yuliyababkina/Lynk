import { useRef, useState } from "react";
import { FileText, Upload, Loader2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { DocumentMetadataForm } from "@/components/yarowa/document-metadata-form";
import { DocumentBrowser } from "@/components/yarowa/document-browser";
import { useLynkData } from "@/lib/LynkDataContext";
import { useDocumentUpload } from "@/lib/use-document-upload";
import { docStatusMeta } from "@/lib/document-status";
import { getPortalProfile } from "./portal-data";

export interface PortalDocumentsProps {
  supplierId: string;
}

export function PortalDocuments({ supplierId }: PortalDocumentsProps) {
  const { docs: allDocs } = useLynkData();
  const profile = getPortalProfile(supplierId);
  const supplierName = profile.company.legalName;
  const activeUpdate = profile.requestedUpdates[0];

  const docs = allDocs.filter((d) => d.supplierId === supplierId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Same hook the Overview activity panel uses, so a document uploaded from a
  // ticket and one uploaded here go through identical validation and metadata.
  const { pending, uploading, error, selectFile, confirm, clear } = useDocumentUpload(
    supplierId,
    supplierName
  );

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
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ""; // allow re-selecting the same file
                selectFile(file);
              }}
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
              onCancel={clear}
              onConfirm={(metadata) => confirm(metadata)}
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
