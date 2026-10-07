import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_MB } from "@/lib/use-document-upload";

/*
 * Drop target sized for the 380px detail rail. FileUploadCard is the same idea
 * at page width — its py-20 well and catalogue wording leave no room beside a
 * document's details here, so this is the narrow counterpart rather than a
 * second upload mechanism: both hand the file to useDocumentUpload.
 */
export function CompactDropzone({
  onFile,
  disabled,
  label = "Drop a PDF here",
}: {
  onFile: (file: File | undefined) => void;
  disabled?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "rounded-lg border border-dashed px-3 py-4 text-center transition-colors",
        over ? "border-accent bg-accent/5" : "border-border bg-background",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // let the same file be picked twice
          onFile(file);
        }}
      />
      <Upload className="w-4 h-4 mx-auto text-muted-foreground" />
      <p className="text-xs font-medium mt-1.5">{label}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Browse files
      </Button>
      <p className="text-xs text-muted-foreground mt-2">PDF only · up to {MAX_UPLOAD_MB} MB</p>
    </div>
  );
}
