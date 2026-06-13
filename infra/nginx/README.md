# Reverse Proxy Routing Blueprint

Production terminates TLS on the host nginx and forwards to the static
landing bundle, three Next.js SSR containers, and the API container.

| Public URL | Backend target |
| --- | --- |
| `https://procraft.uz/` | Static root of **`apps/landing`** `dist/` (unchanged) |
| `https://dashboard.procraft.uz/` | **Next.js `web`** container → `127.0.0.1:3001` ([dashboard.procraft.uz.conf](./dashboard.procraft.uz.conf)) |
| `https://admin.procraft.uz/` | **Next.js `admin`** container → `127.0.0.1:3003` ([admin.procraft.uz.conf](./admin.procraft.uz.conf)) |
| `https://{username}.procraft.uz/` | **Next.js `profiles`** container → `127.0.0.1:3002` ([profiles.procraft.uz.conf](./profiles.procraft.uz.conf)) |
| `https://api.procraft.uz/api/*` | `apps/api` container (`proxy_pass`, [routing.snippet.conf](./routing.snippet.conf)) |
| `https://api.procraft.uz/uploads/*` | API static file middleware |

Implementation notes:

- **`proxy_set_header Host $host` is mandatory** on the profiles vhost — the
  SSR app reads the username from the subdomain in the Host header.
- **Cookies / CSRF are untouched**: auth still talks directly to
  `api.procraft.uz` from the browser with `withCredentials`; nginx in front of
  the Next.js apps never sees auth cookies (`__Host-` cookies are scoped to
  the API host).
- `/_next/static/*` assets are content-hashed → cached immutable for 1 year.
- SSL: keep the existing certbot-managed `listen 443 ssl` + certificate lines;
  only swap the `location` blocks from `root/try_files` to `proxy_pass`.

## Rollback to the legacy static SPAs (~2 minutes)

The legacy Vite apps live on in `apps/web-legacy`, `apps/profiles-legacy`,
`apps/admin-legacy`; `pnpm run build` keeps their `dist/` folders fresh on
every deploy. To roll back a vhost, restore its static block:

```nginx
root /var/www/procraft/apps/web-legacy/dist;   # or profiles-legacy / admin-legacy
index index.html;
location / { try_files $uri $uri/ /index.html; }
```

then `nginx -t && systemctl reload nginx`. No container or DNS changes needed.

Frontend builds default to absolute API URLs from the root `.env`:

```env
VITE_API_URL=https://api.procraft.uz/api
VITE_UPLOADS_URL=https://api.procraft.uz/uploads
```

Uploaded files stay in the API container volume; the browser opens them via
`https://api.procraft.uz/uploads/...`.
