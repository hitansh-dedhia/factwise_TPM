# SCREENS - Quarantine Facility Management App

> For each screen: purpose, roles, what it shows, actions, rule IDs implemented.
> Permissions matrix lives in REQUIREMENTS.md Section 9 and src/lib/permissions.ts.

---

## Roles (summary)

| Role | Home screen | Description |
|------|-------------|-------------|
| NURSE | /patients | Records daily temperatures; sees only unmeasured patients by default |
| DOCTOR | /patients | Logs visits; sees only measured-awaiting-doctor patients by default |
| ADMIN | /dashboard | Admits patients, processes final discharges, views metrics and audit log |
| HEAD_DOCTOR | /dashboard | Read-only analytics; sees everything, writes nothing |

---

## Permissions Matrix (reference - defined in src/lib/permissions.ts)

| Action | NURSE | DOCTOR | ADMIN | HEAD_DOCTOR |
|--------|:-----:|:------:|:-----:|:-----------:|
| View patient list | Y | Y | Y | Y |
| View patient history | Y | Y | Y | Y |
| View room occupancy | Y | Y | Y | Y |
| View to-be-measured list | Y | - | - | - |
| Record temperature (primary) | Y | fallback* | - | - |
| View to-be-visited list | - | Y | - | Y |
| Log doctor visit | - | Y | - | - |
| Confirm discharge (READY to CONFIRMED) | - | Y | - | - |
| Mark patient deceased | - | Y | - | - |
| View discharge queue | - | Y | Y | Y |
| Admit new patient | - | - | Y | - |
| Process final discharge (CONFIRMED to DISCHARGED) | - | - | Y | - |
| View dashboard / metrics | - | - | Y | Y |
| View audit log | - | - | Y | Y |
| Reset demo data | - | - | Y | - |

*DOCTOR may record a temperature only when none exists today for that patient (R10a).

---

## S1. Login

**Purpose:** Authenticate users; redirect to role-specific home screen on success.
**Roles:** Public (unauthenticated only).

**Shows:**
- App logo and name (ViralTrack)
- Username and password fields
- "Sign In" submit button
- Inline error message on bad credentials
- "Demo accounts" panel (amber-tinted, labelled demo-only): lists all seeded users with username, password and role; clicking any row auto-fills the form

**Actions:**
- Submit form -> validate against seeded users in data layer -> create session in sessionStorage -> redirect to role home (R17, R19)
- Display error on invalid credentials
- Auto-fill form on demo-account click (R21)

**Rules implemented:** R17, R18, R19, R21, R22, R30

---

## S2. App Shell

**Purpose:** Persistent wrapper around all authenticated screens. Provides navigation, header, demo tools, and error pages.
**Roles:** All authenticated roles (content filtered per role).

**Shows:**
- **Left sidebar:**
  - Logo + app name at top
  - Role-filtered navigation links (R24)
  - "DEMO TOOLS" section (labelled, clearly separated): "Reset demo data" button + "Simulate next day" button (R26)
  - Current user name, role badge, and Logout button at bottom
- **Top header strip:** Current app date pill (R29)
- **Main content area:** <Outlet /> renders the active page
- **Access denied page:** Shown when a logged-in user navigates to a route their role cannot access (R23)
- **Not found page:** Shown for unknown routes

**Actions:**
- Logout -> clear sessionStorage session -> redirect to /login (R20, R33)
- Reset demo data -> confirmation dialog -> restore seed + reset app date (ADMIN only write, R27, R25)
- Simulate next day -> advance app date by 1 day, no data changes (R28, R29)
- Navigate via sidebar (filtered by role, R24)
- Cross-tab: storage event listener refreshes data in other open tabs (R32)

**Rules implemented:** R20, R22, R23, R24, R26, R27, R28, R29, R30, R31, R32, R33

---

## S3. Patient List

**Purpose:** Central operational view of all 70 active patients; starting point for daily workflows.
**Roles:** NURSE, DOCTOR, ADMIN, HEAD_DOCTOR.

