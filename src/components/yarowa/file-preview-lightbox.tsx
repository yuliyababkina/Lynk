/**
 * @custom   Full-size look at a file the supplier has picked but not yet
 *           submitted: a modal with a title and a close button over a PdfCanvas,
 *           or a stand-in page passed as children. Built by hand; it is one of
 *           three document-preview modals (with DocumentViewer and
 *           DocumentLightbox) to be consolidated onto shadcn Dialog. Composes
 *           Button and PdfCanvas.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { PdfCanvas } from "@/components/yarowa/pdf-canvas";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Heading } from "@/shared/ui/typography";

/*
 * Full-size look at a file the supplier has picked but not yet submitted.
 *
 * DocumentLightbox can't do this job: it renders nothing unless the document
 * carries a `renewal` already on file, and its footer is the manager's
 * Accept/Reject decision. Here there is no stored document and no decision to
 * take — only a local blob the uploader wants to check before committing to it.
 */
export function FilePreviewLightbox({
  fileUrl,
  fileName,
  fileSize,
  children,
  onClose,
}: {
  /** A real file to render; omit it and pass `children` for a stand-in page. */
  fileUrl?: string;
  fileName: string;
  fileSize?: string;
  children?: ReactNode;
  onClose: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-scrim/50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${fileName}`}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          <div className="min-w-0 flex-1">
            <Heading level={4} as="div" className="truncate">{fileName}</Heading>
            {fileSize && <div className="text-xs text-muted-foreground">{fileSize} · {t("not submitted yet")}</div>}
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label={t("Close")}
            className="h-auto shrink-0 border-0 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
          >
            <X size={18} className="size-[18px]" />
          </Button>
        </div>
        {fileUrl ? (
          <PdfCanvas fileUrl={fileUrl} className="flex-1 min-h-0" />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto bg-secondary/40 p-6">{children}</div>
        )}
      </div>
    </div>
  );
}
