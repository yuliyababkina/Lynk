import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/*
 * Drag-and-drop file upload card for the catalogue wizard. When `loading` is
 * true it shows a parsing/comparing spinner state instead of the dropzone.
 */
export function FileUploadCard({
  description = "Drag an XLS file here, or choose one from your computer.",
  buttonLabel = "Upload XLS file",
  onUpload,
  loading = false,
  loadingLabel = "Parsing file…",
  loadingFilename,
}: {
  description?: string;
  buttonLabel?: string;
  onUpload?: () => void;
  loading?: boolean;
  loadingLabel?: string;
  loadingFilename?: string;
}) {
  if (loading) {
    return (
      <div className="border border-border rounded-2xl py-20 flex flex-col items-center justify-center bg-card">
        <Loader2 size={28} className="animate-spin text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">{loadingLabel}</p>
        {loadingFilename && <p className="text-xs text-muted-foreground">{loadingFilename}</p>}
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-border rounded-2xl py-20 flex flex-col items-center justify-center text-center bg-card">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
        <Upload size={22} className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      <Button onClick={onUpload}>
        <Upload size={14} /> {buttonLabel}
      </Button>
    </div>
  );
}
