# REQUIREMENTS — Quarantine Facility Management App

> **Single source of truth.** If the code and this document disagree, flag it and resolve here first.
> Rule IDs (R1, R2, …) are stable references used in code comments, PR descriptions and progress notes.

---

## 2. Problem Statement

A virus quarantine and treatment facility has **74 rooms, all full**.
The virus has a **15 % mortality rate** (target success rate: **85 %**).
The main symptom is a prolonged fever.
A patient is **CURED** after **3 full days without a fever**, then discharged.

### Current pain points

| # | Problem |
|---|---------|
| P1 | Nurses write temperatures in a paper journal — no visibility into who has been measured today. Some patients are measured twice, some not at all. |
| P2 | Doctors visit patients before temperature is taken and waste time. |
| P3 | Doctors forget to tell admin when a patient can be discharged — patients stay extra days. |
| P4 | No way to measure the centre's mortality rate against the 15 % benchmark. |

### Goals the app must achieve

| # | Goal |
|---|------|
| G1 | Show who still needs a temperature measurement today. |
| G2 | Show doctors only patients who are already measured and not yet visited. |
| G3 | Auto-flag patients after 3 fever-free days. |
| G4 | Support discharge workflow by admin. |
| G5 | Track mortality rate vs. the 15 % benchmark. |

---

## 3. Tech Stack & Constraints

| Item | Choice |
|------|--------|
| Framework | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | react-router |
| Persistence | Browser localStorage via a single data-layer module (swappable for an API) |
| Seed data | Generated script with realistic Indian names, ages, genders (not hand-typed) |
| Deployment | Vercel (standard static build, no server) |
| Layout | Desktop-first responsive web app |

### Seed data spec

- **70 active patients** in rooms 1–70, spread across states:
  - ~25 NOT_MEASURED today
  - ~20 MEASURED_AWAITING_DOCTOR
  - ~15 VISITED today
  - Varied feverFreeDays (0, 1, 2)
  - ~5 READY_FOR_DISCHARGE
  - ~2–3 DISCHARGE_CONFIRMED
- **4 free rooms**: 71–74
- **~22 closed cases**: 18 DISCHARGED, 4 DECEASED
- A **"Reset demo data"** button restores this seed data at any time.

---

## 4. Data Model

### Patient (admission record)

| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID |
| name | string | Full name |
| age | number | |
| gender | "MALE" / "FEMALE" / "OTHER" | |
| contact | string | Phone / next-of-kin |
| roomNumber | number | 1–74, one active patient per room |
| admittedAt | datetime (ISO string) | |
| status | see Section 5 | |
| feverFreeDays | number (0–3) | Calculated by system, never typed by user |
| outcomeAt | datetime or null | Set when DISCHARGED or DECEASED |

### TemperatureReading

| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID |
| patientId | string | FK → Patient |
| valueCelsius | number | |
| isFever | boolean | valueCelsius >= FEVER_THRESHOLD |
| recordedAt | datetime | |
| recordedBy | string | userId |
| recordedByRole | string | Role of recorder |

### DoctorVisit

| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID |
| patientId | string | FK → Patient |
| doctorId | string | userId |
| notes | string | Free text |
| visitedAt | datetime | |

### Room

| Field | Type | Notes |
|-------|------|-------|
| roomNumber | number | 1–74 |
| isOccupied | boolean | Derived from active patients (not stored) |

### User

| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID |
| name | string | Full name |
| username | string | Login credential |
| password | string | Plain text for demo only — swap for hash when using a real backend |
| role | "NURSE" / "DOCTOR" / "ADMIN" / "HEAD_DOCTOR" | |

### AuditLog

| Field | Type |
|-------|------|
| id | string |
| userId | string |
| action | string |
| patientId | string or null |
| timestamp | datetime |

---

## 5. Patient Status Lifecycle

ADMITTED → READY_FOR_DISCHARGE  (system: feverFreeDays reaches 3)
READY_FOR_DISCHARGE → DISCHARGE_CONFIRMED  (doctor confirms)
DISCHARGE_CONFIRMED → DISCHARGED  (admin processes; room freed)
ADMITTED or READY_FOR_DISCHARGE → DECEASED  (doctor records death; room freed)

