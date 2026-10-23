// Data layer — all localStorage reads/writes go through here.
// R32: every write triggers the browser "storage" event, which other tabs listen to.
// R25: every write action checks permissions inside the data layer.

import { STORAGE_KEYS, TOTAL_ROOMS, FEVER_THRESHOLD, TEMP_MIN, TEMP_MAX } from './constants';
import type {
  Patient, TemperatureReading, DoctorVisit, User, AuditLog,
  PatientStatus, DailyTaskStatus, PatientWithDailyStatus, Role, Gender,
} from './types';
import { getAppDate, getNowIso, resetAppDate } from './appDate';
import { hasPermission } from './permissions';
import { generateSeed, SEED_USERS } from './seed';

// ── Generic helpers ───────────────────────────────────────────
function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  // Writing to localStorage fires the "storage" event in OTHER tabs (R32)
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch a local storage event so current tab components can also react immediately
  window.dispatchEvent(new Event('app_data_changed'));
}

// ── Database Initialization ──────────────────────────────────
export function initDatabase(): void {
  const users = read<User>(STORAGE_KEYS.USERS);
  const patients = read<Patient>(STORAGE_KEYS.PATIENTS);
  if (users.length === 0 || patients.length === 0) {
    generateSeed();
  }
}

// ── Patients ──────────────────────────────────────────────────
export function getPatients(): Patient[] {
  initDatabase();
  return read<Patient>(STORAGE_KEYS.PATIENTS);
}

export function savePatients(patients: Patient[]): void {
  write(STORAGE_KEYS.PATIENTS, patients);
}

export function getPatientById(id: string): Patient | undefined {
  return getPatients().find(p => p.id === id);
}

export function upsertPatient(patient: Patient): void {
  const list = getPatients();
  const idx = list.findIndex(p => p.id === patient.id);
  if (idx >= 0) list[idx] = patient;
  else list.push(patient);
  savePatients(list);
}

/** Active patients = not DISCHARGED and not DECEASED */
export function getActivePatients(): Patient[] {
  return getPatients().filter(p =>
    p.status !== 'DISCHARGED' && p.status !== 'DECEASED'
  );
}

export function getOccupiedRoomNumbers(): Set<number> {
  return new Set(getActivePatients().map(p => p.roomNumber).filter(n => n > 0));
}

export function getFreeRooms(total = TOTAL_ROOMS): number[] {
  const occupied = getOccupiedRoomNumbers();
  return Array.from({ length: total }, (_, i) => i + 1).filter(n => !occupied.has(n));
}

// ── Temperature Readings ─────────────────────────────────────
export function getReadings(): TemperatureReading[] {
  initDatabase();
  return read<TemperatureReading>(STORAGE_KEYS.READINGS);
}

export function saveReadings(readings: TemperatureReading[]): void {
  write(STORAGE_KEYS.READINGS, readings);
}

export function getReadingsForPatient(patientId: string): TemperatureReading[] {
  return getReadings()
    .filter(r => r.patientId === patientId)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function getTodaysReading(patientId: string, appDate?: string): TemperatureReading | null {
  const date = appDate ?? getAppDate();
  return getReadingsForPatient(patientId).find(r => r.recordedAt.startsWith(date)) ?? null;
}

export function addReading(reading: TemperatureReading): void {
  const list = getReadings();
  list.push(reading);
  saveReadings(list);
}

// ── Doctor Visits ─────────────────────────────────────────────
export function getVisits(): DoctorVisit[] {
  initDatabase();
  return read<DoctorVisit>(STORAGE_KEYS.VISITS);
}

export function saveVisits(visits: DoctorVisit[]): void {
  write(STORAGE_KEYS.VISITS, visits);
}

export function getVisitsForPatient(patientId: string): DoctorVisit[] {
  return getVisits()
    .filter(v => v.patientId === patientId)
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt));
}

