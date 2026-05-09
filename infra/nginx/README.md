# Reverse Proxy Routing Blueprint

Production terminates TLS here and forwards to static bundles (`landing`, `web`, `profiles`) plus the ASP.NET container.

| Public URL | Backend target |
| --- | --- |
| `https://procraft.uz/` | Static root of **`apps/landing`** `dist/` |
| `https://procraft.uz/dashboard/*` | Static **`apps/web`** SPA + `try_files` fallback to `index.html` |
| `https://username.procraft.uz/` | Static **`apps/profiles`** bundle (subdomain vhost map) |
| `https://procraft.uz/api/*` | `apps/api` container (`proxy_pass`) |
| `https://procraft.uz/uploads/*` | ASP.NET static file middleware or object storage gateway |

Implementation notes:

- Enable **sticky nothing** requirement for SPA; caching headers differ (`landing` long-cache assets, `/dashboard/` no-store HTML if needed during releases).
- **Cookies**: shared parent domain `.procraft.uz` ensures HttpOnly JWT cookies reach SPA + API (see [`docs/AUTH_STRATEGY.md`](../../docs/AUTH_STRATEGY.md)).
- **CSRF**: ensure unsafe verbs reach only the origin that can mint anti-forgery tokens.
- **Profiles SEO**: optionally issue edge-rendered HTML for bots while keeping dynamic hydration for authenticated owners elsewhere.

Companion snippet [`routing.snippet.conf`](./routing.snippet.conf) models `/api/` + `/uploads/` proxying. Compose it into hardened production configs before rollout.

Frontend builds should use relative public paths:

```env
VITE_API_URL=/api
VITE_UPLOADS_URL=/uploads
```

Uploaded files stay in the API container volume, but the browser opens them through `https://procraft.uz/uploads/...`; nginx forwards that path to the ASP.NET static file middleware.