---

## 6. Daily Task Status (derived, per patient, per calendar day)

| Status | Condition |
|--------|-----------|
| NOT_MEASURED | No temperature reading recorded today |
| MEASURED_AWAITING_DOCTOR | A reading exists today; no doctor visit today |
| VISITED | A doctor visit exists today |

> Resets automatically each calendar day based on dates — NOT a stored flag.

---

## 7. Core Rules

### Temperature & Fever

| ID | Rule |
|----|------|
| R1 | Fever threshold constant: FEVER_THRESHOLD = 38.0 °C. Defined in one place so it is easy to change. |
| R2 | A reading >= FEVER_THRESHOLD is a fever (isFever = true); below is non-fever. |
| R3 | After a non-fever reading, feverFreeDays increments by 1 — at most once per calendar day. |
| R4 | After a fever reading, feverFreeDays resets to 0. |
| R5 | A day with no reading does not count as a fever-free day. |
| R6 | Temperature values outside 30–45 °C are rejected as invalid. |

### Discharge & Auto-flagging

| ID | Rule |
|----|------|
| R7 | When feverFreeDays reaches 3, patient status automatically becomes READY_FOR_DISCHARGE. |
| R8 | Only a doctor can move status from READY_FOR_DISCHARGE to DISCHARGE_CONFIRMED. |
| R9 | Only admin can move status from DISCHARGE_CONFIRMED to DISCHARGED (and free the room). |

### Readings & Visits

| ID | Rule |
|----|------|
| R10 | **Hard block**: only one temperature reading per patient per day is allowed. If a reading already exists for today, the action is rejected in both the UI and the data layer. The UI shows a message: "Temperature already recorded today at HH:MM by [Name] ([value] °C)". There is no "confirm anyway" option. Editing or correcting a reading is out of scope for this version. |
| R10a | A doctor may record a temperature only if none exists today for that patient (fallback only). The reading is stored with recordedByRole = DOCTOR and the same one-per-day hard block applies. |
| R11 | A doctor visit can only be logged if today's temperature reading already exists for that patient. |
| R12 | Patients with status DISCHARGED or DECEASED cannot receive new readings or visits. |

### Rooms & Admissions

| ID | Rule |
|----|------|
| R13 | Admission is blocked when all 74 rooms are occupied. |
| R14 | A room cannot be assigned to two active patients simultaneously. |

### Death

| ID | Rule |
|----|------|
| R15 | A doctor can mark a patient (ADMITTED or READY_FOR_DISCHARGE) as DECEASED; this immediately frees the room. |

### Audit

| ID | Rule |
|----|------|
| R16 | Every create or state-change action writes an AuditLog entry with userId, action, patientId and timestamp. |

---

## 9. Authentication & RBAC

### Auth module

| ID | Rule |
|----|------|
| R17 | All authentication goes through a single auth module exposing exactly: `login(username, password)`, `logout()`, `getCurrentUser()`. This module reads from / writes to localStorage and can be swapped for a real API without touching the UI. |
| R18 | Seed demo users: 2 nurses, 2 doctors, 1 admin, 1 head doctor — each with `id`, `name`, `username`, `password`, `role`. |
| R19 | After successful login, the current user object (id, name, role) is stored in the session (localStorage). |
| R20 | A Logout button is present in the header on every authenticated page. Clicking it clears the session and redirects to the login screen. |
| R21 | The login page displays a "Demo accounts" panel listing all seeded usernames, passwords and roles so reviewers can switch roles quickly. This panel is demo-only. |

### Route & UI protection

| ID | Rule |
|----|------|
| R22 | Unauthenticated users who open any route are redirected to the login screen. |
| R23 | A logged-in user who navigates to a route their role cannot access sees an "Access denied" page (not a blank screen or 404). |
| R24 | Navigation menus show only the items the current role may access. Action buttons the role may not use are hidden (or, where hiding would break layout, disabled with a tooltip explaining why). |

### Action / data-layer protection

