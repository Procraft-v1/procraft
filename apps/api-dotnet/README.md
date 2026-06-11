## `apps/api` — ASP.NET Core Clean Architecture gateway

Layers:

| Project | Responsibility |
| ------- | ------------- |
| `Procraft.Domain` | Entities, enums, domain exceptions |
| `Procraft.Application` | CQRS contracts, FluentValidation behaviors, JWT/cookie/security options |
| `Procraft.Infrastructure` | EF Core + integrations (PDF stub, uploads, telegram stub, hashing, SMTP stub) |
| `Procraft.Api` | HTTP surface, Swagger, Serilog, CORS, middleware |

### Prerequisites

Install the [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (upgrade to newer band when available).

### Scripts (via Turborepo or `pnpm`)

```bash
pnpm --filter @procraft/api-backend dev
pnpm --filter @procraft/api-backend build
pnpm --filter @procraft/api-backend test
```

### Bootstrap checklist

1. Copy root `.env.example` values into your secret store / `dotnet user-secrets`.
2. Update `appsettings.Development.json` connection string or rely on environment variables (`DATABASE_URL` / `ConnectionStrings__DefaultConnection`).
3. Create SQL migrations (`Persistence/Migrations/README.md`) and apply `dotnet ef database update`.
4. Replace development-only JWT placeholders with cryptographic secrets sourced from `$JWT_SECRET`.

### Operational endpoints

| Route | Purpose |
| ----- | ------- |
| `GET /health` | Load balancer/readiness shim (outside `/swagger`) |
| `GET /api/health` | API-prefixed health for gateway parity |
| `POST /api/auth/*` | **Placeholder** handlers returning stub payloads until persistence + cookie issuance lands |