export function getTodaysVisit(patientId: string, appDate?: string): DoctorVisit | null {
  const date = appDate ?? getAppDate();
  return getVisitsForPatient(patientId).find(v => v.visitedAt.startsWith(date)) ?? null;
}

export function addVisit(visit: DoctorVisit): void {
  const list = getVisits();
  list.push(visit);
  saveVisits(list);
}

// ── Users ─────────────────────────────────────────────────────
export function getUsers(): User[] {
  initDatabase();
  const users = read<User>(STORAGE_KEYS.USERS);
  return users.length > 0 ? users : SEED_USERS;
}

export function saveUsers(users: User[]): void {
  write(STORAGE_KEYS.USERS, users);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

// ── Audit Log ─────────────────────────────────────────────────
export function getAuditLog(): AuditLog[] {
  initDatabase();
  return read<AuditLog>(STORAGE_KEYS.AUDIT_LOG).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function addAuditEntry(entry: AuditLog): void {
  const list = read<AuditLog>(STORAGE_KEYS.AUDIT_LOG);
  list.push(entry);
  write(STORAGE_KEYS.AUDIT_LOG, list);
}

export function recordAudit(
  action: string,
  userId: string,
  userName: string,
  userRole: Role,
  patientId?: string | null,
  patientName?: string
): void {
  const entry: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userName,
    userRole,
    action,
    patientId: patientId ?? null,
    patientName,
    timestamp: getNowIso(), // R29
  };
  addAuditEntry(entry);
}

// ── Derived: daily task status ────────────────────────────────
export function getDailyTaskStatus(
  patientId: string,
  appDate: string
): { status: DailyTaskStatus; todaysReading: TemperatureReading | null; todaysVisit: DoctorVisit | null } {
  const todaysReading = getTodaysReading(patientId, appDate);
  const todaysVisit   = getTodaysVisit(patientId, appDate);

  let status: DailyTaskStatus;
  if (todaysVisit)          status = 'VISITED';
  else if (todaysReading)   status = 'MEASURED_AWAITING_DOCTOR';
  else                      status = 'NOT_MEASURED';

  return { status, todaysReading, todaysVisit };
}

/** Enriches a patient with its derived daily task status */
export function enrichPatient(patient: Patient, appDate: string): PatientWithDailyStatus {
  const { status, todaysReading, todaysVisit } = getDailyTaskStatus(patient.id, appDate);
  return { ...patient, dailyTaskStatus: status, todaysReading, todaysVisit };
}

/** Returns all active patients enriched with today's daily task status */
export function getActivePatientsEnriched(): PatientWithDailyStatus[] {
  const appDate = getAppDate();
  return getActivePatients().map(p => enrichPatient(p, appDate));
}

// ── Metrics helpers ───────────────────────────────────────────
export function getMetrics() {
  const all        = getPatients();
  const active     = all.filter(p => p.status !== 'DISCHARGED' && p.status !== 'DECEASED');
  const discharged = all.filter(p => p.status === 'DISCHARGED').length;
  const deceased   = all.filter(p => p.status === 'DECEASED').length;
  const closed     = discharged + deceased;
  const mortalityRate = closed > 0 ? (deceased / closed) * 100 : 0;
  const successRate   = closed > 0 ? (discharged / closed) * 100 : 0;
  const readyForDischarge   = active.filter(p => p.status === 'READY_FOR_DISCHARGE').length;
  const dischargeConfirmed  = active.filter(p => p.status === 'DISCHARGE_CONFIRMED').length;
  const occupied = getOccupiedRoomNumbers().size;

  const appDate   = getAppDate();
  const activeArr = getActivePatients();
  const measuredToday = activeArr.filter(p => getTodaysReading(p.id, appDate)).length;
  const visitedToday  = activeArr.filter(p => getTodaysVisit(p.id, appDate)).length;

  return {
    totalRooms: TOTAL_ROOMS,
    occupied,
    free: TOTAL_ROOMS - occupied,
    activePatients: active.length,
    discharged,
    deceased,
    closed,
    mortalityRate,
    successRate,
    readyForDischarge,
    dischargeConfirmed,
    measuredToday,
    visitedToday,
  };
}

// ── Status label helper ───────────────────────────────────────
export function statusLabel(s: PatientStatus): string {
  switch (s) {
    case 'ADMITTED':             return 'Admitted';
    case 'READY_FOR_DISCHARGE':  return 'Ready for Discharge';
    case 'DISCHARGE_CONFIRMED':  return 'Discharge Confirmed';
    case 'DISCHARGED':           return 'Discharged';
    case 'DECEASED':             return 'Deceased';
  }
}

// ══════════════════════════════════════════════════════════════
// ── DATA LAYER MUTATION OPERATIONS (with RBAC & Rules enforcement)
// ══════════════════════════════════════════════════════════════

/**
 * S4: Record Temperature Operation
 * Enforces R1, R2, R3, R4, R5, R6, R7, R10, R10a, R12, R16, R25, R29
 */
export function recordTemperatureOp(params: {
  patientId: string;
  valueCelsius: number;
  userId: string;
  userName: string;
  userRole: Role;
}): TemperatureReading {
  const { patientId, valueCelsius, userId, userName, userRole } = params;

  // RBAC check (R25)
  const isNurse = hasPermission(userRole, 'record_temperature');
  const isDoctorFallback = hasPermission(userRole, 'record_temperature_fallback');
  if (!isNurse && !isDoctorFallback) {
    throw new Error('Access denied: Role is not authorized to record temperatures.');
  }

  const patient = getPatientById(patientId);
  if (!patient) throw new Error('Patient not found.');

  // R12: Discharged or Deceased cannot receive readings
  if (patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new Error('Cannot record temperature for a discharged or deceased patient.');
  }

  // R6: Range validation (30.0 to 45.0 °C)
  if (isNaN(valueCelsius) || valueCelsius < TEMP_MIN || valueCelsius > TEMP_MAX) {
    throw new Error(`Temperature must be between ${TEMP_MIN}°C and ${TEMP_MAX}°C.`);
  }

  // R10: Hard block duplicate reading today
  const existingToday = getTodaysReading(patientId);
  if (existingToday) {
    throw new Error(
      `Temperature already recorded today (${existingToday.valueCelsius}°C) at ${existingToday.recordedAt.split('T')[1]?.substring(0, 5)}.`
    );
  }

  // R1, R2: Fever threshold calculation
  const isFever = valueCelsius >= FEVER_THRESHOLD;

  // R3, R4: feverFreeDays update
  let newFeverFreeDays = patient.feverFreeDays;
  if (!isFever) {
    newFeverFreeDays = Math.min(3, patient.feverFreeDays + 1);
  } else {
    newFeverFreeDays = 0;
  }

  // R7: When feverFreeDays reaches 3, automatically set status to READY_FOR_DISCHARGE
  let newStatus = patient.status;
  if (newFeverFreeDays >= 3 && patient.status === 'ADMITTED') {
    newStatus = 'READY_FOR_DISCHARGE';
  }

  // Create reading record
  const reading: TemperatureReading = {
    id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientId,
    valueCelsius,
    isFever,
    recordedAt: getNowIso(), // R29
    recordedBy: userId,
    recordedByRole: userRole,
  };

  addReading(reading);

  // Update patient record
  upsertPatient({
    ...patient,
    feverFreeDays: newFeverFreeDays,
    status: newStatus,
  });

  // R16: Write audit log
  const feverText = isFever ? `FEVER (≥${FEVER_THRESHOLD}°C)` : 'Normal (fever-free)';
  recordAudit(
    `Recorded temperature ${valueCelsius.toFixed(1)}°C - ${feverText}${
      userRole === 'DOCTOR' ? ' [Doctor Fallback]' : ''
    }. Fever-free days: ${newFeverFreeDays}/3.${
      newStatus === 'READY_FOR_DISCHARGE' ? ' Status changed to READY_FOR_DISCHARGE.' : ''
    }`,
    userId,
    userName,
    userRole,
    patient.id,
    patient.name
  );

  return reading;
}

/**
 * S6: Log Doctor Visit Operation
 * Enforces R11, R12, R16, R25, R29
 */
export function logDoctorVisitOp(params: {
  patientId: string;
  notes: string;
  userId: string;
  userName: string;
  userRole: Role;
}): DoctorVisit {
  const { patientId, notes, userId, userName, userRole } = params;

  // RBAC check (R25)
  if (!hasPermission(userRole, 'log_visit')) {
    throw new Error('Access denied: Only DOCTOR role may log patient visits.');
  }

  const patient = getPatientById(patientId);
  if (!patient) throw new Error('Patient not found.');

  // R12: Discharged or Deceased cannot receive visits
  if (patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new Error('Cannot log visit for a discharged or deceased patient.');
  }

  // R11: Hard block if today's temperature reading does not exist
  const todaysReading = getTodaysReading(patientId);
  if (!todaysReading) {
    throw new Error('Cannot log visit - temperature has not been recorded for this patient today.');
  }

  if (!notes || notes.trim().length === 0) {
    throw new Error('Clinical visit notes are required.');
  }

  const visit: DoctorVisit = {
    id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientId,
    doctorId: userId,
    notes: notes.trim(),
    visitedAt: getNowIso(), // R29
  };

  addVisit(visit);

  // R16: Audit log
  recordAudit(
    `Logged clinical visit notes. Observed temp: ${todaysReading.valueCelsius}°C.`,
    userId,
    userName,
    userRole,
    patient.id,
    patient.name
  );

  return visit;
}

/**
 * S7: Confirm Discharge Operation (Doctor only)
 * Enforces R8, R16, R25
 */
export function confirmDischargeOp(params: {
  patientId: string;
  userId: string;
  userName: string;
  userRole: Role;
}): Patient {
  const { patientId, userId, userName, userRole } = params;

  if (!hasPermission(userRole, 'confirm_discharge')) {
    throw new Error('Access denied: Only DOCTOR may confirm patient discharge.');
  }

  const patient = getPatientById(patientId);
  if (!patient) throw new Error('Patient not found.');

  if (patient.status !== 'READY_FOR_DISCHARGE') {
    throw new Error(`Patient must be READY_FOR_DISCHARGE to confirm. Current status: ${patient.status}`);
  }

  const updated: Patient = {
    ...patient,
    status: 'DISCHARGE_CONFIRMED',
  };

  upsertPatient(updated);

  recordAudit(
    `Confirmed medical discharge readiness (moved to DISCHARGE_CONFIRMED queue).`,
    userId,
    userName,
    userRole,
    patient.id,
    patient.name
  );

  return updated;
}

/**
 * S7: Process Final Discharge Operation (Admin only)
 * Enforces R9, R12, R16, R25
 */
export function processFinalDischargeOp(params: {
  patientId: string;
  userId: string;
  userName: string;
  userRole: Role;
}): Patient {
  const { patientId, userId, userName, userRole } = params;

  if (!hasPermission(userRole, 'process_discharge')) {
    throw new Error('Access denied: Only ADMIN may process final discharge.');
  }

  const patient = getPatientById(patientId);
  if (!patient) throw new Error('Patient not found.');

  if (patient.status !== 'DISCHARGE_CONFIRMED') {
    throw new Error(`Patient must have status DISCHARGE_CONFIRMED. Current status: ${patient.status}`);
  }

  const freedRoom = patient.roomNumber;
  const updated: Patient = {
    ...patient,
    status: 'DISCHARGED',
    roomNumber: 0, // room freed immediately
    outcomeAt: getNowIso(),
  };

  upsertPatient(updated);

  recordAudit(
    `Processed final discharge. Room ${freedRoom} is now freed and available for admission.`,
    userId,
    userName,
    userRole,
    patient.id,
    patient.name
  );

  return updated;
}

/**
 * S5 / S7: Mark Patient Deceased Operation (Doctor only)
 * Enforces R15, R16, R25
 */
export function markPatientDeceasedOp(params: {
  patientId: string;
  notes?: string;
  userId: string;
  userName: string;
  userRole: Role;
}): Patient {
  const { patientId, notes, userId, userName, userRole } = params;

  if (!hasPermission(userRole, 'mark_deceased')) {
    throw new Error('Access denied: Only DOCTOR may record patient death.');
  }

  const patient = getPatientById(patientId);
  if (!patient) throw new Error('Patient not found.');

  if (patient.status === 'DISCHARGED' || patient.status === 'DECEASED') {
    throw new Error(`Patient is already closed (${patient.status}).`);
  }

  const freedRoom = patient.roomNumber;
  const updated: Patient = {
    ...patient,
    status: 'DECEASED',
    roomNumber: 0, // room freed immediately
    outcomeAt: getNowIso(),
  };

  upsertPatient(updated);

  recordAudit(
    `Marked patient as DECEASED. Room ${freedRoom} freed immediately.${notes ? ` Notes: ${notes}` : ''}`,
    userId,
    userName,
    userRole,
    patient.id,
    patient.name
  );

  return updated;
}

/**
 * S8: Admit Patient Operation (Admin only)
 * Enforces R13, R14, R16, R25, R29
 */
export function admitPatientOp(params: {
  name: string;
  age: number;
  gender: Gender;
  contact: string;
  roomNumber: number;
  userId: string;
  userName: string;
  userRole: Role;
}): Patient {
  const { name, age, gender, contact, roomNumber, userId, userName, userRole } = params;

  if (!hasPermission(userRole, 'admit_patient')) {
    throw new Error('Access denied: Only ADMIN may admit new patients.');
  }

  if (!name.trim()) throw new Error('Patient name is required.');
  if (isNaN(age) || age < 0 || age > 130) throw new Error('Valid age is required.');
  if (!contact.trim()) throw new Error('Contact number is required.');

  // R13: Capacity check
  const activePatients = getActivePatients();
  if (activePatients.length >= TOTAL_ROOMS) {
    throw new Error(`All ${TOTAL_ROOMS} rooms are currently occupied. Admission is blocked.`);
  }

  // R14: Check specific room is free
  const freeRooms = getFreeRooms();
  if (!freeRooms.includes(roomNumber)) {
    throw new Error(`Room ${roomNumber} is already occupied. Please select an available room.`);
  }

  const newPatient: Patient = {
    id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    age,
    gender,
    contact: contact.trim(),
    roomNumber,
    admittedAt: getNowIso(),
    status: 'ADMITTED',
    feverFreeDays: 0,
    outcomeAt: null,
  };

  upsertPatient(newPatient);

  recordAudit(
    `Admitted new patient to Room ${roomNumber}.`,
    userId,
    userName,
    userRole,
    newPatient.id,
    newPatient.name
  );

  return newPatient;
}

/**
 * Reset Demo Data Operation (Admin only)
 * Enforces R27, R25
 */
export function resetDemoDataOp(params: {
  userId: string;
  userName: string;
  userRole: Role;
}): void {
  const { userId, userName, userRole } = params;

  if (!hasPermission(userRole, 'reset_demo_data')) {
    throw new Error('Access denied: Only ADMIN may reset demo data.');
  }

  generateSeed();
  resetAppDate();

  recordAudit(
    'Reset demo data restored seed dataset (70 active, 22 closed cases) and reset app date.',
    userId,
    userName,
    userRole,
    null
  );

  window.dispatchEvent(new Event('app_data_changed'));
}
