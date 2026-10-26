# Google Sign-In

Ported from the working implementation in the `Upcheckapp` project, adapted to
this repo's own JWT/Drizzle auth instead of Supabase.

## Flow

```
App  ─ GoogleSignin.signIn() ────────────────► Google  (native account picker)
     ◄─ ID token ──────────────────────────────┘
     ─ POST /api/auth/google { idToken } ─────► API
                                                 │ verify signature + aud (google-auth-library)
                                                 │ find-or-create farmer by email
                                                 ▼
     ◄─ { user, accessToken, refreshToken } ────┘
```

The client never asserts who it is. It forwards the signed ID token and the
server validates the signature, issuer and audience before trusting any claim.

Accounts are linked **by email**, and only when Google reports
`email_verified: true` — Google has proven address ownership, so adopting an
existing email account is not a takeover. An existing password login keeps
working; Google just adds a second door to the same farmer.

If the account has 2FA enabled the response carries `requires2fa` and
`tempToken` instead of tokens, and the app routes to `/(auth)/2fa` — same as
password login.

## Files

**Backend**
| File | Role |
| --- | --- |
| `backend/api-server/src/auth/services/google-auth.service.ts` | Verifies the ID token against the configured client IDs |
| `backend/api-server/src/auth/services/auth.service.ts` | `googleLogin()` — find-or-create farmer, mint session |
| `backend/api-server/src/auth/controllers/auth.controller.ts` | `POST /api/auth/google` (public, throttled 5/min) |
| `backend/api-server/src/auth/dto/google-login.dto.ts` | `{ idToken: string }` |

**Frontend**
| File | Role |
| --- | --- |
| `frontend/hooks/useGoogleAuth.ts` | Wraps the native SDK, exchanges the token, stores the session |
| `frontend/components/GoogleLoginButton.tsx` | Button, styled to match the auth screens |
| `frontend/app/(auth)/login.tsx`, `register.tsx` | Mount the button |
| `frontend/services/api.ts` | `googleLogin(idToken)` |
| `frontend/app.config.js` | Injects the client IDs from `EXPO_PUBLIC_*` into `expo.extra` |

## Setup

### 1. Create OAuth client IDs

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials),
create OAuth 2.0 Client IDs under one project:

- **Web** — required on *every* platform. Android's native sign-in returns an
  ID token whose `aud` is the **web** client ID, so this is needed even for an
  Android-only build.
- **Android** — package name `com.upcheckdairy.app`, plus the SHA-1 of each
  signing key. Create one per key: local debug, release upload, and Play App
  Signing. Never referenced in app code, but sign-in fails if unregistered.
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore \
    -alias androiddebugkey -storepass android -keypass android | grep SHA1
  ```
- **iOS** — bundle identifier `com.upcheckdairy.app`.

Also fill in the OAuth consent screen, or sign-in is blocked for anyone outside
the test-user list.

### 2. Backend env

`backend/api-server/.env` (see `.env.example`):

```env
GOOGLE_CLIENT_ID_WEB=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=
GOOGLE_CLIENT_ID_ANDROID=
```

Every ID listed becomes an accepted `aud`. **`WEB` is the one that matters for
Android** — the native SDK signs in with the web client ID, so Android tokens
carry it as their `aud`. `IOS` is needed for iOS builds. `ANDROID` is never an
`aud` in this flow and can stay blank here.

With all three blank the endpoint returns
`401 Google sign-in is not configured on the server`.

### 3. Frontend env

`frontend/.env` (see `.env.example`):

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=
```

`EXPO_PUBLIC_*` values are **inlined at build time**, so set them before
`expo prebuild` / an EAS build — changing them later needs a rebuild. For EAS,
add them as environment variables on the build profile. With all three blank
the button hides itself rather than failing at the tap.

### 4. Rebuild the native app

`@react-native-google-signin/google-signin` is a native module, so **Expo Go
will not work** — it needs a dev-client or standalone build. The config plugin
is already registered in `app.json`:

```bash
cd frontend
npx expo prebuild --clean     # regenerates android/ with the plugin applied
npx expo run:android          # or: eas build --profile development
```

`frontend/android/` is untracked and currently predates this change, so the
prebuild step is required locally.

## Verifying

Endpoint behaviour, confirmed against a running server:

| Request | Response |
| --- | --- |
| no client IDs configured | `401 Google sign-in is not configured on the server` |
| `{"idToken":"bogus"}` | `401 Invalid Google token` |
| `{}` / blank / non-string | `401 Invalid Google token` |

The errors are deliberately indistinguishable — a probing client learns nothing
about whether it failed on signature, expiry or audience.

Sign-in has since been exercised end to end on a device against real OAuth
credentials.

Account selection: `useGoogleAuth` calls `GoogleSignin.signOut()` before
`signIn()`. Without it the library reuses the cached account and the picker
never appears, so a user with several Google accounts cannot switch.

## Related fixes this work uncovered

Reviewing the surrounding auth code turned up several defects that predated
Google sign-in. All are fixed on this branch; listed here because they explain
changes that otherwise look unrelated to Google.

- **The global `ValidationPipe` was inert API-wide.** `main.ts` sets
  `whitelist` and `forbidNonWhitelisted`, but the server ran under `tsx`, whose
  esbuild transform drops `emitDecoratorMetadata` — so Nest had no
  `design:paramtypes`, could not resolve a DTO class, and skipped validation on
  every endpoint. `dev`/`start` now run under `@swc-node/register`, which emits
  it. See `.swcrc`.
- **Password hash and TOTP secret were returned to clients** by five endpoints.
  `toPublicFarmer()` strips them, and `JwtStrategy` now sanitises
  `request.user` so the leak cannot recur.
- **Account email was writable without verification**, which defeated the
  email fallback in `googleLogin`. It is now immutable; a phone write clears
  `phoneVerified`.
- **Access tokens were never refreshed.** `refreshAccessToken` had no callers
  while tokens expired after 15 minutes. `src/core/auth/TokenStore` now owns
  the session and refreshes on 401, single-flight because the backend consumes
  the refresh token.
- **Uploads were served publicly.** `express.static("/uploads")` is replaced by
  `GET /api/files/:filename`, which requires a token and checks that the caller
  owns the farm whose record references the file.
- **OTPs used `Math.random()`** — now `crypto.randomInt`.

## Still open

- 2FA is removed, not implemented. `is_2fa_enabled` and `totp_secret` remain as
  unused columns.
- Offline write queue (ROADMAP phase 12) is unstarted; repositories fall back
  to cache on read only.