| ID | Rule |
|----|------|
| R25 | Every write action in the data layer (record temperature, log visit, confirm discharge, mark deceased, admit patient, process final discharge, reset demo data) checks the caller's role against the permissions map and throws a permission error if the role is not allowed — even if the UI guard is bypassed. |

### Permissions matrix (single source of truth)

> Defined in ONE central file in the codebase (e.g. `src/lib/permissions.ts`). All route guards, menu filters and data-layer checks import from there.

| Action | NURSE | DOCTOR | ADMIN | HEAD_DOCTOR |
|--------|:-----:|:------:|:-----:|:-----------:|
| View patient list | ✓ | ✓ | ✓ | ✓ |
| View patient history | ✓ | ✓ | ✓ | ✓ |
| View room occupancy | ✓ | ✓ | ✓ | ✓ |
| View to-be-measured list | ✓ | — | — | — |
| Record temperature (primary) | ✓ | fallback* | — | — |
| View to-be-visited list | — | ✓ | — | ✓ |
| Log doctor visit | — | ✓ | — | — |
| Confirm discharge (READY → CONFIRMED) | — | ✓ | — | — |
| Mark patient deceased | — | ✓ | — | — |
| View discharge queue | — | ✓ | ✓ | ✓ |
| Admit new patient | — | — | ✓ | — |
| Process final discharge (CONFIRMED → DISCHARGED) | — | — | ✓ | — |
| View dashboard / metrics | — | — | ✓ | ✓ |
| View audit log | — | — | ✓ | ✓ |
| Reset demo data | — | — | ✓ | — |

*DOCTOR may record a temperature only when no reading exists today for that patient (R10a).

---

## 10. Metrics

| Metric | Formula |
|--------|---------|
| Closed cases | DISCHARGED count + DECEASED count |
| Mortality rate | DECEASED / Closed cases x 100 |
| Success rate | DISCHARGED / Closed cases x 100 (benchmark: >= 85 %) |
| Warning | Show a prominent warning when mortality rate exceeds 15 % |

---

*Last updated: 2026-10-23 (rev 2 — added Auth/RBAC, hard-blocked R10, updated User model)*

---

## 11. Demo Helpers (In-App)

| ID | Rule |
|----|------|
| R26 | Two demo helper controls are present in the app shell sidebar for ALL logged-in roles, in a section clearly labelled **"DEMO TOOLS"**. |
| R27 | **"Reset demo data"** - shows a confirmation dialog before acting. On confirm: restores all seed data (patients, readings, visits, audit log, users) and resets the app date to SEED_DATE. This write action is restricted to ADMIN role (R25); all other roles see the button disabled with a tooltip explaining why. |
| R28 | **"Simulate next day"** - advances the app date by exactly 1 calendar day. It does NOT create any temperature readings, doctor visits or any other records. Its only effect is moving the date forward so that daily task statuses reset and the 3-day fever-free logic can be demonstrated interactively. Visible to all logged-in roles; no permission restriction. |
| R29 | The app date is stored in localStorage under key `qf_app_date` and displayed in the app header at all times. All "today" logic - daily task status derivation, one-reading-per-day hard block, visit eligibility check, timestamps on newly created records, days-since-admission calculation - MUST read exclusively from the app-date module. The real system clock MUST NOT be read directly anywhere else in the codebase. |

---

## 12. Session and Multi-tab

| ID | Rule |
|----|------|
| R30 | The logged-in session (userId, name, role) is stored in **sessionStorage**, not localStorage. Each browser tab therefore has its own fully independent session. |
| R31 | Two users with different roles may be logged in simultaneously in two different tabs of the same browser without interfering with each other's sessions or with shared app data. |
| R32 | When the data layer writes to localStorage in one tab, other open tabs must automatically detect the change via the browser `storage` event and refresh their in-memory data - no manual page reload required. |
| R33 | Logging out in one tab clears only that tab's sessionStorage entry and redirects that tab to the login screen. It does not affect sessions or data in any other tab. |

---

*Last updated: 2026-10-23 (rev 3 - added Demo Helpers R26-R29, Session/Multi-tab R30-R33, Screen list)*
