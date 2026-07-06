# UpCheck Dairy Architecture
Version: 1.0
Status: 🔒 Frozen

This document defines the architectural boundaries of the UpCheck Dairy application. New features should fit within these architectural boundaries. Changes to the architecture itself should be rare and justified by cross-cutting concerns rather than individual feature needs.

---

## 1. Directory Structure

```text
src/
├── core/              # Global Application Infrastructure
│   ├── api/           # ApiClient (in-memory config)
│   ├── constants/     # Global Keys, Event names, Config
│   ├── events/        # Global EventBus (emitter-based)
│   └── storage/       # Low-level Storage wrappers
│
├── shared/            # Reusable UI & Utilities
│   ├── components/    # Reusable design components (Buttons, Cards, Inputs)
│   ├── hooks/         # Shared React hooks (e.g. useColors)
│   └── utils/         # Helper functions, formatters
│
└── modules/           # Business Feature Modules
    ├── auth/          # User authentication and settings
    └── farms/         # Farm management and active farm context
```

---

## 2. Dependency Flow

Dependencies must only flow in one direction:

```text
Screen
   │
   ▼
Component
   │
   ▼
Hook (e.g., useAnimals)
   │
   ▼
Provider (React Context)
   │
   ▼
Repository (Persistence) ───► Mapper (DTO Converter)
   │
   └────────────────────────► ApiClient (Core HTTP Client)
```

Lower layers must never depend on higher layers.

**Examples**:
* **Allowed**: `Provider` → `Repository`
* **Allowed**: `Repository` → `Mapper`
* **Allowed**: `Repository` → `ApiClient`
* **Forbidden**: `Repository` → `Provider`
* **Forbidden**: `Component` → `Repository`
* **Forbidden**: `Core` → `Modules`

---

## 3. Core vs Shared

### Core
Contains application infrastructure.
- **Initialization**: Initialized once during application startup. Core services are long-lived singletons.
- **Examples**: `ApiClient`, `Storage`, `EventBus`, `Constants`, `Configuration`.
- **Rule**: Core never contains business logic or feature states.

### Shared
Contains reusable UI/utility code.
- **Examples**: `shared/components/`, `shared/hooks/`, `shared/types/`, `shared/utils/`.
- **Rule**: Shared must never depend on feature modules.

---

## 4. Module Boundaries & Ownership

Each business entity has exactly one owning module:

### Animals Module
- Animal profiles
- Breed & tag number
- Age & lifecycle stages
- Weight & Body Condition Score

### Milk Module
- Milk collection logs
- Session data (morning/evening)
- Milk history & yield metrics

### Health Module
- Disease records & symptoms
- Treatments & medications
- Vaccinations

### Finance Module
- Income logs & invoice records
- Feed, medicine, and operational expenses
- Revenue sales analytics

No feature module may modify another module's state directly. Interactions must happen through the backend or shared infrastructure. Feature modules may never import another feature module directly.

---

## 5. Standard Module Layout

Every business module should follow this structure:

```text
modules/[feature_name]/
├── api/             # Repositories & Mappers
├── components/      # Feature-specific presentation components
├── context/         # React state providers
├── hooks/           # Context hooks
├── models/          # Domain Models
├── screens/         # Feature screens (if feature owns routes)
├── services/        # Pure domain/business services
├── types/           # Request/Response DTOs & shared types
└── utils/           # Small generic helper functions
```

---

## 6. Repository Lifecycle & Data Flow

Every data request follows this end-to-end pipeline:

```text
Request ──► ApiClient ──► DTO ──► Mapper ──► Domain Model ──► Cache (optional) ──► Provider
```

Repositories are the **single source of truth** for data access. The Repository orchestrates both the `ApiClient` (fetching DTOs) and the `Mapper` (translating DTOs into Domain Models), handling offline local storage transparently. Consumers never know where the data originated.

---

## 7. Domain Models & DTOs

### DTOs
DTOs are transport contracts. They represent the data shape returned or accepted by the backend API. They may change independently of Domain Models. Providers, Components, and Screens must never depend on DTOs.

### Domain Models
Domain Models are immutable business representations.
- **Allowed**: Expose computed getters, formatting helpers, business rules, validation helpers, and derived states.
- **Forbidden**: Expose mutable UI state (e.g. `animal.selected = true` or `loading` states), perform API requests, read storage, or access React Context.

---

## 8. State Ownership

Different layers own specific categories of application states:
- **Persistent Business Data**: Owned by the `Repository` (backed by Cache/API).
- **Transient UI State** (e.g., loading, current error, selected list filter): Owned by the `Provider`.
- **Presentation State** (e.g., expanded card index, temporary form input): Owned by the `Component` / `Screen` locally.
- **Application Infrastructure**: Owned by `Core`.

---

## 9. Dependency Injection & Instantiation

- Repositories and Core services are exposed as singleton instances (e.g. `export const animalRepository = new AnimalRepository()`).
- Providers depend on repository interfaces rather than concrete implementations whenever practical.
- Components, Screens, and Hooks must never instantiate repositories or core services directly.

---

## 10. Error Flow

Errors flow upwards through layers:

```text
ApiClient (throws HTTP error)
   │
   ▼
Repository (maps database/network errors to domain exceptions)
   │
   ▼
Provider (catches and exposes clean error states to UI)
   │
   ▼
Screen (decides what message to show)
   │
   ▼
Component (renders error banner/fallback UI)
```

