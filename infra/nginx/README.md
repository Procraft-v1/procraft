# Reverse proxy routing blueprint

Production terminates TLS here and forwards to static bundles (`landing`, `web`, `profiles`) plus the ASP.NET container.

| Public URL                             | Backend target                                                     |
| -------------------------------------- | ------------------------------------------------------------------ |
| `https://procraft.uz/`                 | Static root of **`apps/landing`** `dist/`                          |
| `https://procraft.uz/dashboard/*`      | Static **`apps/web`** SPA + `try_files` fallback → `index.html`   |
| `https://username.procraft.uz/`        | Static **`apps/profiles`** bundle (subdomain vhost map)           |
| `https://procraft.uz/api/*`            | `apps/api` container (`proxy_pass`)                                |
| `https://procraft.uz/uploads/*`        | Object storage gateway or ASP.NET static file middleware          |

Implementation notes:

- Enable **sticky nothing** requirement for SPA; caching headers differ (`landing` long-cache assets, `/dashboard/` no-store HTML if needed during releases).
- **Cookies**: shared parent domain `.procraft.uz` ensures HttpOnly JWT cookies reach SPA + API (see [`docs/AUTH_STRATEGY.md`](../../docs/AUTH_STRATEGY.md)).
- **CSRF**: ensure unsafe verbs reach only the origin that can mint anti-forgery tokens.
- **Profiles SEO**: optionally issue edge-rendered HTML for bots while keeping dynamic hydration for authenticated owners elsewhere.

Companion snippet [`routing.snippet.conf`](./routing.snippet.conf) models `/api/` + `/uploads/` proxying — compose into hardened production configs before rollout.
