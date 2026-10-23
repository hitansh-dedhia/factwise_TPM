// R25: Single source of truth for all role-based permissions.
// Route guards, menu filters, and data-layer checks ALL import from here.
// Never scatter role checks across components — import hasPermission() instead.

import type { Role } from './types';

export type Action =
  | 'view_patient_list'
  | 'view_patient_history'
  | 'view_room_occupancy'
  | 'view_to_be_measured_list'
  | 'record_temperature'          // NURSE primary
  | 'record_temperature_fallback' // DOCTOR fallback (R10a)
  | 'view_to_be_visited_list'
  | 'log_visit'
  | 'confirm_discharge'
  | 'mark_deceased'
  | 'view_discharge_queue'
  | 'admit_patient'
  | 'process_discharge'
  | 'view_dashboard'
  | 'view_audit_log'
  | 'reset_demo_data';

// Permissions matrix from REQUIREMENTS.md §9
const PERMISSIONS: Record<Role, Action[]> = {
  NURSE: [
    'view_patient_list',
    'view_patient_history',
    'view_room_occupancy',
    'view_to_be_measured_list',
    'record_temperature',
  ],
  DOCTOR: [
    'view_patient_list',
    'view_patient_history',
    'view_room_occupancy',
    'view_to_be_visited_list',
    'record_temperature_fallback',
    'log_visit',
    'confirm_discharge',
    'mark_deceased',
    'view_discharge_queue',
  ],
  ADMIN: [
    'view_patient_list',
    'view_patient_history',
    'view_room_occupancy',
    'view_discharge_queue',
    'admit_patient',
    'process_discharge',
    'view_dashboard',
    'view_audit_log',
    'reset_demo_data',
  ],
  HEAD_DOCTOR: [
    'view_patient_list',
    'view_patient_history',
    'view_room_occupancy',
    'view_to_be_visited_list',
    'view_discharge_queue',
    'view_dashboard',
    'view_audit_log',
  ],
};

export function hasPermission(role: Role | null | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(action) ?? false;
}

/** Default home route per role after login */
export function getRoleHomeRoute(role: Role): string {
  switch (role) {
    case 'NURSE':       return '/patients';
    case 'DOCTOR':      return '/patients';
    case 'ADMIN':       return '/dashboard';
    case 'HEAD_DOCTOR': return '/dashboard';
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  NURSE:       'Nurse',
  DOCTOR:      'Doctor',
  ADMIN:       'Admin',
  HEAD_DOCTOR: 'Head Doctor',
};

export const ROLE_COLORS: Record<Role, string> = {
  NURSE:       'text-teal-400 bg-teal-400/10 border-teal-400/30',
  DOCTOR:      'text-blue-400 bg-blue-400/10 border-blue-400/30',
  ADMIN:       'text-amber-400 bg-amber-400/10 border-amber-400/30',
  HEAD_DOCTOR: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};
