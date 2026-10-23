// Seed data generator (R18, tech-stack spec)
// All IDs are deterministic strings — never random — so reset always gives the same data.
// Realistic Indian names, ages and genders; not hand-typed records.

import { STORAGE_KEYS, SEED_DATE, FEVER_THRESHOLD } from './constants';
import type { Patient, TemperatureReading, DoctorVisit, User, AuditLog, PatientStatus } from './types';

// ── Seed users (R18) ─────────────────────────────────────────
export const SEED_USERS: User[] = [
  { id: 'u-nurse1', name: 'Meera Iyer',        username: 'nurse1',  password: 'nurse123',  role: 'NURSE' },
  { id: 'u-nurse2', name: 'Sunita Bose',        username: 'nurse2',  password: 'nurse123',  role: 'NURSE' },
  { id: 'u-doc1',   name: 'Dr. Arjun Rao',      username: 'doctor1', password: 'doctor123', role: 'DOCTOR' },
  { id: 'u-doc2',   name: 'Dr. Priya Menon',    username: 'doctor2', password: 'doctor123', role: 'DOCTOR' },
  { id: 'u-admin1', name: 'Rajesh Patel',        username: 'admin1',  password: 'admin123',  role: 'ADMIN' },
  { id: 'u-hd1',    name: 'Dr. Venkat Sharma',   username: 'head1',   password: 'head123',   role: 'HEAD_DOCTOR' },
];

// ── Name pools ────────────────────────────────────────────────
const MALE_NAMES = [
  'Ramesh Sharma','Suresh Verma','Mahesh Gupta','Rajesh Patel','Dinesh Singh',
  'Naresh Kumar','Mukesh Yadav','Rakesh Reddy','Amit Nair','Anil Pillai',
  'Arun Menon','Ajay Iyer','Arjun Rao','Rohit Mishra','Rahul Joshi',
  'Vivek Tiwari','Vijay Pandey','Sanjay Dubey','Vinay Shukla','Manoj Aggarwal',
  'Deepak Malhotra','Santosh Chopra','Mohan Saxena','Rohan Srivastava','Ravi Chaudhary',
  'Suraj Bose','Anand Chatterjee','Prasad Mukherjee','Yogesh Ghosh','Venkat Banerjee',
  'Balaji Tripathi','Kiran Kulkarni','Ganesh Desai','Pramod Mehta','Kamlesh Shah',
  'Vikram Jain','Sohan Agarwal','Devendra Bhatt','Biren Parikh','Hemant Thakur',
];
const FEMALE_NAMES = [
  'Priya Sharma','Meera Verma','Sunita Gupta','Kavitha Patel','Lakshmi Singh',
  'Ananya Kumar','Divya Yadav','Pooja Reddy','Rekha Nair','Shalini Pillai',
  'Nandini Menon','Usha Iyer','Geetha Rao','Padma Mishra','Saritha Joshi',
  'Manjula Tiwari','Radha Pandey','Sarika Dubey','Deepa Shukla','Nalini Aggarwal',
  'Aruna Malhotra','Sneha Chopra','Preeti Saxena','Vandana Srivastava','Asha Chaudhary',
  'Pushpa Bose','Kamala Chatterjee','Revathi Mukherjee','Shobha Ghosh','Jaya Banerjee',
  'Anita Tripathi','Sushma Kulkarni',
];

// ── Deterministic helpers ─────────────────────────────────────
function det(n: number): number { return Math.abs((1664525 * n + 1013904223) & 0x7fffffff); }
function drand(n: number): number { return det(n) / 0x7fffffff; }
function contact(n: number): string {
  const digits = (700000000 + det(n) % 299999999).toString();
  return `+91 9${digits}`;
}

