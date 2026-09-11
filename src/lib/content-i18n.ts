import type { Lang } from "./i18n";

/*
 * Free-form content translation — the machine-translation half of the language
 * switcher (spec: "Free-form content authored by suppliers/PMs": catalogue
 * descriptions, contract text, notes, comments).
 *
 * THIS IS A STUB. In production the translate seam calls a machine-translation
 * engine (DeepL / Azure — see the spec's Open Questions, a Thomas/backend
 * decision) and CACHES the result per content item + language, so any given text
 * is paid for and translated at most once. Here a small in-memory translation
 * memory stands in for that cache.
 *
 * Two spec rules are enforced independently of the engine:
 *  1. Round-trip — content is tagged with its authored/original language and
 *     served VERBATIM when the viewer's language matches it. Machine translation
 *     is only ever invoked for the OTHER language, so toggling back always
 *     restores the exact original, never a translation-of-a-translation.
 *  2. English fallback — if no translation exists yet, the original is returned
 *     (never a blank/broken string) and is NOT flagged as machine-translated.
 */

// Cached machine translations, keyed by the original text → per target language.
// Stands in for the DeepL/Azure response cache. In production this table is
// populated on demand and persisted, not hand-authored.
const TRANSLATION_MEMORY: Record<string, Partial<Record<Lang, string>>> = {
  // ── Supplier onboarding Terms & Conditions (authored in English) → German ──
  "1. What you are agreeing to": { de: "1. Wozu Sie sich verpflichten" },
  "2. Accuracy of the information you submit": { de: "2. Richtigkeit der übermittelten Angaben" },
  "3. How your data is used": { de: "3. Wie Ihre Daten verwendet werden" },
  "4. Keeping documents valid": { de: "4. Dokumente gültig halten" },
  "5. Retention": { de: "5. Aufbewahrung" },
  "6. Your rights (GDPR)": { de: "6. Ihre Rechte (DSGVO)" },
  "7. Confidentiality": { de: "7. Vertraulichkeit" },
  "By continuing you register your company as a supplier of Urban Habitat Management GmbH on the Lynk platform and confirm you are authorised to act for it.":
    {
      de: "Mit dem Fortfahren registrieren Sie Ihr Unternehmen als Lieferant von Urban Habitat Management GmbH auf der Lynk-Plattform und bestätigen, dass Sie berechtigt sind, für dieses zu handeln.",
    },
  "Company details, certificates and other documents must be accurate, current and issued to your company. Submitting incorrect or forged documents can end the qualification and any existing relationship.":
    {
      de: "Unternehmensangaben, Zertifikate und andere Dokumente müssen korrekt, aktuell und auf Ihr Unternehmen ausgestellt sein. Das Einreichen falscher oder gefälschter Dokumente kann die Qualifizierung und jede bestehende Beziehung beenden.",
    },
  "Your company data and documents are processed to qualify and monitor you as a supplier: verification, expiry tracking and compliance reporting. They are visible to authorised procurement staff of Urban Habitat Management GmbH and are not sold or used for advertising.":
    {
      de: "Ihre Unternehmensdaten und Dokumente werden verarbeitet, um Sie als Lieferant zu qualifizieren und zu überwachen: Verifizierung, Ablaufverfolgung und Compliance-Berichte. Sie sind für autorisierte Einkaufsmitarbeiter von Urban Habitat Management GmbH sichtbar und werden nicht verkauft oder für Werbung verwendet.",
    },
  "You keep certificates up to date and replace them before they expire. The platform notifies you ahead of an expiry; an expired mandatory document can suspend you from new work orders.":
    {
      de: "Sie halten Zertifikate aktuell und ersetzen diese vor Ablauf. Die Plattform benachrichtigt Sie vor einem Ablauf; ein abgelaufenes Pflichtdokument kann Sie von neuen Aufträgen ausschließen.",
    },
  "Submitted data is kept for the duration of the relationship and afterwards only as long as statutory retention obligations require, then deleted.":
    {
      de: "Übermittelte Daten werden für die Dauer der Beziehung aufbewahrt und danach nur so lange, wie gesetzliche Aufbewahrungspflichten es erfordern, anschließend gelöscht.",
    },
  "You may request access to, correction of, or deletion of your data, and withdraw consent at any time. Withdrawing consent may mean the supplier relationship cannot continue.":
    {
      de: "Sie können Auskunft über Ihre Daten, deren Berichtigung oder Löschung verlangen und Ihre Einwilligung jederzeit widerrufen. Ein Widerruf kann bedeuten, dass die Lieferantenbeziehung nicht fortgesetzt werden kann.",
    },
  "Prices, catalogues and other commercial information exchanged through the platform are confidential and must not be passed to third parties without written permission.":
    {
      de: "Preise, Kataloge und andere über die Plattform ausgetauschte Geschäftsinformationen sind vertraulich und dürfen ohne schriftliche Genehmigung nicht an Dritte weitergegeben werden.",
    },
};

export interface TranslatedContent {
  text: string;
  /** True when `text` is a machine translation rather than the authored original. */
  machineTranslated: boolean;
}

/**
 * Resolve a piece of free-form content for the viewer's language.
 * @param original    the authored text
 * @param authoredLang the language it was written in
 * @param lang        the viewer's current language
 */
export function translateContent(original: string, authoredLang: Lang, lang: Lang): TranslatedContent {
  // Round-trip: the authored original is always served verbatim in its own language.
  if (lang === authoredLang) return { text: original, machineTranslated: false };
  // Otherwise use the cached machine translation for the target language…
  const cached = TRANSLATION_MEMORY[original]?.[lang];
  if (cached) return { text: cached, machineTranslated: true };
  // …or fall back to the original (never a blank/broken string).
  return { text: original, machineTranslated: false };
}
