# API contract (baseline)

Everything is prefixed with `/api` at the edge reverse proxy (`VITE_API_URL=/api`). JSON bodies use `camelCase`.

## Conventions

- **Auth**: Access and refresh material are issued only as **HttpOnly cookies**. JSON responses intentionally omit tokens; clients must not use `localStorage` for credentials.
- **Errors**: Exceptions map to JSON with **`Content-Type: application/json`** (`ExceptionHandlingMiddleware`):
  - **400** `{ "message": "Validation failed", "errors": { "<field>": ["…"] } }` — FluentValidation and keyed validation failures (camelCase field keys).
  - **401** `{ "message": "…" }` — JWT/credential failures (`UnauthorizedException`); `GET /api/auth/me` also uses JWT Bearer’s challenge when `[Authorize]` fails.
  - **409** `{ "message": "Conflict", "errors": { … } }` — duplicate email/username on register.
  - **404** `{ "message": "…" }` — not found (minimal use in auth flows).
  - **500** `{ "message": "An unexpected error occurred." }` — unhandled faults (details logged server-side).
- **Operational health:**
  - `GET /health` — reverse-proxy friendly shim (outside `/api` intentionally).
  - Optional `GET /api/health`-style symmetry may be routed at the ingress; MVC hosts `HealthController` where applicable.

## Authentication (`/api/auth`)

All responses below set or clear cookies via `Set-Cookie` as implemented in `Infrastructure.Auth.CookieService`. **Responses never include JWT or refresh token strings in JSON.**

| Method & path             | Body | Success response |
| ------------------------- | ---- | ---------------- |
| `POST /api/auth/register` | `{ "email": string, "username": string, "password": string }` | `{ "user": AuthUserDto }` + cookies |
| `POST /api/auth/login` | `{ "emailOrUsername": string, "password": string }` | `{ "user": AuthUserDto }` + cookies |
| `GET /api/auth/me` | — | `{ "user": AuthUserDto }` — requires valid access JWT (`[Authorize]`). |
| `POST /api/auth/refresh` | — | `{ "user": AuthUserDto }` + rotated cookies |
| `POST /api/auth/logout` | — | `{ "message": "Logged out successfully" }` + cleared cookies |

`AuthUserDto` fields: `id` (UUID), `email`, `username`, `isEmailConfirmed`.

## Profiles + catalogs (planned; not fully wired in this milestone)

| Area | Prefix | Remarks |
| ---- | ------ | ------- |
| Owner profile | `GET/PUT /api/profile/me` | |
| Public view | `GET /api/public/profile/{username}` | Edge cache friendly |
| Skills | `GET /api/skills` | Owned list |
| Experiences | `GET /api/experiences` | Owned list |
| Projects | `GET /api/projects` | Owned list |
| Education | `GET /api/education` | Owned list |
| Certificates | `GET /api/certificates` | Owned list |
| Templates | `GET /api/templates` | Catalog |
| Analytics | `GET /api/analytics/summary` | Aggregation window parameter |
| PDF | `POST /api/pdf/export` | Async handshake |
| Subscription | `GET /api/subscriptions/me` | Entitlements |

Swagger UI (`Development` profile) publishes OpenAPI artifacts — treat schemas as illustrative until stabilized.
