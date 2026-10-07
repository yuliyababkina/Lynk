/*
 * Faux paper page for a compliance document, in the same spirit as the contract
 * preview in the prospect onboarding flow: seeded demo documents carry metadata
 * but no actual PDF, and a reviewer still needs to see *something* where the
 * page would be. Labelled as a mock so it can't be mistaken for a real file.
 */
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
    <div className="mx-auto w-full max-w-[620px] min-h-[877px] flex flex-col bg-white text-slate-900 shadow-md rounded-sm p-10">
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">{issuingInstitution || "Issuing authority"}</div>
          <div className="text-[11px] text-slate-500">Compliance</div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
          {category || documentType || "Certificate"}
        </div>
      </div>

      <div className="mt-7 text-xl font-bold leading-tight">{documentName}</div>
      {expiry && <div className="text-xs text-slate-500 mt-1">Valid until {expiry}</div>}

      <div className="mt-6 space-y-2.5">
        {[100, 92, 97, 85, 74, 95].map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-slate-100" style={{ width: `${w}%` }} />
        ))}
      </div>

      <div className="mt-6 border border-slate-200 rounded overflow-hidden text-xs">
        {[
          ["Document type", documentType || "—"],
          ["Issued by", issuingInstitution || "—"],
          ["Valid until", expiry || "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[1fr_auto] gap-4 px-3 py-2 border-t border-slate-100 first:border-t-0"
          >
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-700 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-5 border-t border-dashed border-slate-200 flex items-end justify-between">
        <div>
          <div className="h-px w-36 bg-slate-300" />
          <div className="text-[11px] text-slate-500 mt-1">Authorised signature</div>
        </div>
        <div className="text-[10px] text-slate-400 max-w-[45%] text-right">
          Mock document — for UI/UX prototype only
        </div>
      </div>
    </div>
  );
}
