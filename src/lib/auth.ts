// R17: Single auth module — login, logout, getCurrentUser.
// Session stored in sessionStorage (R30) — one independent session per tab.

import { SESSION_KEY } from './constants';
import { getUsers } from './db';
import type { Session } from './types';

/** R17, R19: Authenticate and store session in sessionStorage. Returns session or null. */
export function login(username: string, password: string): Session | null {
  const user = getUsers().find(
    u => u.username === username && u.password === password
  );
  if (!user) return null;

  const session: Session = { userId: user.id, name: user.name, role: user.role };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); // R30: sessionStorage
  return session;
}

/** R20, R33: Clears ONLY this tab's session. Other tabs are unaffected. */
export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** R17: Returns the current session for this tab, or null if not logged in. */
export function getCurrentUser(): Session | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
