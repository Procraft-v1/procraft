# Backend rules (ASP.NET — legacy)

> **2026-06-11:** Backend NestJS ga ko'chirildi (`apps/api`). Bu hujjat
> `apps/api-dotnet` dagi legacy implementatsiyani tavsiflaydi va rollback
> ma'lumotnomasi sifatida saqlanadi. Joriy backend qoidalari:
> [`apps/api/README.md`](../apps/api/README.md), migratsiya tafsilotlari:
> [`MIGRATION_REPORT.md`](MIGRATION_REPORT.md), deploy: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Layers

| Layer | Responsibility | Depends on |
| --- | --- | --- |
| `Procraft.Domain` | Aggregates, enums, value objects | Nothing |
| `Procraft.Application` | CQRS (MediatR), FluentValidation behaviors, ports (`I*`), JWT/cookie naming contracts | Domain only |
| `Procraft.Infrastructure` | PostgreSQL EF Core, hashing, JWT, cookie adapter, stubs, uploads, SMTP, Telegram, design-time tooling | Application + Domain |
| `Procraft.Api` | Controllers `/api/*`, JWT cookie authentication middleware, Serilog, Swagger, CORS/cookie posture, exceptions, CSRF scaffold | Application + Infrastructure |

Reference graph:

```text
Procraft.Domain
    ^
Procraft.Application
    ^
Procraft.Infrastructure
    ^
Procraft.Api
```

Forbidden shortcuts:

- Controllers injecting `ApplicationDbContext` directly; flows go through MediatR.
- `Procraft.Application` referencing `Procraft.Infrastructure` or `Procraft.Api`.
- `Procraft.Domain` referencing outer layers.

## CQRS & validation

- Commands/queries live in `Application` feature folders.
- `ValidationBehavior<TRequest,TResponse>` runs FluentValidators before handlers.
- Domain/business failures use `UnauthorizedException`, `ConflictException`, `ValidationException`, etc.; controllers stay thin.

## Persistence

- PostgreSQL via EF Core. Start migrations via [`Persistence/Migrations/README.md`](../apps/api/src/Procraft.Infrastructure/Persistence/Migrations/README.md).
- Prefer `ConnectionStrings:DefaultConnection` or `DATABASE_URL`; never commit working credentials.
- `TemplateSeeder` is available but not auto-run.
- Uploaded files are stored on disk via `IFileStorageService`; database rows store only public paths/URLs such as `Profile.AvatarUrl`, never file blobs.

## Security & configuration

- Auth cookies (`CookieService` + `AuthCookieOptions`): default `__Host-procraft_access` / `__Host-procraft_refresh`, HttpOnly, SameSite=Lax, Secure from `Cookies:Secure`, Path=/, no Domain for `__Host-`.
- JWT `Jwt:Secret` (or `JWT_SECRET`) signs access tokens; issuer/audience/expiry come from `Jwt` + `JWT_*` env overrides.
- Refresh tokens are stored hashed (`RefreshToken.TokenHash`); reuse of a revoked refresh session revokes all active refresh rows for that user.
- CSRF is partially scaffolded: unsafe verbs require header/cookie pairing except `/api/auth/*`.
- Front-end SPAs must call Axios with `withCredentials: true`; no token storage in browser caches.

## Uploads

- Avatar endpoints live under `POST /api/profile/avatar` and `DELETE /api/profile/avatar`.
- Controllers stay thin and dispatch MediatR commands; validation/storage decisions belong in Application/Infrastructure.
- Accepted avatar formats: JPG, JPEG, PNG, WEBP.
- Maximum avatar file size: 5MB.
- Multipart field name: `file`.
- `Uploads:RootPath` controls the local upload root.
- `Uploads:PublicBasePath` controls the served URL prefix, default `/uploads`.
- `Uploads:MaxAvatarSizeMb` controls the infrastructure size limit, default `5`.
- Avatar files are stored under the `avatars` folder and returned as `/uploads/avatars/{filename}`.
- `LocalFileStorageService` must generate safe unique filenames, reject invalid folder/path traversal attempts, and delete only files inside the configured upload root.

## Tooling targets

Solution targets `net8.0`.

## Testing

`tests/Procraft.Application.Tests` includes validators, hashing, and refresh token generation smoke tests referencing Infrastructure implementations where needed. Expand with fakes/integration tests alongside feature growth.
