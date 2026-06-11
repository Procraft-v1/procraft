# Backend migratsiya hisoboti: ASP.NET Core → NestJS

**Sana:** 2026-06-11 · **Holat:** Production'da jonli (`https://api.procraft.uz`)

Backend `apps/api` da to'liq NestJS (TypeScript) ga ko'chirildi. Eski ASP.NET Core
backend **o'chirilmagan** — `apps/api-dotnet` da rollback uchun saqlanadi.

---

## 1. API compatibility report

Barcha endpointlar URL, HTTP method, request/response shakli, status kodlar va
xato formatlari bo'yicha C# implementatsiyasi bilan birxillashtirildi.

### Endpointlar (33 ta, barchasi portlandi)

| Route | Method(lar) | Auth | Izoh |
| --- | --- | --- | --- |
| `/health`, `/api/health` | GET | — | `{"status":"Healthy"}` |
| `/api/auth/csrf` | GET | — | 204 + CSRF cookie |
| `/api/auth/register`, `/register/verify` | POST | — | Challenge + 4 xonali kod |
| `/api/auth/login`, `/login/verify` | POST | — | `{user}` + HttpOnly cookielar |
| `/api/auth/password/forgot`, `/password/reset` | POST | — | Reset flow |
| `/api/auth/me` | GET | JWT | `{user}` |
| `/api/auth/refresh`, `/logout` | POST | — | Token rotation / revoke |
| `/api/auth/account` | PUT, DELETE | JWT | Akkaunt yangilash/o'chirish |
| `/api/profile` | POST, PUT | JWT | Mutatsiyalarda bo'limlar bo'sh massiv (C# bilan bir xil) |
| `/api/profile/me` | GET | JWT | To'liq profil + bo'limlar |
| `/api/profile/{username}` | GET | — | Ommaviy profil |
| `/api/profile/template/{id:guid}` | POST | JWT | Guid bo'lmasa 404 (route constraint pariteti) |
| `/api/profile/avatar` | POST, DELETE | JWT | multipart `file`, 5MB, jpg/png/webp |
| `/api/profile/{skills,skill-categories,projects,experiences,educations,certificates,social-links,custom-sections}` | GET, POST, PUT/{id}, DELETE/{id} | JWT | To'liq CRUD |
| `/api/profile/certificates` | POST/PUT (JSON **va** multipart) | JWT | 10MB limit, pdf/jpg/png/webp |
| `/api/profile/certificates/file` | POST | JWT | `{url}` |
| `/api/analytics/track` | POST | — | PageView yozadi |
| `/api/analytics/summary` | GET | JWT | totalViews/topCountries/viewsByDate/recentVisitors |
| `/api/templates` | GET | — | Aktiv shablonlar |
| `/api/subscriptions/me` | GET | JWT | Yo'q bo'lsa `Trial` (id = bo'sh GUID) |
| `/api/pdf/download?templateSlug=` | GET | JWT | `application/pdf`, `resume.pdf` |
| `/api/admin/{login,logout,me,stats}` | POST/GET | Admin cookie | CSRF'dan ozod (C# bilan bir xil) |

### Xato formatlari (aynan bir xil)

- 400 — `{"message":"Validation failed","errors":{"<camelCaseField>":["..."]}}`
  (FluentValidation'ning standart xabar matnlari, jumladan PascalCase→"Email Or
  Username" display-name bo'linishi takrorlangan)
- 401 — `{"message":"..."}` (`"Not authenticated."`, `"Invalid credentials."` va h.k.)
- 403 — `{"title":"CSRF validation failed","detail":"..."}` / `{"title":"CSRF token mismatch"}`
- 404 — `{"message":"..."}` · 409 — `{"message":"Conflict","errors":{...}}`
- 500 — `{"message":"An unexpected error occurred."}`

### Serializatsiya pariteti

- `DateTimeOffset` → `2026-06-11T17:26:23.473+00:00` (`Z` emas, `+00:00` — C# bilan bir xil)
- `DateOnly` → `yyyy-MM-dd` · GUID → kichik harfli uuid
- Bo'limlar tartibi: SortOrder + ikkilamchi kalit (nom/sana DESC), NULLS FIRST
  semantikasi ham bir xil (ikkalasi ham Postgres DESC default)

### Ma'lum mayda farqlar (frontendga ta'sir qilmaydi)

1. JSON'da tip xato bo'lganda (masalan `verificationId` ga guid bo'lmagan satr)
   ASP.NET `ProblemDetails` qaytarar edi; NestJS `{"message":"Validation failed",...}`
   qaytaradi. Frontend faqat `message`/`errors` maydonlarini o'qiydi — ta'sir yo'q.
2. Swagger faqat Development muhitida, C# dagidek (`/swagger`).

---

## 2. Database safety report

**Mavjud ma'lumotlar uchun kafolat:** NestJS hech qachon schema yaratmaydi yoki
o'zgartirmaydi, faqat **EF Core'ning o'z migration history jadvalini** o'qiydi.

- `synchronize: false`, `migrationsRun: false` — TypeORM schema'ga tegmaydi.
- Startupda `apps/api/src/database/ef-migrations.ts` ishlaydi:
  `__EFMigrationsHistory` jadvalini tekshiradi; 16 ta migration ID **aynan**
  C# migratsiyalari bilan bir xil. Mavjud production bazada barcha ID'lar
  yozilgan → **hech narsa bajarilmaydi (no-op)**. Yangi bazada EF bilan ayni
  DDL (jadval/ustun/indeks/FK nomlari birga-bir) yaratiladi.
- Entitylar EF konfiguratsiyasiga 1:1: snake_case jadvallar, PascalCase ustunlar
  (`"Id"`, `"CreatedAt"`...), bir xil uzunlik cheklovlari.
- `TemplateSeeder` pariteti: slug bo'yicha idempotent upsert.
- `StaticAccountSeeder` faqat Development muhitida (C# bilan bir xil).
- Destruktiv amallar yo'q: DROP/TRUNCATE/reset yo'q (`RemoveProfileWebsite`
  migratsiyasidagi tarixiy `DROP COLUMN` faqat yangi bazada, EF'dagi bilan bir xil).
- E2E test isboti: migratsiya runneri ikki marta ishga tushirilganda ikkinchi
  ishga tushish hech narsa qo'shmasligi testlangan.
- **Rollback mosligi:** history jadvali EF formatida to'ldirilgani uchun .NET
  backend qayta ishga tushirilsa, barcha migratsiyalarni "applied" deb ko'radi.

## 3. Auth/parol mosligi (isbotlangan)

- **Parol hash:** ASP.NET Identity `PasswordHasher` V3 (PBKDF2-HMAC-SHA512,
  100k iteratsiya) bayt darajasida portlandi. Cross-validation o'tkazildi:
  - .NET yaratgan 3 ta haqiqiy hash Node'da `verify=true` ✓
  - Node yaratgan hash .NET'da `VerifyHashedPassword → Success` ✓
  - V2 (eski) format ham qo'llab-quvvatlanadi.
  **Mavjud foydalanuvchilar parollari o'zgarishsiz ishlaydi.**
- **JWT:** HS256, bir xil `iss`/`aud`/15min, claimlar C# `JwtSecurityTokenHandler`
  chiqargani bilan bir xil: `sub`, `nameid`, `email`, `preferred_username`,
  `unique_name`. Eski (C# bergan) tokenlar NestJS'da valid; NestJS tokenlari
  rollbackda C#'da valid.
- **Refresh token:** 48-bayt base64 plaintext cookie'da; bazada SHA-256 **katta
  harfli hex** (Convert.ToHexString pariteti) — mavjud qatorlar mos. Rotation +
  reuse-detection (oilani to'liq revoke qilish) birga-bir portlandi.
- **Tasdiqlash kodlari:** `HMACSHA256(JWT_SECRET, "{guidN}:{code}")` katta harfli
  hex — bir xil; 5 urinish limiti, 5 daqiqa amal qilish muddati bir xil.
- **Cookielar:** `__Host-procraft_access` / `__Host-procraft_refresh` (HttpOnly,
  Secure, SameSite=None, Path=/), `procraft_csrf` (o'qiladigan, Domain=.procraft.uz),
  `procraft_admin_session` (SHA-256 token, 12 soat, Lax) — nomlar va flaglar bir xil.
- **CSRF:** double-submit (cookie ↔ `X-CSRF-TOKEN`); OPTIONS/HEAD, `/swagger`,
  `/health`, `/api/admin` dan tashqari barcha POST/PUT/PATCH/DELETE'da talab
  qilinadi; muvaffaqiyatli login/register/refresh'dan keyin avtomatik beriladi.

## 4. Environment compatibility report

`.env` o'zgaruvchi nomlari **bittasi ham o'zgarmadi**. NestJS ConfigModule aynan
shu nomlarni o'qiydi:

`POSTGRES_DB/USER/PASSWORD`, `DATABASE_URL` (ADO.NET formatini ham, URI'ni ham
parse qiladi), `ConnectionStrings__DefaultConnection`, `JWT_SECRET`, `JWT_ISSUER`,
`JWT_AUDIENCE`, `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`,
`JWT_ACCESS_COOKIE_NAME`, `JWT_REFRESH_COOKIE_NAME`, `CSRF_COOKIE_NAME`,
`CSRF_COOKIE_DOMAIN`, `JWT_COOKIE_SAMESITE`, `JWT_COOKIE_SECURE`,
`CORS_ALLOWED_ORIGINS`, `UPLOADS_ROOT`, `ADMIN_USERNAME/PASSWORD`,
`ADMIN_SESSION_SECRET` (`Admin__*` variantlari ham), `Smtp__Host/Port/Username/
Password/FromAddress/FromName/EnableSsl`, `ASPNETCORE_ENVIRONMENT` (muhit
semantikasi uchun o'qiladi — Production posture'ni shu belgilaydi).

`.env` faylini qidirish ham C# bilan bir xil: joriy papkadan yuqoriga qarab
birinchi topilgan `.env`; mavjud env o'zgaruvchilar ustunlik qiladi.

## 5. Frontend o'zgarishsizligi isboti

- `packages/api` (axios klienti) bitta satr ham o'zgarmadi: `withCredentials`,
  `X-CSRF-TOKEN` header, 403'da `/auth/csrf` retry, 401'da `/auth/refresh` retry —
  barchasi yangi backend bilan ayni shartnomada ishlaydi.
- Production smoke-test **real nginx + HTTPS orqali** frontend klienti yuboradigan
  ayni so'rovlar bilan o'tdi (register→verify→me→profile→skills→public→refresh→
  pdf→subscription→analytics→delete). Frontend buildlari o'zgarishsiz deploy
  qilindi va ishlayapti (procraft.uz, dashboard.procraft.uz, admin.procraft.uz — 200).

## 6. Topilgan muammolar va yechimlari

| # | Muammo | Yechim |
| --- | --- | --- |
| 1 | TypeORM query builder'da `user` aliasi Postgres zahiralangan so'zi bilan to'qnashdi (ommaviy profil 500) | Alias `owner` ga almashtirildi; e2e test qo'shildi |
| 2 | pnpm workspace ichida yaratilgan `package-lock.json` to'liqsiz chiqdi (`npm ci` yiqildi) | Lockfile toza muhitda qayta yaratildi (579 paket) |
| 3 | Nest 11 Express 5 ishlatadi (path-to-regexp/middleware xulq farqlari xavfi) | Barqaror Nest 10 + Express 4 tanlandi |
| 4 | C# `Convert.ToHexString` katta harfli hex berishi — e'tibordan chetda qolsa, mavjud refresh-token/kod hashlari mos kelmasdi | Barcha hashlarda `.toUpperCase()` qo'llandi, testlar bilan mustahkamlandi |
| 5 | ASP.NET'da mutatsiya javoblarida profil bo'limlari bo'sh massiv bo'lib qaytadi (Include yo'q) | Ayni xulq ataylab saqlandi |
| 6 | Serverdagi `.env`da SMTP bo'sh — email stub aktiv (kodlar `docker compose logs api` da) | Haqiqiy yetkazish uchun `Smtp__Host/Username/Password` to'ldirib `docker compose up -d` qiling |

## 7. Test natijalari

- **E2E:** 65/65 o'tdi (serverda, Docker'dagi PostgreSQL 16 bilan): auth to'liq
  (register/verify/login/refresh/reuse-detection/logout/forgot/reset), profil CRUD,
  8 ta bo'lim CRUD, fayl yuklash (avatar/sertifikat), ommaviy profil, analytics,
  templates, subscriptions, admin, PDF, CSRF, validatsiya xabarlari pariteti,
  parol-hash vektorlari, JWT claim pariteti, migratsiya idempotentligi.
- **Production smoke-test:** to'liq flow HTTPS orqali o'tdi (yuqorida).
- Ishga tushirish: `pnpm --filter @procraft/api-backend test` (Docker talab qilinadi).
