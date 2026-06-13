# @procraft/profiles — *.procraft.uz

Next.js (App Router) public portfolios with **SSR + dynamic metadata** (title,
description, OpenGraph, Twitter, canonical) — the SEO-critical surface.

- Username resolution: `{username}.procraft.uz` subdomain (Host header) →
  `?username=demo` dev fallback → `/{username}` path route.
- Profile data is fetched server-side (`API_INTERNAL_URL` → absolute
  `VITE_API_URL` → `https://api.procraft.uz/api`), always fresh (`no-store`).
- View tracking stays client-side and fires once per profile — crawler hits
  don't inflate analytics.
- Unknown profile → real **404** + "Profile not found." alert.

`pnpm dev` → http://localhost:5175/?username=demo · prod port 3002 (Docker).

Rollback target: [apps/profiles-legacy](../profiles-legacy/).