**Shows:**
- Table columns: Room, Name, Age/Gender, Days since admission, feverFreeDays, Patient status badge, Today's task status badge (NOT_MEASURED / MEASURED_AWAITING_DOCTOR / VISITED)
- Search bar: instant client-side filter by patient name or room number
- Filter tabs: All | Not measured | Measured, awaiting doctor | Visited
- Default filter: NURSE -> Not measured; DOCTOR -> Measured, awaiting doctor; ADMIN/HEAD_DOCTOR -> All
- Role-specific inline action buttons per row:
  - NURSE: "Record temp" (disabled if already recorded today)
  - DOCTOR: "Log visit" (disabled if no reading today or already visited today)
  - ADMIN: "Process discharge" (only on DISCHARGE_CONFIRMED rows)

**Actions:**
- Search (instant, client-side)
- Filter by daily task status
- Click row -> navigate to Patient Detail S5
- Record temperature (NURSE / DOCTOR fallback) -> navigate to S4
- Log visit (DOCTOR) -> navigate to S6

**Rules implemented:** R7, R10, R10a, R11, R12, R24

---

## S4. Record Temperature

**Purpose:** Record a single daily temperature reading for a patient.
**Roles:** NURSE (primary); DOCTOR (fallback - only when no reading exists today for that patient).

**Shows:**
- Patient header: name, room, status, feverFreeDays
- If already recorded today: info block "Temperature already recorded today at HH:MM by [Name] ([value] C)" - no further input possible
- Last 5 readings history (date, value, isFever indicator)
- Numeric input for temperature in Celsius (if recording allowed)
- Save button

**Actions:**
- Validate range 30-45 C; reject outside range with inline error (R6)
- Hard block if today's reading already exists (R10)
- On save:
  - Set isFever = value >= 38.0 C (R1, R2)
  - If not fever: feverFreeDays += 1 (R3); if fever: feverFreeDays = 0 (R4)
  - If feverFreeDays reaches 3: patient status -> READY_FOR_DISCHARGE (R7)
  - Write audit log entry (R16)
  - Block if patient is DISCHARGED or DECEASED (R12)
  - Data-layer permission check for DOCTOR fallback (R10a, R25)
- Navigate back to patient list after save

**Rules implemented:** R1, R2, R3, R4, R5, R6, R7, R10, R10a, R12, R16, R25, R29

---

## S5. Patient Detail

**Purpose:** Full patient profile, temperature history with chart, visit notes, status timeline. Read-only base; role actions overlaid.
**Roles:** All roles (read-only; permitted actions shown per role).

**Shows:**
- Profile card: name, age, gender, contact, room, admitted date, status badge, feverFreeDays
- Status timeline: visual progression of lifecycle states with timestamps
- Temperature history table: date, time, value, isFever badge, recorded by, role
- Temperature line chart with horizontal FEVER_THRESHOLD reference line at 38.0 C
- Doctor visit log: list of visits with date, doctor name, notes
- Role action buttons (shown only if role permits AND conditions met):
  - NURSE/DOCTOR: "Record temperature" (if conditions per R10/R10a)
  - DOCTOR: "Log visit" (if measured today, not yet visited)
  - DOCTOR: "Confirm discharge" (if status = READY_FOR_DISCHARGE)
  - DOCTOR: "Mark deceased" (if status = ADMITTED or READY_FOR_DISCHARGE) -> confirmation dialog

**Actions:**
- Confirm discharge: READY_FOR_DISCHARGE -> DISCHARGE_CONFIRMED; write audit (R8, R16)
- Mark deceased: confirmation dialog -> status = DECEASED, outcomeAt set, room freed; write audit (R15, R16)
- All write actions checked in data layer (R25)

**Rules implemented:** R8, R11, R12, R15, R16, R24, R25, R29

---

## S6. Log Doctor Visit

**Purpose:** Record a doctor's clinical notes and treatment for a patient on the current app date.
**Roles:** DOCTOR only.

**Shows:**
- Patient header: name, room, status
- Today's temperature reading display (value, time, recorded by)
- Blocked message if no today's reading: "Cannot log visit - temperature has not been recorded for this patient today." (R11)
- Notes / treatment textarea (if allowed)
- Save button

