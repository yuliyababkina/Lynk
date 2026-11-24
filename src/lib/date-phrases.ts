import type { TVars } from "./i18n";

type Translate = (source: string, vars?: TVars) => string;

/*
 * Dates in the ticket panel read as phrases ("Expires in 55 days · 12 Aug 2026"),
 * never as a bare number. The day counts are the stored ones (days_until_expiry,
 * a contract's time-left label), not recomputed from today: they are what the
 * status badges and the workspace tables are built on, so the panel must agree
 * with them.
 */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAY_MS = 86_400_000;

/** Parses the stored "18 Jul 2026" display dates. Null when it isn't one. */
export function parseDisplayDate(value: string | undefined | null): number | null {
  const m = value?.trim().match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  return Date.UTC(Number(m[3]), month, Number(m[1]));
}

/** Whole days from `from` to `to` (both stored display dates), or null. */
export function daysBetween(from: string, to: string): number | null {
  const a = parseDisplayDate(from);
  const b = parseDisplayDate(to);
  if (a === null || b === null) return null;
  return Math.round((b - a) / DAY_MS);
}

/** "Expires in 55 days · 12 Aug 2026" / "Expired 3 days ago · 7 Jul 2026". */
export function expiryPhrase(days: number, date: string, t: Translate): string {
  if (days > 1) return t("Expires in {n} days · {date}", { n: days, date });
  if (days === 1) return t("Expires tomorrow · {date}", { date });
  if (days === 0) return t("Expires today · {date}", { date });
  if (days === -1) return t("Expired yesterday · {date}", { date });
  return t("Expired {n} days ago · {date}", { n: Math.abs(days), date });
}

/** A contract's end: "Ends in 8 days · 18 Jul 2026", or "Ended · 31 Jan 2024" once past. */
export function contractEndPhrase(daysLeft: number | null, date: string, t: Translate): string {
  if (daysLeft === null || daysLeft < 0) return t("Ended · {date}", { date });
  if (daysLeft === 0) return t("Ends today · {date}", { date });
  if (daysLeft === 1) return t("Ends tomorrow · {date}", { date });
  return t("Ends in {n} days · {date}", { n: daysLeft, date });
}

/** A deadline: "Due in 12 days · 30 Jun 2026" / "Was due 82 days ago · 19 Apr 2026". */
export function duePhrase(days: number | null, date: string, t: Translate): string {
  if (days === null) return date;
  if (days > 1) return t("Due in {n} days · {date}", { n: days, date });
  if (days === 1) return t("Due tomorrow · {date}", { date });
  if (days === 0) return t("Due today · {date}", { date });
  if (days === -1) return t("Was due yesterday · {date}", { date });
  return t("Was due {n} days ago · {date}", { n: Math.abs(days), date });
}

/** Days left from a contract's stored label ("74d left"); null for "Expired" and the like. */
export function contractDaysLeft(timeLeftLabel: string): number | null {
  const m = timeLeftLabel.match(/^(\d+)d left$/);
  return m ? Number(m[1]) : null;
}

/**
 * Days until the renewal decision is due, measured on the same stored clock as
 * the contract's time left: the renewal date sits a fixed number of days before
 * the end date, so it is that many days nearer.
 */
export function renewalDueDays(timeLeftLabel: string, renewalBy: string, endDate: string): number | null {
  const left = contractDaysLeft(timeLeftLabel);
  const gap = daysBetween(renewalBy, endDate);
  if (left === null || gap === null) return null;
  return left - gap;
}

/** A past date: "Today · 25 Nov 2026" / "Yesterday · …" / "14 days ago · 11 Nov 2026". */
export function sincePhrase(days: number | null, date: string, t: Translate): string {
  if (days === null || days < 0) return date;
  if (days === 0) return t("Today · {date}", { date });
  if (days === 1) return t("Yesterday · {date}", { date });
  return t("{n} days ago · {date}", { n: days, date });
}
