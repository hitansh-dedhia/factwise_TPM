// R16: Central audit log helper — called after every create/state-change action.

import { addAuditEntry } from './db';
import { getNowIso } from './appDate';
import type { AuditLog, Role } from './types';

let _counter = 0;

function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${++_counter}`;
}

interface LogParams {
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  patientId?: string | null;
  patientName?: string;
}

export function logAction(params: LogParams): void {
  const entry: AuditLog = {
    id: uid(),
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    action: params.action,
    patientId: params.patientId ?? null,
    patientName: params.patientName,
    timestamp: getNowIso(), // R29: use app date
  };
  addAuditEntry(entry);
}