**Actions:**
- Hard block if today's temperature reading does not exist for this patient (R11)
- Block if patient is DISCHARGED or DECEASED (R12)
- On save: create DoctorVisit record using app-date timestamp, write audit log (R16, R29)
- Data-layer permission check (R25)
- Navigate back after save; patient moves to VISITED daily status

**Rules implemented:** R11, R12, R16, R25, R29

---

## S7. Discharge Queue

**Purpose:** Manage the two-stage discharge pipeline.
**Roles:** DOCTOR (can confirm), ADMIN (can process final discharge), HEAD_DOCTOR (view only).

**Shows:**
**Section A - Ready for Discharge** (status = READY_FOR_DISCHARGE):
- Columns: Room, Name, feverFreeDays (always 3), Days admitted
- DOCTOR: "Confirm discharge" button -> DISCHARGE_CONFIRMED
- ADMIN/HEAD_DOCTOR: view only

**Section B - Discharge Confirmed** (status = DISCHARGE_CONFIRMED):
- Columns: Room, Name, feverFreeDays, Days admitted
- ADMIN: "Process discharge" button -> DISCHARGED, room freed immediately
- DOCTOR/HEAD_DOCTOR: view only

**Note:** "Mark deceased" action is on S5 (Patient Detail), not here.

**Actions:**
- Confirm discharge (DOCTOR): READY_FOR_DISCHARGE -> DISCHARGE_CONFIRMED; write audit (R8, R16)
- Process discharge (ADMIN): DISCHARGE_CONFIRMED -> DISCHARGED; set outcomeAt; room freed; write audit (R9, R16)
- Click patient name -> navigate to S5

**Rules implemented:** R8, R9, R12, R16, R25

---

## S8. Admit Patient

**Purpose:** Admit a new patient to a free room.
**Roles:** ADMIN only.

**Shows:**
- Full-block message when all 74 rooms are occupied: "All 74 rooms are currently occupied. No admission is possible." (R13)
- Form fields (if rooms available): name, age, gender, contact, room (dropdown showing only free room numbers)
- Submit button

**Actions:**
- Room dropdown populated with free rooms only (R13, R14)
- On submit: validate all fields -> create Patient record (status=ADMITTED, feverFreeDays=0, admittedAt=now) -> write audit (R16)
- Re-validate room availability at save time in data layer (R14, R25)
- Navigate to new patient's detail after save

**Rules implemented:** R13, R14, R16, R25, R29

---

## S9. Room Occupancy

**Purpose:** Visual grid showing all 74 rooms at a glance.
**Roles:** All roles (view only).

**Shows:**
- Summary line: "X of 74 rooms occupied"
- 74-room grid, one tile per room:
  - Occupied: coloured tile with room number and truncated patient name; hover shows full name + status badge
  - Free: muted/grey tile with room number

**Actions:**
- Click occupied room tile -> navigate to S5 (Patient Detail) for that patient

**Rules implemented:** R14 (display derivation), R24

---

## S10. Dashboard

**Purpose:** Operational metrics and live daily progress for management.
**Roles:** ADMIN, HEAD_DOCTOR (view only).

**Shows:**
- Stat cards: Total rooms (74), Occupied, Active patients, Discharged (closed), Deceased (closed)
- Mortality rate % vs 15% benchmark (prominent warning banner/card if > 15%)
- Success rate % vs 85% benchmark
- Today's progress: "X of Y active patients measured today", "X of Y measured patients visited today"
- "Ready for discharge" count with quick link to S7
- "Discharge confirmed" count with quick link to S7
- Live figures (re-reads localStorage on tab focus via R32)

**Actions:**
- Click discharge queue link -> navigate to S7

**Rules implemented:** Metrics from Section 10, R22, R23, R29, R32

---

## S11. Audit Log

**Purpose:** Complete, chronological record of all system actions.
**Roles:** ADMIN, HEAD_DOCTOR (view only).

**Shows:**
- Table, newest-first: Timestamp, User name, Role badge, Action description, Patient name (if applicable)
- No write actions, no filters (v1 scope)

**Actions:**
- View only

**Rules implemented:** R16, R22, R23

---

*Last updated: 2026-10-23*