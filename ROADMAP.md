# Roadmap

Build order for Upcheck Dairy. Phases 1–11 migrated the app onto the layered
architecture in `ARCHITECTURE.md`, one feature module at a time; the remainder
are new capability.

## Done

**1 — Core and farms.** `ApiClient` singleton, namespaced storage, event bus,
farm domain model with repository and mapper, `FarmProvider`, farm selector
sheet, and the guard chain in `app/_layout.tsx`.

**2 — Animals.** Domain model with derived properties, DTOs, mapper,
repository, provider and `useAnimals`.

**3 — Milk.** `MilkEntry` model, repository with offline cache, provider and
hook, IST date bucketing, and the logging UI.

**4 — Health.** Treatments, vaccinations and diagnoses behind
`HealthRepository`.

**5 — Breeding.** Heat, insemination, pregnancy checks and calving, with the
state transitions between them.

**6 — Inventory.** Feed, medicine, equipment and supplies, farm-scoped.

**7 — Tasks.** Daily tasks, generation and reminders.

**8 — Finance.** Income, expenses, milk sales and feed costs.

**10 — Dashboard.** A composition layer over the feature hooks, owning no data
of its own.

**11 — Herd workspace.** Sheds, farmer-defined categories and the breeding and
vaccination timelines.

**Auth and hardening (unnumbered).** Google Sign-In; refresh-token rotation
and real logout; authenticated, ownership-checked file access; and a set of
security fixes in the surrounding auth code. See `AUTHENTICATION.md` and
`GOOGLE_AUTH.md`.

> There was no phase 9. The numbering is kept so older commits and notes still
> line up.

## Next

**12 — Offline writes.** The one with real design risk. Repositories currently
fall back to cache on *read* only; writes fail when the API is unreachable.
Needs a durable queue, retry with backoff, conflict resolution and a staleness
policy. Nothing here is started — see `frontend/DATA_LAYER.md` before quoting
the app as offline-capable.

**13 — Notifications.** Local reminders for vaccinations, tasks and heat
cycles, driven by the existing feature hooks. `expo-notifications` is already a
dependency and the permission field exists on the farmer.

**14 — Analytics.** Cost-to-feed, yield forecasting and profit margins.

**15 — Reports.** PDF and Excel export for production and expenses.
`expo-print` and `expo-sharing` are already installed.

**16 — GauGuru grounding.** The AI endpoints exist but answer from the prompt
alone. This phase feeds them the farm's own records so answers reference real
animals and history.

## Known debt

- **Two frontend trees.** `src/` holds the layered modules; `app/`,
  `components/`, `context/` and `services/` still hold pre-migration code.
  Auth and profile live in the old tree.
- **Large screens.** `app/animal/[id].tsx` and `app/(tabs)/animals.tsx` are
  each over 2,000 lines.
- **Thin tests.** Three frontend suites (19 assertions) and three backend
  integration suites. Neither runs in CI, and nothing covers repositories,
  providers or screens.
- **Unused 2FA columns.** `is_2fa_enabled` and `totp_secret` survive the
  removal of the 2FA path.
