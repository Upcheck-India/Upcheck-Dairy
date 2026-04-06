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
- **Type**: Expo React Native mobile app (Expo SDK 54)
- **Preview Path**: `/`
- **Description**: Voice-first, Tamil-bilingual dairy farm management app for Indian dairy farmers
- **Tech**: Expo Router, React Native, AsyncStorage, expo-speech, expo-av, expo-notifications, expo-image-picker, react-native-svg

### Features
- **4-tab navigation**: Animals (என் மாடுகள்), Help (பிரச்சனை & உதவி), Money (பணம்), Today (இன்று)
- **OTP-based Authentication** — 3-step flow: phone entry → 6-digit OTP verification → profile completion (name, village, district, farm name); no PIN needed
- **Auth guard** — redirects to login screen when no profile exists; skippable for guest mode
- **Multilingual** — 6 South Indian languages: Tamil (default), Telugu, Kannada, Malayalam, Hindi, English — all with full translations, AsyncStorage persistence, and live switching in login screen language grid
- **Farmer Profile page** — avatar with initials, editable personal details, stats (total/healthy/attention animals), language switcher, logout; accessible via profile avatar button in Animals & Today headers
- **Central voice mic button** (VoiceModal) — records audio via expo-av → OpenAI Whisper STT → GPT command parser → executes action (milk log, health report, expense entry, navigation)
- **Animal management**: CRUD with health status, breed, tag#, photo capture via camera/gallery (expo-image-picker)
- **Milk anomaly detection**: 3-day rolling average, 15% = attention, 30% = critical — banner alerts on Animals tab
- **Quick health action buttons** on each AnimalCard (Fever, Not Eating, Injury, In Heat)
- **AI veterinary diagnosis** on Help tab — symptom multi-select → POST /api/farm/diagnose (GPT) → Tamil TTS via expo-speech
- **Pulsing SOS button** (Animated.loop) on Help tab — emergency call to 1962 vet helpline
- **7-day financial bar chart** (react-native-svg) on Money tab — income (green) vs expense (red)
- **Income discrepancy detection** — expected vs received reconciliation with alerts
- **Expense category breakdown** with percentage bars
- **Daily task auto-generation** — morning & evening milking, feed, clean, record income
- **Progress bar** on Today tab with celebration overlay on 100% completion
- **Push notifications** via expo-notifications — daily reminders at 5:30 AM & 4:00 PM (iOS/Android only)
- **Sync status indicator** — synced/pending/offline badge
- **Earth-green palette** (#16a34a primary, #fefce8 background, #d97706 accent)
- **56px+ touch targets** throughout
- **Feather icons** properly loaded via useFonts + expo-font plugin for correct Android rendering
- **AsyncStorage persistence** for all data (farmer profile, language, animals, milk logs, finances, tasks)
- **Play Store ready** — bundle ID com.thulirafarm.app, versionCode 1, all Android/iOS permissions declared

### API Server (`artifacts/api-server`)
- Express 5 backend serving `/api`
- **POST /api/auth/send-otp** — generates 6-digit OTP (in-memory, 5-min expiry), returns `demoOtp` for dev testing; production-ready hook for MSG91/Fast2SMS integration
- **POST /api/auth/verify-otp** — verifies OTP with attempt limiting (max 5 tries); clears after use
- **POST /api/farm/diagnose** — GPT veterinary diagnosis from symptoms array
- **POST /api/farm/voice-command** — GPT NLP command parser for Tamil/English voice commands
- **POST /api/farm/transcribe** — OpenAI Whisper audio transcription (multipart/form-data via multer)
- **AI Integration**: `@workspace/integrations-openai-ai-server` (Replit AI Integrations proxy)

### Canvas / Mockup Sandbox (`artifacts/mockup-sandbox`)
- Design mockup sandbox serving `/__mockup`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