function dateOffset(base: string, daysBack: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() - daysBack);
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function ts(date: string, hour: number, min: number): string {
  return `${date}T${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
}

function pid(room: number): string { return `p-room${room.toString().padStart(3, '0')}`; }
function rid(n: number): string    { return `r-${n.toString().padStart(5, '0')}`; }
function vid(n: number): string    { return `v-${n.toString().padStart(5, '0')}`; }
function aid(n: number): string    { return `a-${n.toString().padStart(5, '0')}`; }
function cpid(n: number): string   { return `p-closed${n.toString().padStart(3, '0')}`; }

// ── Main generator ────────────────────────────────────────────
export function generateSeed(): void {
  const patients:  Patient[]            = [];
  const readings:  TemperatureReading[] = [];
  const visits:    DoctorVisit[]        = [];
  const auditLog:  AuditLog[]           = [];
  let   rc = 1; // reading counter
  let   vc = 1; // visit counter
  let   ac = 1; // audit counter

  const NURSE_ID   = 'u-nurse1';
  const NURSE_NAME = 'Meera Iyer';
  const DOC_ID     = 'u-doc1';
  const DOC_NAME   = 'Dr. Arjun Rao';
  const ADMIN_ID   = 'u-admin1';
  const ADMIN_NAME = 'Rajesh Patel';

  function pushReading(
    patientId: string, date: string, val: number, h: number, m: number,
    by = NURSE_ID, _byName = NURSE_NAME, byRole: 'NURSE' | 'DOCTOR' = 'NURSE'
  ) {
    readings.push({
      id: rid(rc++), patientId,
      valueCelsius: val, isFever: val >= FEVER_THRESHOLD,
      recordedAt: ts(date, h, m), recordedBy: by, recordedByRole: byRole,
    });
  }

  function pushVisit(patientId: string, date: string, notes: string, h: number, m: number) {
    visits.push({ id: vid(vc++), patientId, doctorId: DOC_ID, notes, visitedAt: ts(date, h, m) });
  }

  function pushAudit(action: string, patientId: string | null, patientName: string | undefined,
    userId: string, userName: string, userRole: 'NURSE' | 'DOCTOR' | 'ADMIN', date: string, h: number, m: number) {
    auditLog.push({
      id: aid(ac++), userId, userName, userRole, action,
      patientId, patientName, timestamp: ts(date, h, m),
    });
  }

  function addPatient(
    room: number, status: PatientStatus, ffd: number, admittedDaysAgo: number,
    isMale: boolean, nameIdx: number, ageBase: number, ageRange: number, seed: number,
    outcomeAt?: string
  ): string {
    const nameArr = isMale ? MALE_NAMES : FEMALE_NAMES;
    const name = nameArr[nameIdx % nameArr.length];
    const age  = ageBase + (det(seed) % ageRange);
    const p: Patient = {
      id: pid(room),
      name, age,
      gender: isMale ? 'MALE' : 'FEMALE',
      contact: contact(seed),
      roomNumber: room,
      admittedAt: ts(dateOffset(SEED_DATE, admittedDaysAgo), 10, 0),
      status, feverFreeDays: ffd,
      outcomeAt: outcomeAt ?? null,
    };
    patients.push(p);
    pushAudit('Patient admitted', p.id, name, ADMIN_ID, ADMIN_NAME, 'ADMIN',
      dateOffset(SEED_DATE, admittedDaysAgo), 10, 5);
    return p.id;
  }

  // ══════════════════════════════════════════════════════════════
  // ROOMS 1–5: READY_FOR_DISCHARGE (feverFreeDays=3, NOT_MEASURED today)
  // ══════════════════════════════════════════════════════════════
  for (let r = 1; r <= 5; r++) {
    const isMale = drand(r * 17) > 0.5;
    const id = addPatient(r, 'READY_FOR_DISCHARGE', 3, 12 + r, isMale, r * 3, 30, 45, r * 41);
    // 3 consecutive non-fever days (day-3, day-2, day-1); no reading today
    pushReading(id, dateOffset(SEED_DATE, 3), 36.6 + (r * 0.1), 8, 20 + r);
    pushReading(id, dateOffset(SEED_DATE, 2), 36.8 + (r * 0.05), 8, 25 + r);
    pushReading(id, dateOffset(SEED_DATE, 1), 37.0 + (r * 0.05), 8, 30 + r);
    pushAudit('Patient auto-flagged READY_FOR_DISCHARGE', id, patients.at(-1)!.name,
      'u-system', 'System', 'NURSE', dateOffset(SEED_DATE, 1), 8, 35);
  }

  // ══════════════════════════════════════════════════════════════
  // ROOMS 6–8: DISCHARGE_CONFIRMED (feverFreeDays=3, NOT_MEASURED today)
  // ══════════════════════════════════════════════════════════════
  for (let r = 6; r <= 8; r++) {
    const isMale = drand(r * 19) > 0.45;
    const id = addPatient(r, 'DISCHARGE_CONFIRMED', 3, 14 + r, isMale, r * 5, 35, 40, r * 43);
    pushReading(id, dateOffset(SEED_DATE, 4), 36.5 + (r * 0.1), 8, 15);
    pushReading(id, dateOffset(SEED_DATE, 3), 37.0, 8, 20);
    pushReading(id, dateOffset(SEED_DATE, 2), 36.8, 8, 25);
    pushAudit('Discharge confirmed by doctor', id, patients.at(-1)!.name,
      DOC_ID, DOC_NAME, 'DOCTOR', dateOffset(SEED_DATE, 1), 11, 0);
  }

  // ══════════════════════════════════════════════════════════════
  // ROOMS 9–25: ADMITTED, NOT_MEASURED today — ffd 0/1/2 mix
  // ══════════════════════════════════════════════════════════════
  for (let r = 9; r <= 25; r++) {
    const i = r - 9; // 0..16
    const ffd = i < 7 ? 0 : i < 12 ? 1 : 2;
    const isMale = drand(r * 23) > 0.48;
    const id = addPatient(r, 'ADMITTED', ffd, 7 + (r % 14), isMale, (r * 7) % 40, 20, 60, r * 47);
    if (ffd >= 2) pushReading(id, dateOffset(SEED_DATE, 2), 37.0 + (r % 5) * 0.06, 8, r % 60);
    if (ffd >= 1) pushReading(id, dateOffset(SEED_DATE, 1), 37.2 + (r % 4) * 0.07, 8, 10 + r % 40);
    if (ffd === 0 && r % 3 === 0) {
      // add a fever reading yesterday to explain ffd=0
      pushReading(id, dateOffset(SEED_DATE, 1), 38.5 + (r % 5) * 0.2, 8, 30);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ROOMS 26–45: ADMITTED, MEASURED_AWAITING_DOCTOR (reading today, no visit)
  // ══════════════════════════════════════════════════════════════
  for (let r = 26; r <= 45; r++) {
    const hasFever = (r % 5 === 0); // ~4 patients with fever
    const todayTemp = hasFever ? 38.2 + (r % 4) * 0.25 : 36.5 + (r % 10) * 0.15;
    const ffd = hasFever ? 0 : Math.min(2, (r % 3));
    const isMale = drand(r * 29) > 0.5;
    const id = addPatient(r, 'ADMITTED', ffd, 8 + (r % 12), isMale, (r * 11) % 40, 18, 65, r * 53);
    const readH = 7 + (r % 3); const readM = (r * 7) % 60;
    pushReading(id, SEED_DATE, todayTemp, readH, readM);
    if (ffd >= 1) pushReading(id, dateOffset(SEED_DATE, 1), 37.1, 8, 5);
    if (ffd >= 2) pushReading(id, dateOffset(SEED_DATE, 2), 36.9, 8, 10);
  }

  // ══════════════════════════════════════════════════════════════
  // ROOMS 46–60: ADMITTED, VISITED today (reading + visit)
  // ══════════════════════════════════════════════════════════════
  for (let r = 46; r <= 60; r++) {
    const hasFever = (r % 5 === 0);
    const todayTemp = hasFever ? 38.3 + (r % 3) * 0.3 : 36.6 + (r % 8) * 0.1;
    const ffd = hasFever ? 0 : Math.min(2, (r % 3));
    const isMale = drand(r * 31) > 0.5;
    const id = addPatient(r, 'ADMITTED', ffd, 6 + (r % 16), isMale, (r * 13) % 40, 22, 60, r * 59);
    const readH = 8; const readM = (r * 5) % 60;
    pushReading(id, SEED_DATE, todayTemp, readH, readM);
    const visitH = 11; const visitM = (r * 7) % 60;
    const notes = hasFever
      ? `Patient febrile at ${todayTemp.toFixed(1)}°C. Prescribed antipyretics and increased fluid intake. Monitor q4h.`
      : `Temperature within normal range (${todayTemp.toFixed(1)}°C). Patient responding well. Continue current regimen.`;
    pushVisit(id, SEED_DATE, notes, visitH, visitM);
    pushAudit('Doctor visit recorded', id, patients.at(-1)!.name, DOC_ID, DOC_NAME, 'DOCTOR', SEED_DATE, visitH, visitM);
    if (ffd >= 1) pushReading(id, dateOffset(SEED_DATE, 1), 37.1, 8, 15);
    if (ffd >= 2) pushReading(id, dateOffset(SEED_DATE, 2), 36.9, 8, 20);
  }

  // ══════════════════════════════════════════════════════════════
  // ROOMS 61–70: ADMITTED, NOT_MEASURED (fill to 70 total active)
  // ══════════════════════════════════════════════════════════════
  for (let r = 61; r <= 70; r++) {
    const ffd = (r % 3);
    const isMale = drand(r * 37) > 0.5;
    const id = addPatient(r, 'ADMITTED', ffd, 3 + (r % 8), isMale, (r * 17) % 40, 25, 55, r * 67);
    if (ffd >= 1) pushReading(id, dateOffset(SEED_DATE, 1), 37.0 + (r % 5) * 0.08, 8, 40);
    if (ffd >= 2) pushReading(id, dateOffset(SEED_DATE, 2), 36.8, 8, 45);
  }

  // ══════════════════════════════════════════════════════════════
  // CLOSED CASES: 18 DISCHARGED + 4 DECEASED
  // ══════════════════════════════════════════════════════════════
  const closedRaw = [
    { name:'Ramakrishna Pillai',  male:true,  age:55 },
    { name:'Savitha Nair',        male:false, age:42 },
    { name:'Venkatesh Rao',       male:true,  age:68 },
    { name:'Geetha Menon',        male:false, age:35 },
    { name:'Subramaniam Iyer',    male:true,  age:72 },
    { name:'Padmavathi Singh',    male:false, age:49 },
    { name:'Krishnamurthy Sharma',male:true,  age:61 },
    { name:'Sarala Verma',        male:false, age:38 },
    { name:'Narayanan Gupta',     male:true,  age:45 },
    { name:'Indira Patel',        male:false, age:53 },
    { name:'Balasubramanian Kumar',male:true, age:67 },
    { name:'Meenakshi Yadav',     male:false, age:29 },
    { name:'Chandrasekhar Reddy', male:true,  age:58 },
    { name:'Ambika Nair',         male:false, age:44 },
    { name:'Jagannathan Pillai',  male:true,  age:70 },
    { name:'Sudha Menon',         male:false, age:36 },
    { name:'Venkataraman Iyer',   male:true,  age:63 },
    { name:'Lalitha Rao',         male:false, age:47 },
    // 4 deceased (indices 18-21)
    { name:'Muthukrishnan Sharma',male:true,  age:78 },
    { name:'Kalyani Verma',       male:false, age:71 },
    { name:'Subbarayan Gupta',    male:true,  age:82 },
    { name:'Parvathi Patel',      male:false, age:75 },
  ];

  closedRaw.forEach((cp, idx) => {
    const isDeceased = idx >= 18;
    const status: PatientStatus = isDeceased ? 'DECEASED' : 'DISCHARGED';
    const daysAgo = 3 + idx * 2;
    const id = cpid(idx + 1);
    patients.push({
      id, name: cp.name, age: cp.age,
      gender: cp.male ? 'MALE' : 'FEMALE',
      contact: contact(idx + 200),
      roomNumber: 0, // historical — room freed
      admittedAt: ts(dateOffset(SEED_DATE, daysAgo + 12), 9, 0),
      status, feverFreeDays: isDeceased ? 0 : 3,
      outcomeAt: ts(dateOffset(SEED_DATE, daysAgo), 14, 0),
    });
    // Historical readings
    for (let d = daysAgo + 8; d >= daysAgo + 1; d--) {
      const isFeverDay = isDeceased ? (d >= daysAgo + 3) : (d > daysAgo + 3);
      const val = isFeverDay ? 38.5 + (d % 3) * 0.3 : 36.6 + (d % 5) * 0.1;
      pushReading(id, dateOffset(SEED_DATE, d), val, 8, 0);
    }
    // Outcome audit
    pushAudit(
      isDeceased ? 'Patient marked DECEASED' : 'Patient DISCHARGED - room freed',
      id, cp.name,
      isDeceased ? DOC_ID : ADMIN_ID,
      isDeceased ? DOC_NAME : ADMIN_NAME,
      isDeceased ? 'DOCTOR' : 'ADMIN',
      dateOffset(SEED_DATE, daysAgo), 14, 5
    );
  });

  // ── Write everything to localStorage ─────────────────────────
  localStorage.setItem(STORAGE_KEYS.PATIENTS,  JSON.stringify(patients));
  localStorage.setItem(STORAGE_KEYS.READINGS,  JSON.stringify(readings));
  localStorage.setItem(STORAGE_KEYS.VISITS,    JSON.stringify(visits));
  localStorage.setItem(STORAGE_KEYS.USERS,     JSON.stringify(SEED_USERS));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog));
  localStorage.setItem(STORAGE_KEYS.APP_DATE,  SEED_DATE);
}
