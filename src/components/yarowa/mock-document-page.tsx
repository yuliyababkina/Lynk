/*
 * Faux paper page for a compliance document, in the same spirit as the contract
 * preview in the prospect onboarding flow: seeded demo documents carry metadata
 * but no actual PDF, and a reviewer still needs to see *something* where the
 * page would be. Labelled as a mock so it can't be mistaken for a real file.
 */
// Static width classes, not a style prop: Tailwind needs to see each one in source.
const LINE_WIDTHS = ["w-full", "w-[92%]", "w-[97%]", "w-[85%]", "w-[74%]", "w-[95%]"];

export function MockDocumentPage({
  documentName,
  category,
  documentType,
  issuingInstitution,
  expiry,
}: {
  documentName: string;
  category?: string;
  documentType?: string;
  issuingInstitution?: string;
  expiry?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[620px] min-h-[877px] flex flex-col bg-paper text-paper-foreground shadow-md rounded-sm p-10">
      <div className="flex items-start justify-between border-b border-paper-border pb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">{issuingInstitution || "Issuing authority"}</div>
          <div className="text-[11px] text-paper-muted">Compliance</div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-wide text-paper-muted font-semibold">
          {category || documentType || "Certificate"}
        </div>
      </div>

      <div className="mt-7 text-xl font-bold leading-tight">{documentName}</div>
      {expiry && <div className="text-xs text-paper-muted mt-1">Valid until {expiry}</div>}

      <div className="mt-6 space-y-2.5">
        {LINE_WIDTHS.map((w, i) => (
          <div key={i} className={`h-2.5 rounded bg-paper-tint ${w}`} />
        ))}
      </div>

      <div className="mt-6 border border-paper-border rounded overflow-hidden text-xs">
        {[
          ["Document type", documentType || "—"],
          ["Issued by", issuingInstitution || "—"],
          ["Valid until", expiry || "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[1fr_auto] gap-4 px-3 py-2 border-t border-paper-tint first:border-t-0"
          >
            <span className="text-paper-muted">{label}</span>
            <span className="text-paper-value font-medium">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-5 border-t border-dashed border-paper-border flex items-end justify-between">
        <div>
          <div className="h-px w-36 bg-paper-rule" />
          <div className="text-[11px] text-paper-muted mt-1">Authorised signature</div>
        </div>
        <div className="text-[10px] text-paper-subtle max-w-[45%] text-right">
          Mock document — for UI/UX prototype only
        </div>
      </div>
    </div>
  );
}
