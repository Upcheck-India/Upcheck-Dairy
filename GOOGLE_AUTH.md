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

Every ID listed becomes an accepted `aud`. List each platform that can reach
the API; leave the rest blank. With all three blank the endpoint returns
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

End-to-end sign-in needs real OAuth credentials and a native build, so it has
not been exercised here.

## Known issue in the surrounding code

Nest's global `ValidationPipe` (`whitelist` / `forbidNonWhitelisted` in
`main.ts`) is **inert across the whole API**. The server runs under `tsx`,
whose esbuild transform does not honour `emitDecoratorMetadata`, so Nest has no
`design:paramtypes` to resolve a DTO class from and skips validation entirely.
Observable on `development` too: `POST /api/auth/login` with `{}` returns 500
rather than 400, and a malformed email reaches the service.

This predates Google auth and is not fixed here. `GoogleAuthService` validates
its own input so this route is correct regardless, but the pipe should be
repaired separately — it is load-bearing security config that currently does
nothing.