---

## 11. Layer Rules

### Provider Rules
- **Responsible for**: UI state (loading, error, list states), selected records, calling repositories.
- **Must NOT**: Know API URLs, use `fetch`, read `AsyncStorage` directly, map DTOs.

### Repository Rules
- **Responsible for**: HTTP requests, local cache (private, transparent to provider), DTO mapping, storage.
- **Must NOT**: Use React, navigate, show UI, show toasts, open modals.

### Screen Rules
Screens compose components.
- **May**: Call hooks, trigger actions.
- **Must NOT**: Perform HTTP requests, read `AsyncStorage`, implement business logic.

---

## 12. Naming Conventions

- **Repositories**: `[Feature]Repository` (e.g. `AnimalRepository`, `FarmRepository`)
- **Providers**: `[Feature]Provider` (e.g. `AnimalProvider`, `FarmProvider`)
- **Hooks**: `use[Feature]()` (e.g. `useAnimals()`, `useFarm()`)
- **Components**: PascalCase (e.g. `AnimalCard`, `FarmSelector`)
- **DTOs**: `[Action][Feature]Request/ResponseDto` (e.g. `CreateAnimalRequestDto`, `AnimalResponseDto`)

---

## 13. EventBus

The EventBus is intended only for global application events.
- **Examples**: `USER_LOGGED_OUT`, `THEME_CHANGED`.
- Repositories and providers may subscribe to events.
- Components should generally rely on React state/context instead.

---

## 14. Testing Strategy

- **Repositories**: Unit tested using a mocked `ApiClient` and mock Storage.
- **Providers**: Tested with mocked Repositories.
- **Components**: Tested using mocked hooks/providers.
- **Screens**: Tested through mocked user interactions.
- **Domain Models**: Unit tested independently for business rules, formatting, and computed properties.
- **ApiClient**: Integration tested independently against static mock endpoints.

---

## 15. Complete End-to-End System Alignment

Both sides of the stack mirror each other's layering:

```text
Frontend: Screen ──► Component ──► Hook ──► Provider ──► Repository ──► ApiClient/Mapper ──► HTTP
                                                                                              │
                                                                                              ▼
Backend:  Controller ──► Service ──► Repository ──► Database ◄────────────────────────────────┘
```

---

## 16. Composition Modules

Composition Modules orchestrate multiple feature modules without owning business data.

### Standard Layout
```text
modules/[composition_feature]/
├── components/      # UI components (pure presentation - props only)
├── hooks/           # useDashboard() or orchestration hook
├── models/          # Composition-specific ViewModels/UI models
├── screens/         # Layout orchestration screens
├── services/        # Composition orchestration services
├── types/           # DashboardState and similar UI state models
└── utils/           # Composition helpers
```

### Rules:
- May consume multiple feature hooks.
- Must not duplicate feature business rules.
- Must not directly access repositories.
- May define composition-specific models and presentation components.
- Composition modules may consume feature modules, but feature modules must never depend on composition modules.
- Presentation components in composition modules may only receive props and must not call hooks or contexts directly.

### Composition Screen Rules:
Composition Screens orchestrate multiple feature modules.
- **They may**: Consume multiple feature hooks, manage navigation, manage local presentation state, and compose presentation components.
- **They must NOT**: Access repositories directly, implement feature business rules, or duplicate domain calculations already provided by feature modules or domain services.

### Lifecycle:
```text
Composition Screen
        │
        ▼
Composition Hook (e.g. useDashboard)
        │
        ▼
Feature Hooks (e.g. useAnimals, useMilk)
        │
        ▼
Feature Providers
        │
        ▼
Repositories
```

---

## 17. Domain Services

Domain Services encapsulate business logic that does not naturally belong to a single Domain Model.

### Rules:
- Pure TypeScript.
- No React.
- No HTTP.
- No AsyncStorage.
- No navigation.
- Consume Domain Models or primitive values.
- Return Domain Models or presentation-neutral results.

---

## 18. Anti-Patterns

- ❌ Screens must not call `ApiClient`.
- ❌ Screens must not use `AsyncStorage`.
- ❌ Providers must not map DTOs.
- ❌ Repositories must not import React.
- ❌ Components must not call repositories.
- ❌ Domain Models must not perform HTTP requests.
- ❌ Shared must not import feature modules.
- ❌ Core must never import modules.
- ❌ Domain services must not know React (they should be pure functions or classes that take raw data and return results).
- ❌ Composition modules (Dashboard, AI, Analytics) must never duplicate feature business rules; they only orchestrate existing feature modules.

---

## 19. Feature Modules Status

### Current Modules
- [x] **Auth**: authentication and settings
- [x] **Farms**: Farm management and active farm context
- [x] **Animals**: Animal profiles, breed, tag, weight, and lifecycle
- [x] **Milk**: collection logging, daily production metrics
- [x] **Health**: diseases, vaccinations, treatments
- [x] **Breeding**: heat cycle monitoring, pregnancy, calving history
- [x] **Inventory**: feed, medicines, supplies, equipment
- [x] **Tasks**: daily routines, reminders, schedules
- [x] **Finance**: income, feed/medicine expenses, sales
- [x] **Dashboard**: composition hook orchestrating feature hook metrics

### Upcoming Modules
- [ ] **Analytics**: yields, profit margins, cost-to-feed forecasting
- [ ] **AI (GauGuru)**: voice diagnostics, assistant chat interfaces
