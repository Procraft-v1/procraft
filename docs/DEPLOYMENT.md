# Deploy va Rollback qo'llanmasi

**Server:** Ubuntu 24.04 (84.247.130.79) · Repo: `/var/www/procraft` · Compose: repo ildizida

## Arxitektura (production)

```
Cloudflare/DNS
   │
nginx (host, SSL):
   ├─ procraft.uz            → /var/www/procraft/apps/landing/dist  (statik)
   ├─ dashboard.procraft.uz  → /var/www/procraft/apps/web/dist      (statik)
   ├─ admin.procraft.uz      → /var/www/procraft/apps/admin/dist    (statik)
   ├─ *.procraft.uz          → /var/www/procraft/apps/profiles/dist (statik)
   └─ api.procraft.uz        → 127.0.0.1:8080  ──►  docker: api (NestJS)
                                                      │
                                              docker: postgres:16
                                              volumes: postgres_data, uploads_data
```

`.env` — `/var/www/procraft/.env` (chmod 600). Bu fayl ham docker compose, ham
Vite frontend buildlari uchun yagona manba. **Nomlarini o'zgartirmang.**

## Backend deploy (yangilash)

```bash
cd /var/www/procraft
git pull origin main
docker compose build api
docker compose up -d          # faqat api qayta yaratiladi, postgres joyida qoladi
docker compose ps             # ikkalasi ham "healthy" bo'lishi kerak
curl -s https://api.procraft.uz/health   # {"status":"Healthy"}
```

Eslatmalar:
- API konteyneri startupda migratsiyalarni tekshiradi — mavjud bazada no-op.
- Yuklangan fayllar `uploads_data` volume'da — image almashganda saqlanadi.
- `restart: unless-stopped` — server qayta yonganda konteynerlar o'zi ko'tariladi.

## Frontend deploy (yangilash)

```bash
cd /var/www/procraft
git pull origin main
pnpm install --no-frozen-lockfile
pnpm run build                # to'rttala frontend dist'i yangilanadi
# nginx to'g'ridan-to'g'ri dist papkalardan o'qiydi — reload kerak emas
```

## Production checklist

- [x] `docker compose ps` — api va postgres `healthy`
- [x] `https://api.procraft.uz/health` → `{"status":"Healthy"}`
- [x] `https://api.procraft.uz/api/templates` → 5 ta shablon
- [x] CSRF cookie `Domain=.procraft.uz; Secure; SameSite=None`
- [x] Register → verify → me → profile → PDF flow (smoke-test o'tdi)
- [x] procraft.uz / dashboard / admin — 200
- [ ] **SMTP**: `/var/www/procraft/.env` da `Smtp__Host/Username/Password`
      to'ldirilmagan — email stub aktiv. Haqiqiy ro'yxatdan o'tish emaili uchun
      Resend (yoki boshqa SMTP) ma'lumotlarini kiriting va `docker compose up -d`.
      Stub rejimida tasdiqlash kodlari `docker compose logs api` da ko'rinadi.
- [ ] ADMIN_PASSWORD `.env` da generatsiya qilingan — kerak bo'lsa o'zgartiring.

## ROLLBACK — eski ASP.NET backendga qaytish (~3 daqiqa)

Eski backend `apps/api-dotnet` da to'liq saqlangan. Bazaga til tegmaydi:
NestJS EF history jadvalini EF formatida yuritgani uchun .NET barcha
migratsiyalarni "applied" deb ko'radi.

```bash
cd /var/www/procraft

# 1. Compose'ga vaqtincha override: build kontekstini eski backendga burish
cat > docker-compose.rollback.yml <<'EOF'
services:
  api:
    build:
      context: ./apps/api-dotnet
      dockerfile: Dockerfile
    environment:
      ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=${POSTGRES_DB:-procraft};Username=${POSTGRES_USER:-procraft};Password=${POSTGRES_PASSWORD}"
      JWT_ACCESS_COOKIE_NAME: ${JWT_ACCESS_COOKIE_NAME:-__Host-procraft_access}
      JWT_REFRESH_COOKIE_NAME: ${JWT_REFRESH_COOKIE_NAME:-__Host-procraft_refresh}
      CSRF_COOKIE_NAME: ${CSRF_COOKIE_NAME:-procraft_csrf}
      CSRF_COOKIE_DOMAIN: ${CSRF_COOKIE_DOMAIN:-.procraft.uz}
      JWT_COOKIE_SAMESITE: ${JWT_COOKIE_SAMESITE:-None}
      JWT_COOKIE_SECURE: ${JWT_COOKIE_SECURE:-true}
      Admin__Username: ${ADMIN_USERNAME:-admin}
      Admin__Password: ${ADMIN_PASSWORD}
      Admin__SessionSecret: ${ADMIN_SESSION_SECRET}
EOF

# 2. Eski image bilan qayta ko'tarish
docker compose -f docker-compose.yml -f docker-compose.rollback.yml build api
docker compose -f docker-compose.yml -f docker-compose.rollback.yml up -d
curl -s https://api.procraft.uz/health

# 3. NestJS'ga qaytish:
docker compose build api && docker compose up -d
```

Rollbackda foydalanuvchi sessiyalari saqlanadi: JWT'lar, refresh tokenlar va
parollar ikkala backendda ham bir xil formatda.

## Foydali buyruqlar

```bash
docker compose logs -f api                 # jonli loglar
docker compose logs api | grep "kodi:"     # email-stub tasdiqlash kodlari
docker compose exec postgres psql -U procraft procraft   # bazaga kirish
docker compose exec postgres pg_dump -U procraft procraft > backup.sql  # backup
```
