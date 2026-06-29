# UpCheck Dairy Architecture

This document describes the architectural boundaries and guidelines for the UpCheck Dairy mobile application.

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

## 2. Layer Boundaries & Guidelines

### Core Layer
- **Responsibility**: Expose application infrastructure only.
- **Rules**:
  - No domain or business logic.
  - Independent of React lifecycle (can be called outside hooks/providers).

### Repository Layer (inside `modules/*/api/`)
- **Responsibility**: Perform backend REST calls, manage caching/namespaced storage, DTO mapping.
- **Rules**:
  - Must never contain UI code, show alerts, modals, or handle React state.
  - Return Domain Models instead of raw API response JSON (DTOs).

### Provider Layer (inside `modules/*/context/`)
- **Responsibility**: React Context Providers for global/feature UI state.
- **Rules**:
  - Manage React states, loading states, and active records.
  - Do not call fetch or AsyncStorage directly—always delegate to Repositories.

### Component Layer (inside `modules/*/components/` and `shared/components/`)
- **Responsibility**: Pure UI rendering.
- **Rules**:
  - Should only consume custom hooks (e.g. `useFarm`) or receive props.
  - No direct data fetching or heavy business logic.
