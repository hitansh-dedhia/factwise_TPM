// R1: Fever threshold — defined ONCE here. Change only this value to recalibrate.
export const FEVER_THRESHOLD = 38.0; // °C

// R6: Valid temperature input range
export const TEMP_MIN = 30.0; // °C
export const TEMP_MAX = 45.0; // °C

// Facility capacity (R13)
export const TOTAL_ROOMS = 74;

// Benchmark rates — Section 10
export const MORTALITY_BENCHMARK = 15; // %
export const SUCCESS_BENCHMARK   = 85; // %

// localStorage keys (all app data — shared across tabs, R32)
export const STORAGE_KEYS = {
  PATIENTS:  'qf_patients',
  READINGS:  'qf_temp_readings',
  VISITS:    'qf_doctor_visits',
  AUDIT_LOG: 'qf_audit_log',
  USERS:     'qf_users',
  APP_DATE:  'qf_app_date',
} as const;

// sessionStorage key (per-tab session, R30)
export const SESSION_KEY = 'qf_session';

// SEED_DATE — the canonical "today" for demo data (R27, R29)
export const SEED_DATE = '2026-10-23';
