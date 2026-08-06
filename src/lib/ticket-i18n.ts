import type { TVars } from "./i18n";

/*
 * Ticket titles and age labels are *templated* backend strings — generated from
 * a fixed set of patterns with values interpolated in ("Trade Licence — expiring
 * in 55 days"). They're structured reference data, not free-form prose, so they
 * translate through pattern matching rather than a machine-translation engine.
 *
 * Each pattern captures the variable parts and re-inserts them into the
 * translated template. The captured subject (a document name, contract ref) is
 * itself passed through `t` so known document names translate too. Anything that
 * matches no pattern is returned unchanged (English fallback).
 */

type Translate = (source: string, vars?: TVars) => string;

interface TitlePattern {
  /** Matches the English title; group 1 is the subject where present. */
  re: RegExp;
  /** Dictionary key for the translated template. */
  key: string;
  /** Builds the vars from the regex match. */
  vars: (m: RegExpMatchArray, t: Translate) => TVars;
}

const TITLE_PATTERNS: TitlePattern[] = [
  {
    re: /^(.+) — rejected, resubmission pending$/,
    key: "{subject} — rejected, resubmission pending",
    vars: (m, t) => ({ subject: t(m[1]) }),
  },
  {
    re: /^(.+) — (\d+) days to expiry$/,
    key: "{subject} — {days} days to expiry",
    vars: (m, t) => ({ subject: t(m[1]), days: m[2] }),
  },
  {
    re: /^(.+) — expired (\d+) days ago$/,
    key: "{subject} — expired {days} days ago",
    vars: (m, t) => ({ subject: t(m[1]), days: m[2] }),
  },
  {
    re: /^(.+) — expiring in (\d+) days$/,
    key: "{subject} — expiring in {days} days",
    vars: (m, t) => ({ subject: t(m[1]), days: m[2] }),
  },
  {
    re: /^(.+) — renewal awaiting review$/,
    key: "{subject} — renewal awaiting review",
    vars: (m, t) => ({ subject: t(m[1]) }),
  },
  {
    re: /^(.+) — renewal in progress$/,
    key: "{subject} — renewal in progress",
    vars: (m, t) => ({ subject: t(m[1]) }),
  },
  {
    re: /^Invitation stale — (\d+) days without response$/,
    key: "Invitation stale — {days} days without response",
    vars: (m) => ({ days: m[1] }),
  },
  {
    re: /^Invitation sent — 1 day without response$/,
    key: "Invitation sent — 1 day without response",
    vars: () => ({}),
  },
  {
    re: /^Invitation sent — (\d+) days without response$/,
    key: "Invitation sent — {days} days without response",
    vars: (m) => ({ days: m[1] }),
  },
  {
    re: /^Profile completeness (\d+)% — below (\d+)% target$/,
    key: "Profile completeness {pct}% — below {target}% target",
    vars: (m) => ({ pct: m[1], target: m[2] }),
  },
  {
    re: /^Profile completeness (\d+)% — below (\d+)% preferred$/,
    key: "Profile completeness {pct}% — below {target}% preferred",
    vars: (m) => ({ pct: m[1], target: m[2] }),
  },
];

/** Translate a templated ticket title, falling back to the original. */
export function translateTicketTitle(title: string, t: Translate): string {
  for (const p of TITLE_PATTERNS) {
    const m = title.match(p.re);
    if (m) return t(p.key, p.vars(m, t));
  }
  // Titles with no variable part (e.g. "IBAN change request — awaiting
  // second-eye approval") are plain dictionary entries.
  return t(title);
}

/** Translate a relative age label ("12 days ago", "Today"). */
export function translateAgeLabel(label: string, t: Translate): string {
  const trimmed = label.trim();
  const days = trimmed.match(/^(\d+) days? ago$/);
  if (days) {
    return days[1] === "1" ? t("1 day ago") : t("{days} days ago", { days: days[1] });
  }
  return t(trimmed);
}

/**
 * Translate a templated service-catalogue name ("Catalog 3 Piping"), falling
 * back to the original. The trade part goes through the dictionary so it
 * localises with the rest of the reference data.
 */
export function translateCatalogueName(name: string, t: Translate): string {
  const m = name.match(/^Catalog (\d+) (.+)$/);
  if (m) return t("Catalog {number} {trade}", { number: m[1], trade: t(m[2]) });
  return t(name);
}
