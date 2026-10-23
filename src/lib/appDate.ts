// R28, R29: App-date module — the ONLY place that reads the system clock.
// All "today" logic throughout the app must call getAppDate() or getNowIso().
// Never call new Date() or Date.now() directly anywhere else.

import { STORAGE_KEYS, SEED_DATE } from './constants';

/** Returns the current app date as "YYYY-MM-DD". Initialises from real clock if never set. */
export function getAppDate(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.APP_DATE);
  if (stored) return stored;
  // First run: initialise from real clock (R29)
  const today = localDateString(new Date());
  localStorage.setItem(STORAGE_KEYS.APP_DATE, today);
  return today;
}

export function setAppDate(date: string): void {
  localStorage.setItem(STORAGE_KEYS.APP_DATE, date);
}

/** R28: Simulate next day — advances by exactly 1 day, no data changes. */
export function advanceAppDate(): string {
  const current = getAppDate();
  const d = new Date(current + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  const next = localDateString(d);
  setAppDate(next);
  return next;
}

/** Returns true if an ISO-like datetime string falls on the current app date. */
export function isToday(datetimeStr: string): boolean {
  return datetimeStr.startsWith(getAppDate());
}

/**
 * R29: Returns an ISO-like timestamp string for "right now" using the APP DATE
 * as the date component and the real wall clock for the time component.
 * Format: "YYYY-MM-DDTHH:MM:SS" (no timezone suffix — stored locally).
 */
export function getNowIso(): string {
  const appDate = getAppDate();
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  return `${appDate}T${hh}:${mm}:${ss}`;
}

/** R27: Resets app date to the seed starting date. */
export function resetAppDate(): void {
  setAppDate(SEED_DATE);
}

// ── Internal helpers ──────────────────────────────────────────
function localDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
