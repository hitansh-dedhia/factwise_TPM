# Project Rules — Quarantine Facility Management App

## Mandatory reading before any task

Before starting any task, read ALL of the following files in full:

1. `docs/REQUIREMENTS.md` — the single source of truth for all rules, data models, and constraints.
2. `docs/SCREENS.md` — the list of screens, their roles, and their scope.
3. `docs/PROGRESS.md` — current build status of every screen.

## Behavioural constraints

- **Never invent** rules, fields, roles, statuses, or features that are not explicitly described in `docs/REQUIREMENTS.md` or `docs/SCREENS.md`.
- **Never contradict** the docs. If the code and the docs disagree, flag it immediately and do not proceed until the docs are updated and the user approves the change.
- **If a requirement is missing or unclear**, ask the user. Once agreed, update `docs/REQUIREMENTS.md` first, then write the code.
- **Build one screen at a time.** After each screen, stop, tell the user how to run and test it, and wait for approval before starting the next screen.
- **Reference rule IDs** (R1, R2, …) in code comments and commit messages wherever a rule is implemented.
- **Update `docs/PROGRESS.md`** after every screen: mark BUILT when code is complete, APPROVED BY USER when the user gives the go-ahead.
- **Update `docs/REQUIREMENTS.md`** whenever a requirement changes, before touching any code.
- **Do not add screens** that the user has not yet asked for.

## Quick references

- Fever threshold: FEVER_THRESHOLD = 38.0 °C (R1) — one constant, one place.
- Valid temperature range: 30–45 °C (R6).
- Roles: NURSE, DOCTOR, ADMIN, HEAD_DOCTOR.
- Patient statuses: ADMITTED, READY_FOR_DISCHARGE, DISCHARGE_CONFIRMED, DISCHARGED, DECEASED.
- Daily task statuses (derived, not stored): NOT_MEASURED, MEASURED_AWAITING_DOCTOR, VISITED.