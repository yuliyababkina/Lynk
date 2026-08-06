import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/*
 * Lightweight UI-chrome i18n for the EN/DE language switcher.
 *
 * Keys ARE the English source strings, so `t("Dashboard")` returns "Dashboard"
 * in English and the German override when set. Anything without a German entry
 * falls back to its English source automatically — the spec's required
 * behaviour. This is a chrome-only switch: supplier/document content (catalogues,
 * uploaded files, free-text) is left as authored.
 */
export type Lang = "en" | "de";

// German overrides, keyed by the English source string.
const DE: Record<string, string> = {
  // Brand / header chrome
  "Procurement Platform": "Beschaffungsplattform",
  "Supplier Portal": "Lieferantenportal",
  Switch: "Wechseln",
  "Roles board": "Rollenübersicht",

  // PM sidebar nav
  Dashboard: "Dashboard",
  Suppliers: "Lieferanten",
  "Data Governance": "Datenverwaltung",
  Onboarding: "Onboarding",
  Compliance: "Compliance",
  Contracts: "Verträge",
  Reporting: "Berichte",
  "Service Catalogue": "Leistungskatalog",
  "Invite Supplier": "Lieferant einladen",
  "Procurement Manager": "Einkaufsleiterin",

  // PM view labels (breadcrumb)
  "Suppliers Overview": "Lieferantenübersicht",
  "Supplier Profile": "Lieferantenprofil",
  "Compliance Monitoring": "Compliance-Überwachung",
  "Contract Management": "Vertragsverwaltung",

  // Supplier portal view labels
  Overview: "Übersicht",
  Principals: "Auftraggeber",
  Documents: "Dokumente",
  "Requested Updates": "Angeforderte Änderungen",
  "Price Agreements": "Preisvereinbarungen",
  "Company Details": "Firmendaten",

  // Onboarding wizard stepper
  "Company info": "Firmendaten",
  "Principal Docs": "Auftraggeber-Dokumente",
  Complete: "Abgeschlossen",

  // Machine-translation marker (free-form content)
  "Machine translated": "Maschinell übersetzt",
  "Machine translated — not the author's original wording.":
    "Maschinell übersetzt — nicht der Originalwortlaut des Verfassers.",
  "Terms & Conditions": "Allgemeine Geschäftsbedingungen",
  "Please read these before entering your company data.":
    "Bitte lesen Sie diese, bevor Sie Ihre Firmendaten eingeben.",

  // ── Structured / reference data (backend-owned string set) ──────────────
  // Ticket criticality
  Critical: "Kritisch",
  High: "Hoch",
  Medium: "Mittel",
  Low: "Niedrig",
  // Ticket categories / filters
  "All tickets": "Alle Tickets",
  "Document compliance": "Dokumenten-Compliance",
  "Data governance": "Datenverwaltung",
  "Service agreements": "Leistungsvereinbarungen",
  "Task Queue": "Aufgabenliste",
  "Sorted by criticality. Click a ticket to open it.":
    "Nach Kritikalität sortiert. Klicken Sie auf ein Ticket, um es zu öffnen.",
  // Compliance document statuses
  Valid: "Gültig",
  "60-Day Warning": "60-Tage-Warnung",
  "30-Day Auto-Notify": "30-Tage-Benachrichtigung",
  "Pending Review": "Prüfung ausstehend",
  "Rejected — Resubmit": "Abgelehnt — erneut einreichen",
  Blocked: "Gesperrt",
  // Compliance tab filters
  All: "Alle",
  "Action Required": "Handlung erforderlich",
  Warnings: "Warnungen",
  Compliant: "Konform",
  // Entity / stage labels
  Prospect: "Interessent",
  Supplier: "Lieferant",
  "Service Provider": "Dienstleister",

  // Landing / roles board
  "Supplier Management Platform": "Lieferantenmanagement-Plattform",
  "Three distinct user experiences within the same workflow.":
    "Drei unterschiedliche Nutzererlebnisse im selben Workflow.",
  "Choose a role to explore.": "Wählen Sie eine Rolle zum Erkunden.",
  "Open Procurement Dashboard": "Einkaufs-Dashboard öffnen",
  "Open Supplier Account": "Lieferantenkonto öffnen",
  "Open Onboarding Portal": "Onboarding-Portal öffnen",
  "In production these would be separate authenticated sessions. This demo simulates all three.":
    "In der Produktion wären dies getrennte authentifizierte Sitzungen. Diese Demo simuliert alle drei.",
};

const STORAGE_KEY = "lynk-lang";

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (source: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === "de" ? "de" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    // Remembered for this user going forward. Storage location (profile vs.
    // browser) is an engineering decision — browser localStorage for now.
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable — session-only is fine */
    }
  }, []);

  const t = useCallback((source: string) => (lang === "de" ? DE[source] ?? source : source), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
