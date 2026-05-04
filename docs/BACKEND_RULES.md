# Backend rules (ASP.NET)

## Layers

| Layer | Responsibility | Depends on |
| ----- | -------------- | ---------- |
| `Procraft.Domain` | Aggregates, enums, value objects | Nothing |
| `Procraft.Application` | CQRS (MediatR), FluentValidation behaviors, ports (`I*`), JWT/cookie naming contracts | Domain only |
| `Procraft.Infrastructure` | PostgreSQL EF Core, hashing, JWT, cookie adapter, stubs (PDF, uploads, SMTP, Telegram), `DesignTimeDbContextFactory` | Application + Domain |
| `Procraft.Api` | Controllers `/api/*`, JWT cookie authentication middleware, Serilog, Swagger, CORS/cookie posture, exceptions + CSRF scaffold | Application + Infrastructure |

Reference graph:

```text
Procraft.Domain
    ↑
Procraft.Application
    ↑
Procraft.Infrastructure
    ↑
Procraft.Api
```

Forbidden shortcuts:

- Controllers injecting `ApplicationDbContext` directly — flows go through MediatR.
- `Procraft.Application` referencing `Procraft.Infrastructure` or `Procraft.Api`.
- `Procraft.Domain` referencing outer layers.

## CQRS & validation

- Commands/queries live in `Application` feature folders (`Auth`, …).
- `ValidationBehavior<TRequest,TResponse>` runs FluentValidators before handlers.
- Domain/business failures use `UnauthorizedException`, `ConflictException`, `ValidationException`, etc.—controllers stay thin.

## Persistence

- PostgreSQL via EF Core. Start migrations via [`Persistence/Migrations/README.md`](../apps/api/src/Procraft.Infrastructure/Persistence/Migrations/README.md) / Infrastructure [`README.md`](../apps/api/src/Procraft.Infrastructure/README.md).
- Prefer `ConnectionStrings:DefaultConnection` or `DATABASE_URL`; **never commit working credentials**.
- `TemplateSeeder` is available but not auto-run.

## Security & configuration

- Auth cookies (`CookieService` + `AuthCookieOptions`): default `__Host-procraft_access` / `__Host-procraft_refresh`, **HttpOnly**, **SameSite=Lax** baseline, **Secure** from `Cookies:Secure`, **Path=/**, no `Domain` for `__Host-`.
- JWT `Jwt:Secret` (or `JWT_SECRET`) signs access tokens; issuer/audience/expiry from `Jwt` + `JWT_*` env overrides (`WireJwtSecretsFromEnvironment`).
- Refresh tokens are stored **hashed** (`RefreshToken.TokenHash`); reuse of a revoked refresh session revokes **all** active refresh rows for that user.
- CSRF is **partially scaffolded**: unsafe verbs require header/cookie pairing except `/api/auth/*` (temporary bootstrap bypass).
- Front-end SPAs must call Axios with `withCredentials: true`; **no token storage in browser caches**.

## Tooling targets

Solution targets **`net8.0`**.

## Testing

`tests/Procraft.Application.Tests` includes validators + hashing + refresh token generation smoke tests referencing Infrastructure implementations where needed. Expand with fakes/integration tests alongside feature growth.
