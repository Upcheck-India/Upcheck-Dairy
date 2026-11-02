# Upcheck Dairy

Dairy farm management for Indian smallholders — an Expo React Native app backed
by a NestJS API. Farmers track their herd, milk yields, health and breeding
events, inventory, daily tasks and finances, with Tamil as the default language.

## Layout

```
frontend/        Expo app (SDK 54, React Native 0.81, expo-router)
backend/         pnpm workspace
  api-server/    NestJS 11 API, served under /api
  lib/db/        Drizzle schema + Postgres client (@workspace/db)
  lib/api-zod/   Generated zod schemas
  lib/api-spec/  Orval codegen config
  lib/openai-*/  GauGuru AI helpers (chat, audio, images)
```

## Running it

Both halves use **pnpm**. The backend is a workspace; install from `backend/`.

```bash
# API — needs DATABASE_URL, JWT_SECRET (32+ chars) and PORT in api-server/.env
cd backend && pnpm install
pnpm --filter @workspace/api-server dev        # http://localhost:3000/api

# App
cd frontend && pnpm install
pnpm dev                                       # Expo dev server
```

Copy `.env.example` to `.env` on both sides first. The app reads
`EXPO_PUBLIC_API_URL`, which must include the `/api` suffix and must be
reachable from the device — a LAN address, not `localhost`, for a real phone.

### Native builds

Google Sign-In is a native module, so **Expo Go will not work**. Use a
dev-client or standalone build:

```bash
cd frontend
npx expo prebuild --clean
npx expo run:android          # or: eas build --profile development
```

`frontend/android/` is generated and untracked, so prebuild is required after
cloning or after any config-plugin change.

## Checks

```bash
cd backend/api-server && pnpm typecheck && pnpm test
cd frontend && pnpm typecheck && pnpm test
```

`backend` tests are integration tests: they start the API themselves on ports
4310/4311 (override with `TEST_PORT`) and need `DATABASE_URL` reachable. They
run twice because rate limiting cannot be both on and off — the validation and
JWT suites need it skipped, the security suite asserts a 429. Individual
suites can still be run against an already-running server with
`pnpm test:validation`, `test:auth` or `test:security`, which honour `PORT`.

Schema changes go through `pnpm --filter @workspace/db push`. Read
`backend/lib/db/migrations/README` conventions first: `push` offers to
**truncate tables** when adding a unique constraint, so changes of that shape
are hand-written SQL instead.

## Documentation

| Doc | What it covers |
| --- | --- |
| `ARCHITECTURE.md` | Layering rules, module boundaries, data flow |
| `FEATURES.md` | What the platform does today |
| `ROADMAP.md` | Build order and what remains |
| `AUTHENTICATION.md` | Auth flows, tokens, and the security model |
| `GOOGLE_AUTH.md` | Google Sign-In setup and OAuth client IDs |
| `frontend/DATA_LAYER.md` | How the app stores and caches data |
