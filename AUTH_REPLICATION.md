# Authentication Module Replication Guide

This document outlines the steps required to replicate the authentication module from this project into a new NestJS backend.

## 1. Prerequisites & Dependencies

The authentication system is built on **NestJS**, **Supabase (GoTrue)**, **TypeORM (PostgreSQL)**, and **Redis**.

### Auth Flows Present In This Codebase

If you want full parity with this project, do not copy only email/password login. The current module includes:

- Email/password signup and signin
- Passwordless email OTP login
- Google OAuth via Supabase `signInWithIdToken`
- Truecaller auth in two forms:
  - legacy signed-payload / access-token flow
  - newer `oauth/truecaller/exchange` code-verifier flow
- TOTP two-factor auth setup, enable, disable, status, and gated signin
- Session refresh, signout, current-user lookup, user update
- Password reset email and password update
- Verification email resend

### Install Required Packages
```bash
# Core NestJS & Supabase
npm install @supabase/supabase-js @nestjs/config @nestjs/typeorm typeorm pg

# Security & OAuth
npm install google-auth-library jsonwebtoken axios

# Two-Factor Authentication (TOTP)
npm install otplib qrcode ioredis @nestjs-modules/ioredis

# Validation
npm install class-validator class-transformer
```

---

## 2. Directory Structure to Copy

Copy the following folder from `backend/src/auth/` to your new project:

- `auth/`
    - `guards/`: Contains `JwtAuthGuard` (Global) and `SupabaseAuthGuard`.
    - `decorators/`: Contains `@Public()` and `@CurrentUser()`.
    - `dto/`: Request validation objects.
    - `supabase-auth.service.ts`: Core logic for Supabase & Truecaller.
    - `supabase-auth.controller.ts`: API Endpoints.
    - `two-factor.service.ts`: TOTP logic.
    - `truecaller.service.ts`: Phone verification logic.
    - `user.entity.ts`: User table definition.
    - `auth.module.ts`: NestJS module configuration.

---

## 3. Database Schema Requirements

Your `users` table in PostgreSQL must support the following columns:

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (shares ID with Supabase Auth) |
| `email` | `varchar` | Unique email |
| `phone` | `varchar` | Unique phone number |
| `auth_provider` | `varchar` | e.g., 'email', 'google', 'truecaller' |
| `is_2fa_enabled` | `boolean` | TOTP status |
| `totp_secret` | `text` | Encrypted or plain TOTP secret |
| `phone_verified` | `boolean` | Verification status from Truecaller/OTP |

---

## 4. Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis (for 2FA sessions and Truecaller verification)
REDIS_URL=redis://localhost:6379

# Frontend Redirects
FRONTEND_URL=http://localhost:3000
```

---

## 5. Implementation Steps

### Step 1: Register the AuthModule
Import `AuthModule` in your `app.module.ts`.

### Step 2: Set Up Global Guard
The module uses a `JwtAuthGuard` to protect all routes by default. In `auth.module.ts`, it is registered as:
```typescript
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
}
```
*Note: Use the `@Public()` decorator on any route that should be accessible without a token (e.g., login, signup).*

### Step 3: Configure Redis
Ensure you have a `RedisService` or use the standard `IORedis` module. The `TwoFactorService` and `TruecallerService` depend on Redis for temporary storage and idempotency.

### Step 4: Truecaller (Optional)
If you are using Truecaller, ensure you have the `partner key` from the Truecaller developer console and update the logic in `truecaller.service.ts`.

---

## 6. Key Authentication Flows

### A. Email/Password Sign-In
1. `POST /auth/supabase/signin`
2. If 2FA is enabled, returns a `tempToken`.
3. User completes login via `POST /auth/supabase/2fa/login`.

### B. Google OAuth
1. `POST /auth/supabase/oauth/google`
2. Backend receives a Google `idToken`.
3. Supabase validates the token with `signInWithIdToken('google', idToken)`.
4. Response shape matches the normal signin flow: `{ message, user, session }`.

### C. Truecaller Passwordless Flow
1. Mobile app obtains a signed payload or access token from Truecaller SDK.
2. `POST /auth/supabase/oauth/truecaller`
3. Backend verifies the payload with Truecaller servers.
4. Backend retrieves/creates user and generates a session via Supabase's `magiclink` admin API.

### D. Truecaller OAuth Exchange Flow
1. Mobile app gets an authorization code + PKCE verifier.
2. `POST /auth/supabase/oauth/truecaller/exchange`
3. Backend completes the server-side exchange with Truecaller.
4. The verified profile is passed into the same Supabase linking/session logic.

### E. TOTP Enrollment
1. `POST /auth/supabase/2fa/setup` -> Get QR Code.
2. `POST /auth/supabase/2fa/enable` + `token` -> Persist secret.

### F. Session, Password, and Verification Support
- `POST /auth/supabase/refresh` refreshes a Supabase session.
- `POST /auth/supabase/signout` revokes the bearer token session.
- `GET /auth/supabase/me` returns the authenticated user.
- `POST /auth/supabase/update` updates Supabase user fields.
- `POST /auth/supabase/forgot-password` sends a reset email.
- `POST /auth/supabase/update-password` changes the password for the current bearer token.
- `POST /auth/supabase/resend-verification` resends the signup verification email.

## 7. What To Copy If You Want Full Parity

If the goal is to replicate the auth module as-is, include all of these files and behaviors, not just the basic login routes:

- `supabase-auth.controller.ts` and `supabase-auth.service.ts`
- `truecaller.service.ts`
- `two-factor.service.ts`
- `guards/jwt-auth.guard.ts` and `guards/supabase-auth.guard.ts`
- `decorators/auth.decorators.ts` and `decorators/current-user.decorator.ts`
- every DTO under `dto/`, including `GoogleAuthDto`, `ForgotPasswordDto`, `RefreshTokenDto`, and the Truecaller DTOs
- the `User` entity and any database migration needed to match it
