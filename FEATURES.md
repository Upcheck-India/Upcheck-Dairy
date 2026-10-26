# Features

What Upcheck Dairy does today. For how it is built see `ARCHITECTURE.md`; for
what is planned see `ROADMAP.md`.

## Feature modules

### Auth
Email + password, passwordless email OTP, and Google Sign-In, all issuing the
API's own JWTs. Password reset by OTP, refresh-token rotation, server-side
logout. Onboarding collects language, farmer profile and the first farm.
Details in `AUTHENTICATION.md`.

### Farms
A farmer may hold several farms. One is active at a time, selected through a
bottom sheet, and almost every other screen is scoped to it.

### Animals
Per-animal records: name, type (cow / buffalo / calf), breed, ear tag, photo,
birth date, weight, body condition score, lactation number and pregnancy
state. Health status is an enum; **category is free text**, so farmers can
define their own herd groupings beyond the seeded five.

### Milk
Morning and evening yield logs with optional fat and SNF percentages. Dates
bucket by IST so daily totals line up with the farmer's day rather than UTC.
Payout estimates follow the NDDB fat/SNF formula (`frontend/utils/pricing.ts`).

### Health
Disease and symptom records, treatments, and a vaccination schedule with due
dates.

### Breeding
Heat detection, insemination records, pregnancy checks and calving history,
with transitions between those states.

### Inventory
Feed, medicine, equipment and supplies, with quantities and costs.

### Tasks
Daily routines and reminders, generated per farm and per day, with completion
tracking.

### Finance
Income and expense entries by category, milk sales, a passbook view and
reconciliation of expected against received payments. Entries may carry an
attachment (receipt or payslip).

### Herd workspace
Sheds and farmer-defined categories, with assignment of animals to each, plus
timelines combining breeding and vaccination events.

### Dashboard
A composition layer only — it orchestrates the feature hooks and owns no data
of its own. Daily milk totals, herd counts, a 7-day yield chart and a financial
summary.

### GauGuru (AI)
Backed by OpenAI through `lib/openai-server`:

- symptom-based diagnosis suggestions
- multilingual chat, tuned for Tamil
- voice transcription and spoken-command parsing
- feed ration calculation

These are advisory. They do not write records on their own.

## Platform

| | |
| --- | --- |
| App | Expo SDK 54, React Native 0.81, React 19, expo-router |
| State | React context per module, with module-scoped hooks |
| API | NestJS 11 on Express, global `/api` prefix |
| Database | PostgreSQL via Drizzle ORM |
| Cache | Redis, with an in-memory fallback when disabled |
| Auth | Own JWTs; Google verified with `google-auth-library` |
| Languages | Tamil (default), plus Hindi, Telugu, Kannada, Malayalam, English |

## Status

| Area | State |
| --- | --- |
| Herd, milk, health, breeding, inventory, tasks, finance | Implemented |
| Google Sign-In | Implemented |
| Dashboard and herd workspaces | Implemented |
| Authenticated file access | Implemented |
| Offline **writes** | **Not started** — caching is read-only fallback |
| Push and local reminders | Not started |
| Analytics and forecasting | Not started |
| PDF / Excel export | Not started |
| 2FA | Removed as unreachable; columns remain unused |

The read-through cache means the app survives a flaky connection for *reading*.
Writes require the API to be up. See `frontend/DATA_LAYER.md`.
