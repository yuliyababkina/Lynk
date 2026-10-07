import { useCallback, useEffect, useRef, useState } from "react";
import { useLynkData } from "@/lib/LynkDataContext";
import { recogniseDocumentMetadata, type DocumentMetadata } from "@/lib/onboarding-documents";

/*
 * The one upload flow for the Supplier Portal: validate the file, read what we
 * can off it, let the uploader correct that, then save. The Documents page and
 * the Overview activity panel both run through this, so a document uploaded
 * from a ticket is indistinguishable from one uploaded from the list.
 *
 * The object URL exists only so the picked file can be previewed before it is
 * saved; it is revoked when the pick is cleared or the component unmounts.
 */

export const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export interface PendingUpload {
  file: File;
  /** File name without the .pdf suffix — what the document is saved as. */
  name: string;
  prefill: DocumentMetadata;
  /** Local blob URL for previewing the file before it is saved. */
  previewUrl: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useDocumentUpload(supplierId: string, supplierName: string) {
  const { addSupplierDoc } = useLynkData();
  const [pending, setPendingState] = useState<PendingUpload | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const clear = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPendingState(null);
  }, []);

  useEffect(() => clear, [clear]);

  /** Accepts a picked or dropped file; returns false when it was rejected. */
  const selectFile = useCallback(
    (file: File | null | undefined): boolean => {
      if (!file) return false;
      if (file.type !== "application/pdf") {
        setError("Please choose a PDF file.");
        return false;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`That file is ${formatFileSize(file.size)} — the limit is ${MAX_UPLOAD_MB} MB.`);
        return false;
      }
      setError(null);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const previewUrl = URL.createObjectURL(file);
      urlRef.current = previewUrl;
      const name = file.name.replace(/\.pdf$/i, "");
      setPendingState({ file, name, prefill: recogniseDocumentMetadata(name), previewUrl });
      return true;
    },
    []
  );

  /** Saves the pending file with the metadata the uploader confirmed. */
  const confirm = useCallback(
    async (metadata: DocumentMetadata, documentName?: string): Promise<boolean> => {
      if (!pending) return false;
      setUploading(true);
      try {
        await addSupplierDoc(
          pending.file,
          supplierId,
          supplierName,
          undefined,
          documentName ?? pending.name,
          metadata
        );
        clear();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        return false;
      } finally {
        setUploading(false);
      }
    },
    [addSupplierDoc, clear, pending, supplierId, supplierName]
  );

  return { pending, uploading, error, setError, selectFile, confirm, clear };
}
