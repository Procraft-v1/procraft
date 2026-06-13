# @procraft/web — dashboard.procraft.uz

Next.js (App Router) dashboard. Same URLs as the legacy SPA: `/login`,
`/register`, `/reset-password`, `/`, `/profile`, `/templates`, `/analytics`,
`/pdf`, `/settings` (`/subscription` → `/`). All screens are client components
(auth lives behind httpOnly cookies on the API host); the app is `noindex`.

- `pnpm dev` → http://localhost:5174
- `pnpm build` / `pnpm start` (port 3001)
- Production: Docker standalone image ([Dockerfile](./Dockerfile)), proxied by
  nginx ([infra/nginx](../../infra/nginx/)).
- Env: same `VITE_*` names from the root `.env` (mapped to `NEXT_PUBLIC_*` in
  [next.config.mjs](./next.config.mjs)).

Rollback target: [apps/web-legacy](../web-legacy/) (see
[docs/NEXTJS_MIGRATION.md](../../docs/NEXTJS_MIGRATION.md)).
