# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### ThulirFarm (`artifacts/thulirafarm`)
- **Type**: Expo React Native mobile app
- **Preview Path**: `/`
- **Description**: Voice-first, Tamil-bilingual dairy farm management app for Indian farmers
- **Tech**: Expo Router, React Native, AsyncStorage, @tanstack/react-query
- **Features**:
  - 4-tab navigation: My Animals (என் மாடுகள்), Problems & Help (உதவி), Money (பணம்), Today (இன்று)
  - Central floating microphone button for voice commands
  - Animal profiles (cows/buffaloes/calves) with health status tracking
  - Milk logging with morning/evening sessions, fat% tracking
  - 7-day milk trend bar chart per animal
  - Symptom-based diagnosis with Tamil/English advice
  - Emergency contact quick-dial (1962 vet helpline)
  - Financial tracking: income with expected vs received reconciliation, expenses by category
  - Daily task system with morning/evening context awareness
  - Celebration confetti overlay on milking success & all-tasks-done
  - Earth green color palette (#2E7D32 primary) with 56px+ touch targets
  - Tamil/English bilingual UI throughout

### API Server (`artifacts/api-server`)
- Express 5 backend serving `/api`

### Canvas / Mockup Sandbox (`artifacts/mockup-sandbox`)
- Design mockup sandbox serving `/__mockup`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
