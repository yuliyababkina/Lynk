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
  // Ticket criticality (badges use the raw lowercase value from the data)
  critical: "kritisch",
  high: "hoch",
  medium: "mittel",
  low: "niedrig",
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

  // ── Ticket titles (templated backend strings — see lib/ticket-i18n) ─────
  "{subject} — rejected, resubmission pending": "{subject} — abgelehnt, erneute Einreichung ausstehend",
  "{subject} — {days} days to expiry": "{subject} — {days} Tage bis zum Ablauf",
  "{subject} — expired {days} days ago": "{subject} — vor {days} Tagen abgelaufen",
  "{subject} — expiring in {days} days": "{subject} — läuft in {days} Tagen ab",
  "{subject} — renewal awaiting review": "{subject} — Verlängerung wartet auf Prüfung",
  "{subject} — renewal in progress": "{subject} — Verlängerung in Bearbeitung",
  "Invitation stale — {days} days without response": "Einladung veraltet — {days} Tage ohne Antwort",
  "Invitation sent — 1 day without response": "Einladung gesendet — 1 Tag ohne Antwort",
  "Invitation sent — {days} days without response": "Einladung gesendet — {days} Tage ohne Antwort",
  "Profile completeness {pct}% — below {target}% target":
    "Profilvollständigkeit {pct}% — unter Zielwert {target}%",
  "Profile completeness {pct}% — below {target}% preferred":
    "Profilvollständigkeit {pct}% — unter empfohlenen {target}%",
  "IBAN change request — awaiting second-eye approval": "IBAN-Änderungsantrag — wartet auf Zweitprüfung",
  "IBAN change request — awaiting first-eye endorsement": "IBAN-Änderungsantrag — wartet auf Erstprüfung",
  "Service Catalogue entry — draft, not yet approved":
    "Leistungskatalog-Eintrag — Entwurf, noch nicht genehmigt",

  // Relative age labels
  "{days} days ago": "vor {days} Tagen",
  "1 day ago": "vor 1 Tag",
  Today: "Heute",

  // Ticket actions
  Review: "Prüfen",
  Escalate: "Eskalieren",
  Renew: "Verlängern",
  Remind: "Erinnern",
  Approve: "Genehmigen",
  Request: "Anfordern",

  // Ticket workflow statuses
  "To do": "Offen",
  "In progress": "In Bearbeitung",
  Resolved: "Erledigt",

  // Ticket drawer
  ENTITY: "ENTITÄT",
  TYPE: "TYP",
  OPENED: "GEÖFFNET",
  "What needs attention": "Was Aufmerksamkeit erfordert",
  "Review this item and take the recommended action below, or open the full record for more context.":
    "Prüfen Sie diesen Eintrag und führen Sie die empfohlene Aktion unten aus, oder öffnen Sie den vollständigen Datensatz für mehr Kontext.",
  "Open in {view}": "In {view} öffnen",
  "Expires {date}": "Läuft ab am {date}",

  // ── Contract Management page ────────────────────────────────────────────
  "Framework contracts, renewal deadlines, and full history. No contract lapses without a decision.":
    "Rahmenverträge, Verlängerungsfristen und vollständige Historie. Kein Vertrag läuft ohne Entscheidung aus.",
  "{count} contract require immediate action": "{count} Vertrag erfordert sofortiges Handeln",
  "The renewal deadline has passed or is within 30 days. Initiate renewal or opt-out now to avoid a lapsed contract.":
    "Die Verlängerungsfrist ist abgelaufen oder liegt innerhalb von 30 Tagen. Verlängern Sie jetzt oder treten Sie zurück, um einen ausgelaufenen Vertrag zu vermeiden.",
  "Renewal Urgent": "Verlängerung dringend",
  "Expiring (90d)": "Läuft ab (90 T)",
  Active: "Aktiv",
  "Renewal in Progress": "Verlängerung läuft",
  "Expiring Soon": "Läuft bald ab",
  "Opted Out": "Abgelehnt",
  Urgent: "Dringend",
  Expiring: "Läuft ab",
  Closed: "Geschlossen",
  "SUPPLIER / CONTRACT": "LIEFERANT / VERTRAG",
  "ANNUAL VALUE": "JAHRESWERT",
  "END DATE": "ENDDATUM",
  "TIME LEFT": "RESTZEIT",
  Framework: "Rahmenvertrag",
  "Master Supply": "Rahmenliefervertrag",
  "Service Agreement": "Dienstleistungsvertrag",
  "€{value} per year": "{value} € pro Jahr",
  "Renewal by {date} · {notice} notice req.": "Verlängerung bis {date} · {notice} Kündigungsfrist",

  // ── Reporting page ──────────────────────────────────────────────────────
  "Supplier Performance Report": "Lieferantenleistungsbericht",
  "KPIs, compliance rates, and supplier ratings. Filter before generating for management or audit use.":
    "KPIs, Compliance-Quoten und Lieferantenbewertungen. Filtern Sie vor der Erstellung für Management- oder Prüfzwecke.",
  "Generate Report": "Bericht erstellen",
  "Last 12 months": "Letzte 12 Monate",
  "Compliance Rate": "Compliance-Quote",
  "Avg Supplier Score": "Durchschn. Lieferanten-Score",
  "Active Suppliers": "Aktive Lieferanten",
  "At Risk": "Gefährdet",
  "Critical Flags": "Kritische Kennzeichen",
  "Prospects Pending": "Offene Interessenten",
  "-5pp vs prior period": "-5 PP gegenüber Vorperiode",
  "-1 pts vs prior period": "-1 Pkt. gegenüber Vorperiode",
  "+2 onboarded this period": "+2 in dieser Periode onboardet",
  "red or warning compliance": "rote oder Warn-Compliance",
  "require immediate action": "erfordern sofortiges Handeln",
  "awaiting onboarding completion": "warten auf Abschluss des Onboardings",
  "Compliance Rate & Avg Score Trend": "Trend Compliance-Quote & Durchschn. Score",
  "Across all suppliers · {period}": "Über alle Lieferanten · {period}",
  "Score Distribution": "Score-Verteilung",
  "Active suppliers by score band": "Aktive Lieferanten nach Score-Band",
  "Compliance Rate by Trade": "Compliance-Quote nach Gewerk",
  "Percentage of suppliers with no critical flags":
    "Anteil der Lieferanten ohne kritische Kennzeichen",
  "Network Composition": "Netzwerkzusammensetzung",
  "Contacts by lifecycle stage": "Kontakte nach Lebenszyklusphase",
  Consulting: "Beratung",
  "{count} Prospects": "{count} Interessenten",
  "{count} Suppliers": "{count} Lieferanten",
  "{count} Providers": "{count} Anbieter",
  "{count} total network contacts": "{count} Netzwerkkontakte insgesamt",

  // ── Service Catalogue page ──────────────────────────────────────────────
  "Service catalogues": "Leistungskataloge",
  "Catalog {number} {trade}": "Katalog {number} {trade}",
  "Price lists per Region and Trade, shared with suppliers for confirmation.":
    "Preislisten pro Region und Gewerk, zur Bestätigung an Lieferanten geteilt.",
  "Upload XLS file": "XLS-Datei hochladen",
  "All regions": "Alle Regionen",
  "All types": "Alle Typen",
  "All statuses": "Alle Status",
  Upcoming: "Bevorstehend",
  Draft: "Entwurf",
  "Not shared yet": "Noch nicht geteilt",
  "{confirmed}/{total} Suppliers Confirmed": "{confirmed}/{total} Lieferanten bestätigt",
  "{count} Suppliers to confirm": "{count} Lieferanten müssen bestätigen",

  // ── Send contract & service catalogues (prospect review) ────────────────
  "Next: Send Contract and Service catalogs": "Weiter: Vertrag und Leistungskataloge senden",
  "Reject application": "Bewerbung ablehnen",
  "Request a change": "Änderung anfordern",
  "Send request": "Anfrage senden",
  "Send Contract & Service Catalogs": "Vertrag & Leistungskataloge senden",
  "Send Contract": "Vertrag senden",
  "Choose what to send {company} for signature. The case moves to awaiting signature once sent.":
    "Wählen Sie, was {company} zur Unterzeichnung gesendet wird. Der Fall wechselt nach dem Senden in den Status „wartet auf Unterschrift“.",
  "Contract template": "Vertragsvorlage",
  // ("Service catalogues" is already defined with the catalogue page.)
  "Select the price lists that apply to this supplier's work orders.":
    "Wählen Sie die Preislisten, die für die Aufträge dieses Lieferanten gelten.",
  "Select at least one service catalogue.": "Wählen Sie mindestens einen Leistungskatalog.",
  "Send contracts": "Verträge senden",
  "An email with a signing link goes to {email}.":
    "Eine E-Mail mit Signatur-Link geht an {email}.",
  "Awaiting supplier signature": "Wartet auf Unterschrift des Lieferanten",
  "Contract Sent (Pending Signature)": "Vertrag gesendet (Unterschrift ausstehend)",

  // ── Master Data Governance page ─────────────────────────────────────────
  "Master Data Governance": "Stammdatenverwaltung",
  "Sensitive data changes require four-eyes approval before taking effect. Every change is logged to the immutable audit trail.":
    "Änderungen sensibler Daten erfordern eine Vier-Augen-Genehmigung, bevor sie wirksam werden. Jede Änderung wird im unveränderlichen Audit-Trail protokolliert.",
  "{count} critical payment data change awaiting review":
    "{count} kritische Zahlungsdatenänderung wartet auf Prüfung",
  "IBAN and banking changes carry the highest fraud risk. Review carefully and verify with the supplier directly before endorsing.":
    "IBAN- und Bankänderungen bergen das höchste Betrugsrisiko. Prüfen Sie sorgfältig und bestätigen Sie direkt beim Lieferanten, bevor Sie freigeben.",
  "All Requests": "Alle Anträge",
  "Awaiting Review": "Wartet auf Prüfung",
  Endorsed: "Freigegeben",
  "Endorsed — Awaiting 2nd Approval": "Freigegeben — wartet auf 2. Genehmigung",
  Rejected: "Abgelehnt",
  "Payment Data": "Zahlungsdaten",
  "Contact Data": "Kontaktdaten",
  "Requested by {who} · {when}": "Beantragt von {who} · {when}",
  "SUPPLIER'S STATED REASON": "VOM LIEFERANTEN ANGEGEBENER GRUND",
  "{count} FIELDS CHANGING": "{count} FELDER ÄNDERN SICH",
  Before: "Vorher",
  After: "Nachher",
  Sensitive: "Sensibel",
  "Four-eyes approval progress": "Fortschritt der Vier-Augen-Genehmigung",
  "1. First Review": "1. Erstprüfung",
  "2. Final Approval": "2. Endgültige Genehmigung",
  "Reject Change": "Änderung ablehnen",
  "Endorse — First Review": "Freigeben — Erstprüfung",
  "Bank Name": "Name der Bank",

  // ── Onboarding page ─────────────────────────────────────────────────────
  "Prospect invitations that are stale or incomplete. Follow up to keep your pipeline moving.":
    "Einladungen an Interessenten, die veraltet oder unvollständig sind. Bleiben Sie dran, um Ihre Pipeline in Bewegung zu halten.",
  "Open Invitations": "Offene Einladungen",
  Application: "Bewerbung",
  INVITATION: "EINLADUNG",
  "COMPANY INFO": "FIRMENDATEN",
  DOCUMENTS: "DOKUMENTE",
  CONTRACT: "VERTRAG",
  "PRICE AGREEMENTS": "PREISVEREINBARUNGEN",
  "LAST CHANGE": "LETZTE ÄNDERUNG",
  Sent: "Gesendet",
  Added: "Hinzugefügt",
  Uploaded: "Hochgeladen",
  // ("Opened" and "Signed" are already defined above.)
  "Row actions": "Zeilenaktionen",
  "Open full review": "Vollständige Prüfung öffnen",
  "Send reminder": "Erinnerung senden",
  "Revoke Invitation": "Einladung widerrufen",
  "Delete prospect": "Interessent löschen",
  "Invitation revoked": "Einladung widerrufen",
  "Keep invitation": "Einladung behalten",
  // ("Draft" is already defined with the Service Catalogue statuses.)
  "Revoke the invitation for {company}?": "Einladung für {company} widerrufen?",
  "The existing link stops working immediately, so the prospect can no longer open their onboarding. The case stays here as a draft and you can send a new invitation later.":
    "Der bestehende Link funktioniert sofort nicht mehr, der Interessent kann sein Onboarding nicht mehr öffnen. Der Fall bleibt als Entwurf erhalten, und Sie können später eine neue Einladung senden.",
  "No live invitation to remind about": "Keine aktive Einladung für eine Erinnerung",
  "Send a new invitation instead.": "Senden Sie stattdessen eine neue Einladung.",
  "Reminder sent": "Erinnerung gesendet",
  "Could not send the reminder": "Erinnerung konnte nicht gesendet werden",
  "High Priority": "Hohe Priorität",
  Stale: "Veraltet",
  Pending: "Ausstehend",
  Opened: "Geöffnet",
  "In Review": "In Prüfung",
  METRIC: "KENNZAHL",
  "{days}d no response": "{days} T keine Antwort",
  "Submitted — awaiting review": "Eingereicht — wartet auf Prüfung",
  "Activated in Lynk": "In Lynk aktiviert",
  "Changes requested — awaiting resubmission": "Änderungen angefordert — wartet auf erneute Einreichung",
  "{count} cases": "{count} Fälle",
  "Send Reminder": "Erinnerung senden",

  // ── Suppliers Overview page ─────────────────────────────────────────────
  "All contacts — Prospects, Suppliers, and Providers.":
    "Alle Kontakte — Interessenten, Lieferanten und Dienstleister.",
  "Search...": "Suchen…",
  Provider: "Anbieter",
  COMPANY: "UNTERNEHMEN",
  STAGE: "PHASE",
  TRADE: "GEWERK",
  REGION: "REGION",
  TICKETS: "TICKETS",
  COMPLIANCE: "COMPLIANCE",
  RATING: "BEWERTUNG",
  "{count} ticket": "{count} Ticket",
  "{count} tickets": "{count} Tickets",
  // Trades (reference data)
  Plumbing: "Sanitärinstallation",
  Drywall: "Trockenbau",
  "Building Components": "Bauteile",
  HVAC: "Heizung/Klima",
  Landscaping: "Garten- und Landschaftsbau",
  Renovation: "Renovierung",
  Carpentry: "Zimmerei",
  "Cleaning Services": "Reinigungsdienste",
  "Security Services": "Sicherheitsdienste",
  Roofing: "Dachdeckerei",
  Sanitary: "Sanitär",
  Piping: "Rohrleitungsbau",
  Painting: "Malerarbeiten",
  Electrical: "Elektrotechnik",
  // Regions (reference data)
  Bavaria: "Bayern",
  Hesse: "Hessen",
  "All Germany": "Ganz Deutschland",

  // ── Compliance Monitoring page ──────────────────────────────────────────
  "Continuous document expiry monitoring. Warnings at 60 days, auto-notification at 30 days, auto-block on expiry.":
    "Kontinuierliche Überwachung des Dokumentenablaufs. Warnungen bei 60 Tagen, automatische Benachrichtigung bei 30 Tagen, automatische Sperrung bei Ablauf.",
  "{count} supplier blocked from work orders": "{count} Lieferant von Aufträgen gesperrt",
  "Document expiry passed without renewal. Review any uploaded renewals to reactivate.":
    "Dokument ist ohne Verlängerung abgelaufen. Prüfen Sie hochgeladene Verlängerungen zur Reaktivierung.",
  // ("Action Required" is already defined above with the compliance tab filters.)
  "60-Day Warnings": "60-Tage-Warnungen",
  "Blocked Suppliers": "Gesperrte Lieferanten",
  "Fully Compliant": "Vollständig konform",
  "DOCUMENT / SUPPLIER": "DOKUMENT / LIEFERANT",
  CATEGORY: "KATEGORIE",
  EXPIRY: "ABLAUF",
  STATUS: "STATUS",
  "{days}d remaining": "{days} T verbleibend",
  "Expired {days}d ago": "Vor {days} T abgelaufen",
  "Upload awaiting review": "Upload wartet auf Prüfung",
  // Document categories + supplier trades (reference data)
  Insurance: "Versicherung",
  Certification: "Zertifizierung",
  Licence: "Lizenz",
  Manufacturing: "Fertigung",
  Construction: "Bau",
  Logistics: "Logistik",
  "IT Services": "IT-Dienstleistungen",
  Electronics: "Elektronik",
  // Lifecycle legend
  "Expired → Blocked": "Abgelaufen → Gesperrt",
  "Upload → Review": "Upload → Prüfung",
  "Accept → Reactivated": "Annahme → Reaktiviert",

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
  "Cyber Liability Insurance": "Cyber-Haftpflichtversicherung",
  "Environmental Permit": "Umweltgenehmigung",
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
