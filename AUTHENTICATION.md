# Authentication

The API issues its own JWTs against the `farmers` table. There is no external
identity provider holding the session — Google only proves who the user is, and
the server mints the session itself.

## Flows

| Flow | Endpoints |
| --- | --- |
| Email + password | `POST /auth/register` → `POST /auth/verify-otp` → `POST /auth/login` |
| Email OTP (passwordless) | `POST /auth/send-otp` → `POST /auth/verify-otp` |
| Google | `POST /auth/google` |
| Password reset | `POST /auth/send-otp` → `POST /auth/reset-password` |
| Session | `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |

Registration always sends an OTP; an account cannot log in with a password
until `emailVerified` is true. Verifying an OTP for an unknown address creates
the account, so OTP doubles as sign-up.

Google sign-in is documented separately in `GOOGLE_AUTH.md`.

## Tokens

- **Access token** — JWT, 15 minutes, `{ sub, email }`. Sent as
  `Authorization: Bearer`.
- **Refresh token** — 40 hex chars, bcrypt-hashed in `refresh_tokens`, 30 days.

`POST /auth/refresh` **consumes** the refresh token and issues a new pair. The
client must therefore refresh single-flight; `frontend/src/core/auth/TokenStore`
does this, because concurrent refreshes would present an already-revoked token
and end the session. It refreshes on any 401 and replays the request once.

A network failure during refresh deliberately keeps the session, so losing
signal does not sign anyone out.

`POST /auth/logout` revokes every refresh token for the user. Clearing tokens
on the device alone is not a logout — the refresh token would stay valid for
its full 30 days.

## What protects what

- **Global JWT guard.** Every route requires a token unless marked `@Public()`.
- **Rate limits.** Global 100/min; 3/min on `send-otp`, `register` and
  `reset-password`; 5/min on `login`, `verify-otp` and `google`.
- **Lockout.** Five failed attempts locks an address for 15 minutes, tracked in
  Redis — or an in-memory map with the same TTL semantics when
  `REDIS_ENABLED=false`. The fallback is per-process, so it does not survive a
  restart or span instances.
- **Validation.** A global `ValidationPipe` with `whitelist` and
  `forbidNonWhitelisted` rejects unknown properties. This depends on decorator
  metadata, so the server must run under a transform that emits it — see
  "Runtime" below.
- **Secrets never leave the server.** `toPublicFarmer()` strips `passwordHash`
  and `totpSecret`, and `JwtStrategy` applies it to `request.user` so a
  controller cannot leak them by returning the user object.

### Identity fields are not freely writable

`email` is immutable through `POST /farm/profile`. It is what `googleLogin`
falls back to when an account has no `googleId` yet, so an unverified write
would be an account-takeover primitive: claim an address you do not own, and
its real owner is handed your farmer record when they first use Google.
Changing an email needs an ownership check that does not exist yet.

`phone` stays editable because the profile screen edits it, but writing one
clears `phoneVerified`. **Any future phone sign-in must gate on that flag**,
or it reintroduces exactly the hole the email rule closes.

## Runtime requirement

`dev` and `start` run under `@swc-node/register` with `decoratorMetadata`
enabled (`.swcrc`). This is not a preference: Nest resolves a DTO class from
`design:paramtypes`, and a transform that drops decorator metadata — esbuild,
and therefore `tsx` — leaves every `@Body()` with an undefined metatype, so the
`ValidationPipe` silently validates nothing. If validation ever appears to stop
working, check what is transpiling the server before anything else.

## Not implemented

- **2FA.** Removed rather than finished: there was never an endpoint to enable
  it, so the columns could not become true and the whole path was unreachable.
  `is_2fa_enabled` and `totp_secret` remain as unused columns.
- **Truecaller, phone sign-in, change-password, delete-account.** Scaffolding
  for these came from the project this auth was ported from and has been
  removed; none of it had routes.
