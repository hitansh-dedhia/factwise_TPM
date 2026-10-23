// All TypeScript interfaces for the data model (Section 4 of REQUIREMENTS.md)

export type Role = 'NURSE' | 'DOCTOR' | 'ADMIN' | 'HEAD_DOCTOR';

export type PatientStatus =
  | 'ADMITTED'
  | 'READY_FOR_DISCHARGE'
  | 'DISCHARGE_CONFIRMED'
  | 'DISCHARGED'
  | 'DECEASED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/** Derived per patient per calendar day — never stored (Section 6) */
export type DailyTaskStatus =
  | 'NOT_MEASURED'
  | 'MEASURED_AWAITING_DOCTOR'
  | 'VISITED';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  contact: string;
  roomNumber: number; // 1-74 for active; 0 for historical closed cases
  admittedAt: string; // ISO datetime (local, YYYY-MM-DDTHH:MM:SS)
  status: PatientStatus;
  feverFreeDays: number; // 0-3; system-managed, never user-typed
  outcomeAt: string | null; // set when DISCHARGED or DECEASED
}

export interface TemperatureReading {
  id: string;
  patientId: string;
  valueCelsius: number;
  isFever: boolean; // valueCelsius >= FEVER_THRESHOLD (R2)
  recordedAt: string; // ISO datetime (local)
  recordedBy: string; // userId
  recordedByRole: Role;
}

export interface DoctorVisit {
  id: string;
  patientId: string;
  doctorId: string; // userId
  notes: string;
  visitedAt: string; // ISO datetime (local)
}

export interface User {
  id: string;
  name: string;
  username: string; // login credential
  password: string; // plain text — demo only (R18)
  role: Role;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  patientId: string | null;
  patientName?: string;
  timestamp: string; // ISO datetime (local)
}

/** Minimal session stored in sessionStorage per tab (R30) */
export interface Session {
  userId: string;
  name: string;
  role: Role;
}

/** Composite used by UI — Patient with derived daily status */
export interface PatientWithDailyStatus extends Patient {
  dailyTaskStatus: DailyTaskStatus;
  todaysReading: TemperatureReading | null;
  todaysVisit: DoctorVisit | null;
}
