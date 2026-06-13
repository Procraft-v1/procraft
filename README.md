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
| `apps/landing` | SEO-first static marketing site            |
| `apps/web`     | Auth + dashboard (**Next.js App Router**) |
| `apps/profiles`| Public portfolios, SSR (**Next.js**, `username.` subdomain) |
| `apps/admin`   | Admin stats panel (**Next.js**)           |
| `apps/*-legacy`| Preserved Vite SPAs (instant rollback targets) |
| `apps/api`     | NestJS API (`apps/api-dotnet` is the retired .NET backend) |
| `packages/*`   | Shared frontend layers (see ARCHITECTURE) |
| `e2e/`         | Playwright E2E suite (runs against Next **and** legacy) |
| `docs/`        | Project rules and architecture docs        |
| `infra/nginx/` | Production routing reference               |

> Frontend migration details (Vite → Next.js): [`docs/NEXTJS_MIGRATION.md`](docs/NEXTJS_MIGRATION.md)

## Documentation

Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), then [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md).

## Environment

Copy `.env.example` to `.env` for local Docker and Vite defaults. Use `.env.local` for app-specific Vite overrides when needed. **Do not commit secrets.**
