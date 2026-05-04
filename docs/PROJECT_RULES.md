# Project rules

This document aligns day-to-day decisions with [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Product scope reminders

Procraft combines four user-facing planes:

1. **Marketing** (`apps/landing`) — SEO-critical, intentionally separate from SPA dashboards.
2. **Product UI** (`apps/web`) — auth + subscription-gated workspaces.
3. **Public portfolios** (`apps/profiles`) — subdomain-hosted, SEO-aware experiences.
4. **API + data** (`apps/api`) — sole owner of identities, persistence, billing webhooks.

## Repo hygiene

- No secrets (`JWT signing keys`, database passwords, third-party tokens) checked into git — ever.
- Prefer `.env` / secret managers for local dev; `.env.example` lists **names only**.
- Frontend never stores bearer tokens in `localStorage`/`sessionStorage` for session auth paths (see [`AUTH_STRATEGY.md`](./AUTH_STRATEGY.md)).
- Respect package boundaries enumerated in [`FRONTEND_RULES.md`](./FRONTEND_RULES.md).

## Contribution tone

Skeleton PRs introduce structure; feature PRs flesh behavior with tests touching the owning layer (`Application.Tests`, `Api.Tests`, plus future Playwright/unit FE tests).
