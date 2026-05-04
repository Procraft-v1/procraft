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

Copy `.env.example` to `.env.local` for Vite apps as needed locally. **Do not commit secrets.**
