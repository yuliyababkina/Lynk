import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { PdfCanvas } from "@/components/yarowa/pdf-canvas";

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 animate-in fade-in duration-150"
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
            <div className="text-sm font-semibold truncate">{fileName}</div>
            {fileSize && <div className="text-xs text-muted-foreground">{fileSize} · not submitted yet</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground shrink-0">
            <X size={18} />
          </button>
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
