import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { DocumentMetadataForm } from "@/components/yarowa/document-metadata-form";
import { DocumentBrowser } from "@/components/yarowa/document-browser";
import { useLynkData } from "@/lib/lynk-data-context";
import { useI18n } from "@/lib/i18n-context";
import { useDocumentUpload } from "@/lib/use-document-upload";
import { getPortalProfile } from "./portal-data";
import { Heading, Text } from "@/shared/ui/typography";

export interface PortalDocumentsProps {
  supplierId: string;
}

export function PortalDocuments({ supplierId }: PortalDocumentsProps) {
  const { docs: allDocs } = useLynkData();
  const { t } = useI18n();
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
            <Heading level={1}>{t("Documents")}</Heading>
            <p className="text-muted-foreground mt-1">
              {t("Compliance files shared with your principals, with expiry status and actions.")}
            </p>
          </div>
          <div className="shrink-0">
            <Input
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
            <Button variant="default" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? t("Uploading…") : t("Upload document")}
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

        <h2>
          <Text variant="eyebrow" as="span">
            {t("All Documents")}
          </Text>
        </h2>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No documents yet — upload your first PDF above.")}</p>
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
