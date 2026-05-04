# Architecture overview

```
┌─────────────┐   ┌──────────────┐   ┌────────────────┐
│ apps/landing│   │ apps/web SPA │   │ apps/profiles│
│ SEO static  │   │ Dashboards   │   │ *.procraft SPA│
└──────▲──────┘   └───────▲──────┘   └──────▲────────┘
       │pnpm workspace   │pnpm workspace │pnpm workspace 
       └───────────────┬─┴─────────────┬──┘
                       ▼               ▼
                 packages/services → packages/api-client → nginx → apps/api (.NET Clean Architecture + PostgreSQL)
```

## Frontend layering

Mandatory request flow:

```
UI component → @procraft/hooks (TanStack Query) → @procraft/services → @procraft/api-client (Axios) → ASP.NET
```

`@procraft/store` persists **only** ephemeral UI prefs (never auth secrets or canonical server payloads).

Refer to [`FRONTEND_RULES.md`](./FRONTEND_RULES.md).

## Backend layering

Follow strict Clean Architecture (`apps/api/Procraft.sln`):

- **Domain** — Entities such as `User`, `Profile`, `Subscription`, enums, and guarded domain exceptions (`DomainException`).
- **Application** — MediatR command/query scaffolding, FluentValidation pipeline behaviors (`ValidationBehavior`, `LoggingBehavior`), and ports (`IApplicationDbContext`, `ITokenService`, etc.).
- **Infrastructure** — EF Core + PostgreSQL (`ApplicationDbContext`, fluent configurations under `Persistence/Configurations`), upload/PDF/email/telegram stubs, PBKDF2 password hashing, JWT helper (`TokenService`), and cookie stamping helpers (`CookieAuthService`).
- **Api** — `AuthController`, `HealthController`, Serilog, Swagger/OpenAPI (`SwaggerExtensions`), CORS parity for local Vite origins, middleware (`ExceptionHandlingMiddleware`, `CsrfMiddleware`), and cookie policies (`CookieExtensions` scaffolding).

Detailed guidance — layer boundaries, CQRS norms, JWT/cookie scaffolding: [`BACKEND_RULES.md`](./BACKEND_RULES.md).

> **Reminder:** SPA clients must **never** hydrate JWTs inside `localStorage`; cookies + `withCredentials` keep sessions aligned across `apps/web` dashboards and `packages/api-client`.

## Routing + hosting

Ingress terminates at nginx-like reverse proxies splitting:

| Host / path                               | SPA / service                |
| ----------------------------------------- | ---------------------------- |
| `https://procraft.uz/`                    | `landing` artifact           |
| `https://procraft.uz/dashboard/*`        | `web` artifact               |
| `https://{username}.procraft.uz`          | `profiles` artifact          |
| `https://procraft.uz/api/*`               | ASP.NET container            |

See [`../infra/nginx/README.md`](../infra/nginx/README.md).

## SEO blueprint

Each surface adopts different freshness strategies documented in [`../apps/landing/README.md`](../apps/landing/README.md) and landing-specific sections below:

1. **`apps/landing`**
   - **Title**: product + geography segment + primary CTA (≤60 chars guideline).
   - **Meta description**: benefits-first + trust proof; avoid duplicate dashboards copy.
   - **Open Graph / Twitter**: image 1200×630, deterministic URLs, `og:url` aligns with canonical.
   - **`robots.txt` / `sitemap.xml`**: static files in `apps/landing/public/` for now — automation later.
   - **Structured data**: plan `Organization` + `SoftwareApplication`; defer until pricing schema stable.
   - Prefer **SSR/SSG** or handcrafted HTML shells for pillar pages prior to hydrating React where possible.

2. **`apps/profiles`**
   - Canonical `https://{username}.procraft.uz/`.
   - Title pattern: `{DisplayName} — Portfolio | Procraft`.
   - Description seeded from curated profile summary (~155 chars friendly).
   - OG image optionally generated from avatar + template screenshot job.
   - Future: edge HTML prerender bot vs. hydrating dynamic stats.

## Data + infrastructure

PostgreSQL backs relational state; unstructured assets land under `/uploads` (CDN-proxied). Docker + nginx scaffolding live under `infra/` and root `docker-compose.yml` placeholders.
