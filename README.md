# Procraft

Monorepo for **Procraft** — a professional portfolio and ATS-friendly résumé SaaS (landing, dashboards, public profiles, ASP.NET Core API).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [.NET SDK](https://dotnet.microsoft.com/download/dotnet/8.0) **8.x** (`apps/api` targets `net8.0`; bump `TargetFramework` when upgrading toolchains)

## Scripts

| Command       | Description                    |
| ------------- | ------------------------------ |
| `pnpm install` | Install dependencies         |
| `pnpm dev`     | Dev mode (Turbo orchestration) |
| `pnpm build`   | Production builds               |

Individual apps expose their own `dev`/`build` scripts; see each `apps/*/README.md`.

## Getting Started

### 1. Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill the required values. Do not commit secrets.

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

The default local development connection string uses:

```text
Host=127.0.0.1;Port=5432;Database=procraft;Username=postgres;Password=postgres
```

For local overrides, prefer .NET user secrets from `apps/api`:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=127.0.0.1;Port=5432;Database=procraft;Username=postgres;Password=postgres"
```

### 4. Start the frontend apps

```bash
pnpm dev
```

Or run one app:

```bash
pnpm --filter @procraft/web dev
```

### 5. Start the API

```bash
cd apps/api
dotnet run --project src/Procraft.Api/Procraft.Api.csproj
```

Swagger is available in Development at `http://localhost:5080/swagger`.

## API Environment

The API requires these values at runtime:

| Variable | Example |
| --- | --- |
| `ConnectionStrings__DefaultConnection` or `DATABASE_URL` | `Host=localhost;Port=5432;Database=procraft;Username=postgres;Password=postgres` |
| `JWT_SECRET` | At least 32 random characters |
| `JWT_ISSUER` | `procraft.local` |
| `JWT_AUDIENCE` | `procraft.local` |

Development can use `appsettings.Development.json`, environment variables, or `dotnet user-secrets`.

## Repo map

| Path           | Role                                      |
| -------------- | ----------------------------------------- |
| `apps/landing` | SEO-first marketing site (separate SPA)    |
| `apps/web`     | Auth + dashboard SPA                     |
| `apps/profiles`| Public portfolios (`username.` subdomain)  |
| `apps/api`     | ASP.NET Core API (Clean Architecture)    |
| `packages/*`   | Shared frontend layers (see ARCHITECTURE) |
| `docs/`        | Project rules and architecture docs        |
| `infra/nginx/` | Production routing reference               |

## Documentation

Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), then [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md).

## Environment

Copy `.env.example` to `.env` for local Docker and Vite defaults. Use `.env.local` for app-specific Vite overrides when needed. **Do not commit secrets.**
