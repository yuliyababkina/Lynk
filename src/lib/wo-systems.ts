/**
 * Work order (WO) management systems — which system a company receives work
 * orders through. This is an attribute of a supplier, not a lifecycle stage
 * (Prospect / Supplier are the stages).
 *
 * The one place the list lives: the table cell, any future filter and the
 * database check constraint (supabase/migrations) all read from or mirror it.
 * Values double as display labels and are what the `suppliers.wo_system`
 * column stores, so keep them in sync with the migration when editing.
 *
 * Suggestions for DACH and Northwest Europe — agreed with the PO.
 */
export const WO_SYSTEMS = [
  "Enable (Yarowa)",
  "SAP",
  "Planon",
  "IBM Maximo",
  "Eptura (Archibus)",
  "Infor EAM",
  "Aareon",
  "Haufe iX-Haus",
  "MRI Software",
  "Yardi",
  "Rimo R5 (Switzerland)",
  "Other",
  "None / manual",
  "Unknown",
] as const;

export type WoSystem = (typeof WO_SYSTEMS)[number];

/** Prospects and companies we know nothing about. The table shows "—" for it. */
export const DEFAULT_WO_SYSTEM: WoSystem = "Unknown";

/** Narrows a raw DB value; anything unrecognised becomes the default. */
export function toWoSystem(value: unknown): WoSystem {
  return WO_SYSTEMS.find((s) => s === value) ?? DEFAULT_WO_SYSTEM;
}
