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
  "Supplier · EuroBau Components": "Lieferant · EuroBau Components",
  "Prospect · Yilmaz Elektrotechnik": "Interessent · Yilmaz Elektrotechnik",
  "Dashboard, compliance monitoring, contract management, data governance, qualification, reporting.":
    "Dashboard, Compliance-Überwachung, Vertragsverwaltung, Datenverwaltung, Qualifizierung, Berichte.",
  "Manage compliance documents, request sensitive data changes, view performance ratings and score history.":
    "Compliance-Dokumente verwalten, Änderungen sensibler Daten beantragen, Leistungsbewertungen und Score-Verlauf einsehen.",
  "New supplier invited to the platform. Complete profile, upload compliance documents, go through onboarding.":
    "Neuer Lieferant zur Plattform eingeladen. Profil vervollständigen, Compliance-Dokumente hochladen, Onboarding durchlaufen.",

  // ── Prospect onboarding — welcome / consent ─────────────────────────────
  "Welcome, {name}": "Willkommen, {name}",
  "You've been invited to extend your existing supplier relationship to a new Principal — {principal}. Your existing data has been pre-filled. Please review, confirm, and upload any missing documents.":
    "Sie wurden eingeladen, Ihre bestehende Lieferantenbeziehung auf einen neuen Auftraggeber auszuweiten — {principal}. Ihre vorhandenen Daten wurden vorausgefüllt. Bitte prüfen, bestätigen und fehlende Dokumente hochladen.",
  "I have read and agree to the Terms & Conditions and the {privacy}, and I am authorised to accept them for {company}.":
    "Ich habe die Allgemeinen Geschäftsbedingungen und die {privacy} gelesen und stimme ihnen zu, und ich bin berechtigt, diese für {company} zu akzeptieren.",
  "Privacy Policy": "Datenschutzerklärung",
  "Recording your acceptance…": "Ihre Zustimmung wird gespeichert…",
  "Accepted — version {version}": "Akzeptiert — Version {version}",
  "Accept the Terms & Conditions to continue.":
    "Akzeptieren Sie die Allgemeinen Geschäftsbedingungen, um fortzufahren.",
  "This link is private and expires in 72 hours. Your data is protected under GDPR. Only authorised procurement staff at {principal} can access your profile.":
    "Dieser Link ist privat und läuft in 72 Stunden ab. Ihre Daten sind gemäß DSGVO geschützt. Nur autorisierte Einkaufsmitarbeiter von {principal} können auf Ihr Profil zugreifen.",
  "Review & Confirm My Details": "Meine Daten prüfen & bestätigen",
  "Update & Resubmit My Details": "Meine Daten aktualisieren & erneut einreichen",
  "Changes requested by procurement": "Änderungen vom Einkauf angefordert",
  "Please update your details/documents and resubmit.":
    "Bitte aktualisieren Sie Ihre Daten/Dokumente und reichen Sie sie erneut ein.",
  "Application not approved": "Bewerbung nicht genehmigt",

  // ── Prospect onboarding — company details ───────────────────────────────
  // ("Company Details" is already defined above under the portal view labels.)
  "Registered Address": "Eingetragene Adresse",
  "Legal Name": "Firmenname",
  "VAT ID": "USt-IdNr.",
  "Registration No.": "Handelsregister-Nr.",
  Website: "Webseite",
  Street: "Straße",
  City: "Stadt",
  Postcode: "Postleitzahl",
  Country: "Land",
  "Submit My Details": "Meine Daten einreichen",
  Continue: "Weiter",
  Back: "Zurück",
  Approved: "Genehmigt",
  "Approved by procurement": "Vom Einkauf genehmigt",
  "{principal} has verified your company details — no changes needed here.":
    "{principal} hat Ihre Firmendaten geprüft — hier sind keine Änderungen erforderlich.",

  // ── Prospect onboarding — documents ─────────────────────────────────────
  // Document review statuses + browser chrome
  Declined: "Abgelehnt",
  "Pending review": "Prüfung ausstehend",
  Missing: "Fehlt",
  "Document type": "Dokumententyp",
  "Issued by": "Ausgestellt von",
  Validity: "Gültigkeit",
  // Standard compliance document names (finite, backend-owned reference set)
  "Certificate of Incorporation": "Handelsregisterauszug",
  "VAT Registration Certificate": "USt-Registrierungsbescheinigung",
  "Public Liability Insurance": "Betriebshaftpflichtversicherung",
  "Bank Confirmation Letter": "Bankbestätigungsschreiben",
  "Trade Licence": "Gewerbeschein",
  "ISO 9001 Certificate": "ISO-9001-Zertifikat",
  "Conflict Minerals Declaration": "Konfliktmineralien-Erklärung",
  "Standard Compliance Documents": "Standard-Compliance-Dokumente",
  "These documents are required for all suppliers on the Lynk platform.":
    "Diese Dokumente sind für alle Lieferanten auf der Lynk-Plattform erforderlich.",
  "Documents already on file are shown as verified — only upload what's missing.":
    "Bereits hinterlegte Dokumente werden als verifiziert angezeigt — laden Sie nur Fehlendes hoch.",
  "Submit for Review": "Zur Prüfung einreichen",
  "Upload the required documents (Public Liability Insurance, Trade Licence) to continue.":
    "Laden Sie die erforderlichen Dokumente (Betriebshaftpflichtversicherung, Gewerbeschein) hoch, um fortzufahren.",

  // ── Prospect onboarding — contracts ─────────────────────────────────────
  "{principal} has verified your details and documents.":
    "{principal} hat Ihre Daten und Dokumente geprüft.",
  "Review & sign your contracts": "Ihre Verträge prüfen & unterzeichnen",
  "{principal} has sent the documents below — the main agreement and the price catalogues that apply to your work orders. Review each carefully and sign all of them to activate your supplier account.":
    "{principal} hat die untenstehenden Dokumente gesendet — den Hauptvertrag und die Preiskataloge, die für Ihre Aufträge gelten. Prüfen Sie jedes sorgfältig und unterzeichnen Sie alle, um Ihr Lieferantenkonto zu aktivieren.",
  Contract: "Vertrag",
  "Pricing catalogue": "Preiskatalog",
  Signed: "Unterzeichnet",
  "{signed} of {total} signed": "{signed} von {total} unterzeichnet",
  "I have read and agree to this agreement, and I am authorised to sign on behalf of my company.":
    "Ich habe diesen Vertrag gelesen und stimme ihm zu, und ich bin berechtigt, im Namen meines Unternehmens zu unterzeichnen.",
  "I have read and agree to this pricing catalogue, and I am authorised to sign on behalf of my company.":
    "Ich habe diesen Preiskatalog gelesen und stimme ihm zu, und ich bin berechtigt, im Namen meines Unternehmens zu unterzeichnen.",
  "Sign as {name}": "Unterzeichnen als {name}",
  "Signed by {name}": "Unterzeichnet von {name}",
  "Activate supplier account": "Lieferantenkonto aktivieren",
  "You're now a supplier 🎉": "Sie sind jetzt Lieferant 🎉",
  "Contracts signed. {company} is active for {principal} and can now receive work orders. Manage your documents, contracts and details anytime from your supplier portal.":
    "Verträge unterzeichnet. {company} ist für {principal} aktiv und kann nun Aufträge erhalten. Verwalten Sie Ihre Dokumente, Verträge und Daten jederzeit über Ihr Lieferantenportal.",
};

const STORAGE_KEY = "lynk-lang";

/** Values substituted into `{placeholder}` slots in a string. */
export type TVars = Record<string, string | number>;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /**
   * Translate a source string. `{name}`-style placeholders let the translation
   * put interpolated values where that language's grammar needs them, instead of
   * concatenating fragments.
   */
  t: (source: string, vars?: TVars) => string;
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

  const t = useCallback(
    (source: string, vars?: TVars) => {
      const template = lang === "de" ? DE[source] ?? source : source;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in vars ? String(vars[key]) : match
      );
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
