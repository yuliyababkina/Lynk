import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Document facts read out of the PDF itself, so a document shows its real type,
 * issuer and validity even before anyone types them in. Anything the text
 * doesn't state is left undefined — we never invent a value.
 */
export interface ParsedDocumentInfo {
  documentType?: string;
  issuingInstitution?: string;
  /** Raw validity text as printed in the document (e.g. "January 2028"). */
  validity?: string;
  doesNotExpire?: boolean;
  pages?: number;
}

const TYPE_KEYWORDS: [RegExp, string][] = [
  [/\biso\s*\d{4,5}\b/i, "Standard / ISO Certificate"],
  [/\b(liability|insurance|policy)\b/i, "Insurance Policy"],
  [/\b(licence|license)\b/i, "Licence"],
  [/\bdeclaration\b/i, "Declaration"],
  [/\bregistration\b/i, "Registration"],
  [/\bbank (confirmation|letter)\b/i, "Bank Letter"],
  [/\bcertificate\b/i, "Certificate"],
];

/** Labelled lines we accept as the issuing body, in order of confidence. */
const ISSUER_PATTERNS = [
  /(?:issued\s*by|issuer|issuing\s*(?:authority|institution|body))\s*[:\-]\s*([^\n]+)/i,
  /(?:authority|registry|chamber)\s*[:\-]\s*([^\n]+)/i,
];
/* A "Bank:" line only identifies the issuer on a bank document — on any other
 * document it's the supplier's account details, not who issued the paper. */
const BANK_ISSUER = /\bbank\s*[:\-]\s*([^\n]+)/i;

const EXPIRY_PATTERNS = [
  /(?:expiry|expires|expiry\s*date|valid\s*until|valid\s*through|expiration)\s*[:\-]?\s*([^\n]+)/i,
  /valid\s*from[^\n]*?\bto\b\s*([^\n]+)/i,
];

const NO_EXPIRY = /(does not expire|no expiry|not expire|unlimited|indefinite|ongoing|perpetual)/i;

function clean(v: string): string {
  // Trim trailing punctuation/boilerplate that follows a labelled value.
  return v.replace(/\s+/g, " ").replace(/[.;,]\s*$/, "").trim().slice(0, 120);
}

/**
 * Extracts type / issuer / validity from a PDF's text layer.
 * Returns an empty object when the document has no extractable text (scans).
 */
export async function parseDocumentInfo(fileUrl: string): Promise<ParsedDocumentInfo> {
  const task = pdfjsLib.getDocument({ url: fileUrl });
  try {
    const pdf = await task.promise;
    // The facts we're after live on the first page of these documents.
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    // Group items into lines by vertical position so "Label: value" survives.
    const byLine = new Map<number, string[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      (byLine.get(y) ?? byLine.set(y, []).get(y)!).push(item.str);
    }
    const lines = [...byLine.entries()]
      .sort((a, b) => b[0] - a[0]) // top of page first
      .map(([, parts]) => parts.join(" ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const text = lines.join("\n");

    const info: ParsedDocumentInfo = { pages: pdf.numPages };

    // Type: prefer the document's title (first meaningful line), else keywords.
    const title = lines[0] ?? "";
    for (const [re, label] of TYPE_KEYWORDS) {
      if (re.test(title)) {
        info.documentType = label;
        break;
      }
    }
    if (!info.documentType) {
      for (const [re, label] of TYPE_KEYWORDS) {
        if (re.test(text)) {
          info.documentType = label;
          break;
        }
      }
    }

    for (const re of ISSUER_PATTERNS) {
      const m = text.match(re);
      if (m?.[1]) {
        info.issuingInstitution = clean(m[1]);
        break;
      }
    }
    if (!info.issuingInstitution && info.documentType === "Bank Letter") {
      const m = text.match(BANK_ISSUER);
      if (m?.[1]) info.issuingInstitution = clean(m[1]);
    }

    if (NO_EXPIRY.test(text)) {
      info.doesNotExpire = true;
    } else {
      for (const re of EXPIRY_PATTERNS) {
        const m = text.match(re);
        if (m?.[1]) {
          info.validity = clean(m[1]);
          break;
        }
      }
    }

    return info;
  } catch {
    return {};
  } finally {
    task.destroy();
  }
}
