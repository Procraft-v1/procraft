# Authentication & CSRF strategy

This document aligns browser clients (`@procraft/api`), SPAs (`apps/web`, `apps/profiles`), and the ASP.NET host (`apps/api`).

## Principles (non-negotiable)

1. **No `localStorage` / `sessionStorage` / Redux persistence for tokens.** The browser must not retain JWT or refresh material in JS-readable storage.
2. **HttpOnly cookies** carry the short-lived **access JWT** and the opaque **refresh token**. JavaScript cannot read either cookie.
3. **Axios (and fetch)** must send credentials cross-origin via `withCredentials: true`. The API enables CORS for configured dev origins accordingly.
4. **Refresh responses never include tokens in JSON.** Only `{ "user": { ... } }` (and cookie `Set-Cookie` headers).

## Implemented backend behavior (`apps/api`)

### Cookies

Default names from `Cookies` appsettings / `JWT_*_COOKIE_NAME` overrides:

| Cookie | Purpose | HttpOnly |
| ------ | ------- | -------- |
| `__Host-procraft_access` | JWT access token | Yes |
| `__Host-procraft_refresh` | Opaque refresh token (never stored verbatim in Postgres) | Yes |

Cookie flags (Infrastructure `CookieService`):

- **HttpOnly**: `true`
- **SameSite**: `Lax` by default (`Cookies:SameSite`)
- **Path**: `/`
- **Secure**: `true` when `Cookies:Secure` is true (`appsettings` production baseline). Development overrides often set `Secure: false`; note that **`__Host-` prefixed cookies require `Secure` under browser rules**, so prefer HTTPS locally (`https://localhost:...`) or override cookie names in development if you cannot use TLS.
- **No `Domain` attribute** for `__Host-` prefixed names.

### Access JWT

- Symmetric HS256 signing; secret from **`Jwt:Secret`** or **`JWT_SECRET`** (`WireJwtSecretsFromEnvironment` merges env into `JwtOptions`).
- Issuer/audience/expiry come from `Jwt` / `JWT_ISSUER` / `JWT_AUDIENCE` / `JWT_ACCESS_MINUTES`.
- ASP.NET **JWT Bearer** authentication reads the token from the **access cookie** (`OnMessageReceived`), not from the `Authorization` header by default.

### Refresh token rotation

1. `POST /api/auth/refresh` reads the refresh cookie, hashes the presented value with **SHA-256**, and looks up the row in `refresh_tokens` by `token_hash`.
2. If the row is **revoked** (reuse / theft scenario), the API **revokes all active refresh rows** for that user and returns **401**.
3. On success, the current row is revoked with `replaced_by_token_hash` set, a **new** refresh row is inserted with a new hash, and both cookies are re-issued.

### Logout

`POST /api/auth/logout` revokes the current refresh row when the cookie matches an active session, then clears both auth cookies.

### Passwords & stored refresh material

- Passwords: ASP.NET `PasswordHasher` via the Infrastructure `PasswordHasher` wrapper (`IPasswordHasher`).
- Refresh tokens: only **SHA-256 hashes** are stored (`RefreshToken.TokenHash`).

## CSRF posture

### Backend (`apps/api`)

- **`CsrfMiddleware`** expects a readable CSRF cookie paired with `X-CSRF-TOKEN` on unsafe HTTP methods.
- **Temporary bypass**: `/api/auth/*` is excluded so register/login/refresh/logout can complete before the SPA consistently sends CSRF headers on every unsafe call.

### Before production

- **Complete CSRF policy** (remove or narrow `/api/auth/*` bypass, ensure SPA issues/pairs tokens on app load).
- Alternatively adopt ASP.NET antiforgery tokens or a dedicated `GET /api/csrf` bootstrap.

## Related configuration

- Root [`.env.example`](../.env.example): `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`, cookie name overrides.
- [`apps/api/src/Procraft.Api/appsettings.json`](../apps/api/src/Procraft.Api/appsettings.json): `Jwt` + `Cookies` sections.
