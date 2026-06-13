# React (Vite) → Next.js App Router migratsiyasi

**Sana:** 2026-06-12 · **Stack:** Next.js 14.2 (App Router) + React 18.3.1 (o'zgarmagan)

Bu hujjat — migratsiyaning to'liq hisoboti: route mosligi, SEO, SSR strategiyasi,
API mosligi, topilgan muammolar va rollback. Deploy qadamlari:
[DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 1. Nima o'zgardi (xulosalar jadvali)

| Ilova | Avval | Endi | Hosting |
| --- | --- | --- | --- |
| `apps/web` (dashboard.procraft.uz) | Vite SPA (statik dist) | Next.js App Router, client sahifalar | Docker `web` → 127.0.0.1:3001 |
| `apps/profiles` (*.procraft.uz) | Vite SPA (statik dist) | **Next.js SSR + dinamik metadata** | Docker `profiles` → 127.0.0.1:3002 |
| `apps/admin` (admin.procraft.uz) | Vite SPA (statik dist) | Next.js, client sahifa | Docker `admin` → 127.0.0.1:3003 |
| `apps/landing` (procraft.uz) | Statik HTML (React EMAS) | **O'zgarmagan** | nginx statik (avvalgidek) |
| `apps/web-legacy`, `apps/profiles-legacy`, `apps/admin-legacy` | — | Eski Vite ilovalar saqlangan (rollback) | `dist/` har deployda yangilanadi |
| `packages/*` | — | Import path'lar o'zgarmagan; 2 ta mayda moslik tuzatish | — |

`apps/landing` React emas, sof statik HTML edi (OG, JSON-LD, sitemap, robots
allaqachon ideal); unga tegilmadi — bu eng xavfsiz va SEO jihatdan to'g'ri qaror.

## 2. Route compatibility report

Barcha URL'lar **aynan** saqlandi (kod — haqiqat manbai, router.jsx dan):

| URL (dashboard.procraft.uz) | Legacy | Next.js | Holat |
| --- | --- | --- | --- |
| `/login` | ✅ | `app/(auth)/login` | bir xil |
| `/register` | ✅ | `app/(auth)/register` | bir xil |
| `/reset-password` | ✅ | `app/(auth)/reset-password` | bir xil |
| `/` | ✅ | `app/(dashboard)/page` | bir xil |
| `/profile` | ✅ | `app/(dashboard)/profile` | bir xil |
| `/templates` | ✅ | `app/(dashboard)/templates` | bir xil |
| `/analytics` | ✅ | `app/(dashboard)/analytics` | bir xil |
| `/pdf` | ✅ | `app/(dashboard)/pdf` | bir xil |
| `/subscription` | `Navigate → /` (client) | `redirect('/')` (meta-refresh) | bir xil natija |
| `/settings` | ✅ | `app/(dashboard)/settings` | bir xil |
| `*` (404) | 200 + 404 sahifa | **haqiqiy 404 status** + o'sha sahifa | yaxshilandi |

| URL (*.procraft.uz) | Legacy | Next.js |
| --- | --- | --- |
| `/` (subdomain'dan username) | client fetch | **SSR** |
| `/:username` | client fetch | **SSR** |
| `/?username=demo` (dev fallback) | ✅ | ✅ saqlangan |

admin.procraft.uz `/` — bir sahifa, o'zgarmagan.

Route group'lar `(auth)`/`(dashboard)` URL'ga ta'sir qilmaydi. Google indexlari
va bookmarklar buzilmaydi; dashboard/admin avvalgidek `noindex`.

## 3. SSR/SSG strategiyasi

| Sahifa | Strategiya | Sabab |
| --- | --- | --- |
| `*.procraft.uz` profil sahifalari | **SSR** (`force-dynamic`, `cache: no-store`) | SEO-kritik, har doim yangi kontent; username Host headerdan |
| procraft.uz landing sahifalari | **Statik HTML** (Vite, o'zgarmagan) | SSG'dan ham tezroq, allaqachon ideal SEO |
| dashboard barcha sahifalari | Statik prerender + client hydration | Auth httpOnly cookie'da (api.procraft.uz) — server bu cookie'ni ko'rmaydi; noindex |
| admin | Statik prerender + client | noindex, cookie session |

**Nega dashboard'da server-side guard yo'q:** auth cookie'lari `__Host-` prefiksli
va api.procraft.uz hostiga bog'langan — dashboard.procraft.uz serveriga umuman
yuborilmaydi. Shu sabab guard'lar legacy'dagidek client-side (401 → auth modal /
login redirect). Bu xulq atayin 1:1 saqlandi: anonim foydalanuvchi shell'ni
ko'radi, amal qilmoqchi bo'lsa "Ro'yxatdan o'tish" modali chiqadi.

## 4. SEO report

Profil sahifalari uchun (asosiy yutuq):

- ✅ To'liq server-rendered HTML — JS'siz crawler profil kontentini ko'radi
  (legacy'da bo'sh `<div id="root">` edi).
- ✅ Dinamik `<title>`: `{FullName} — {Title} | Procraft`.
- ✅ Dinamik `description` (bio'dan ~160 belgi).
- ✅ OpenGraph: `og:type=profile`, `og:url`, `og:site_name`, `og:image`
  (avatar; bo'lmasa brand fallback), `og:locale=uz_UZ`.
- ✅ Twitter: `summary_large_image` + title/description/image.
- ✅ `rel=canonical` → `https://{username}.procraft.uz/` (path-route dublikat
  kontent muammosini ham yopadi).
- ✅ Topilmagan profil: **404 status** + `noindex` (legacy 200 qaytarardi).
- ✅ `react-helmet` ishlatilmagan — barcha metadata Next.js Metadata API orqali.

Dashboard/admin: `robots: noindex,nofollow` (legacy bilan bir xil siyosat),
har sahifada o'z `<title>`.

Landing: o'zgarmagan (allaqachon to'liq SEO to'plamiga ega edi).

## 5. API compatibility report

**Backend kontraktiga bironta o'zgartirish kiritilmadi.** Arxitektura qatlami
aynan saqlandi:

```
Component → @procraft/hooks → @procraft/services → @procraft/api (Axios) → API
```

- `packages/api`, `packages/services`, `packages/hooks` — **bitta endpoint ham,
  bitta import path ham o'zgarmagan**.
- Cookie auth (httpOnly + CSRF + refresh interceptor) aynan ishlaydi — token
  hech qaerda localStorage'ga tushmaydi (session hint flag'i avvalgidek qoladi).
- CSRF retry, 401 → refresh → retry oqimi o'zgarmagan (E2E bilan isbotlangan).
- Upload (avatar/sertifikat FormData), PDF blob download — o'zgarmagan, faqat
  client componentlarda ishlaydi.
- Analytics track-view: client-side, profil id bo'yicha bir marta — bot/SSR
  renderlar view hisobini oshirmaydi, double-event yo'q (E2E bilan isbotlangan).

## 6. Packages — kiritilgan yagona o'zgarishlar

| Fayl | O'zgarish | Sabab |
| --- | --- | --- |
| `packages/config/src/env.js` | `NEXT_PUBLIC_*` literal o'qish + `getServerApiBaseUrl()` qo'shildi | Next client bundle'da env build-time inline bo'ladi; VITE_* nomlari saqlanadi |
| `packages/ui/src/logo/LogoMark.jsx` | `typeof logoMark === 'string' ? ... : logoMark?.src` | Vite PNG importni URL string, Next esa StaticImageData qiladi |

Ikkalasi ham Vite (legacy) uchun 100% orqaga mos. Boshqa hech narsa tegilmagan.

## 7. Hydration audit natijalari

Tekshirilgan xavflar va holati:

- `window`/`document`/`localStorage` ishlatilishlari — barchasi effect'lar yoki
  `typeof window === 'undefined'` guard ichida (AuthContext, DashboardLayout,
  useUsername, usePdf, csrf.js). SSR'da xato bermaydi.
- `Math.random` — frontend kodida yo'q. `new Date` — faqat user-triggered
  formatlashda (admin jadvali), render-paytida emas.
- `DashboardLayout`dagi `useLocation().search` ishlatilishi event-handler'larga
  ko'chirildi (`window.location.search`) — `useSearchParams()` Suspense talabidan
  qochish uchun; xulq bir xil.
- `useSearchParams` ishlatadigan login/register sahifalari Suspense boundary
  ichida.
- AntD SSR: `@ant-design/nextjs-registry` (style registry) — FOUC yo'q, theme
  token'lar va `cssVar` kalitlari (`pc`, `pc-profile`, `pc-admin`) o'zgarmagan.
- `DeveloperTemplate` (scroll effekti bor) — `'use client'`; baribir server
  HTML'da to'liq render bo'ladi (SEO saqlanadi), keyin hydrate.

## 8. Topilgan muammolar va yechimlari

1. **ESLint `react/no-unescaped-entities`** o'zbekcha apostroflar (`o'`,
   `ko'nikma`) uchun xato berdi → qoida o'chirildi (stilistik, render to'g'ri).
2. **Windows'da standalone build** symlink ruxsati talab qiladi →
   `output: 'standalone'` faqat `NEXT_OUTPUT_STANDALONE=true` (Docker)da
   yoqiladi; lokal Windows buildlari ham yashil.
3. **PNG import farqi** (Vite URL vs Next StaticImageData) → LogoMark'da
   ikkala formatga mos kod.
4. **Dinamik `process.env[key]` Next clientda inline bo'lmaydi** → env.js'da
   literal `process.env.NEXT_PUBLIC_*` ifodalar; next.config `VITE_*` →
   `NEXT_PUBLIC_*` mapping qiladi (root `.env` nomlari o'zgarmadi).
5. **`src/pages/` katalog nomi** Next'da Pages Router'ni yoqib yuborardi →
   sahifa komponentlari `src/screens/` ga ko'chirildi (kod aynan o'sha).
6. **PowerShell UTF-8 BOM** package.json'larga tushib Vite buildni sindirgan →
   BOM'lar olib tashlandi.
7. **Profiles SSR'da nisbiy `/api` ishlamaydi** → `getServerApiBaseUrl()`:
   `API_INTERNAL_URL` (docker ichki tarmoq, compose'da o'rnatilgan) → absolyut
   `VITE_API_URL` → `https://api.procraft.uz/api` fallback.

## 9. Functional regression yo'qligi isboti

1. **Bir xil E2E spec'lar ikkala target'da o'tadi** (`e2e/`):
   - `pnpm --filter @procraft/e2e test` — Next.js serverlariga qarshi;
   - `pnpm --filter @procraft/e2e run test:legacy` — eski Vite preview'ga qarshi
     (web project).
   Qamrov: login (xato parol, returnTo bilan), register + tasdiqlash kodi,
   logout, 401→refresh→retry, barcha URL'lar render, sidebar navigatsiya,
   /subscription redirect, profil formasi prefill/saqlash/bo'lim qo'shish,
   shablon tanlash, analitika render, PDF download (fayl nomi bilan) va preview,
   sozlamalar saqlash, public profil render, view-track aynan 1 marta, 404.
2. **API mock** — barcha testlar deterministik, real backendga tegmaydi; mock
   hozirgi backend kontraktining o'zi (endpoint'lar services qatlamidan olindi).
3. **Smoke test production API bilan**: SSR sahifa real `rax1mjon` profili bilan
   tekshirildi — to'liq HTML + barcha meta teglar, 404 holati ham.
4. **Build matritsasi yashil**: 3 Next app + 3 legacy Vite app + landing +
   NestJS api — `pnpm run build` 16/16.

UI regression bo'yicha: komponentlar va CSS fayllar **aynan nusxa** (global.css,
template CSS'lari, antd theme token'lari baytma-bayt bir xil); o'zgargan yagona
narsa — router primitivlar (`Link to→href`, `useNavigate→useRouter`). Pixel
darajada farq kutilmaydi, chunki style manbalari o'zgarmagan.

## 10. Performance

- Next.js avtomatik route-level code splitting (First Load JS: login 262kB →
  asosan antd; legacy bundle bilan solishtirarli).
- `/_next/static` — content-hash + immutable cache (nginx'da ham 1 yil).
- Profil sahifalari endi serverda render — birinchi mazmunli render (FCP/LCP)
  SPA spinner'idan tezroq, SEO bonus.
- AntD style registry — kritik CSS server javobida (FOUC yo'q).
- Rasm optimallashtirish: template preview'lar `<Image>` antd komponentida
  qoldi (xulq parity); keyingi bosqichda next/image'ga o'tish mumkin (ixtiyoriy).

## 11. Rollback

To'liq qo'llanma: [DEPLOYMENT.md](./DEPLOYMENT.md#rollback--eski-vite-frontendga-qaytish-2-daqiqa)
va [infra/nginx/README.md](../infra/nginx/README.md). Qisqacha: legacy ilovalar
`apps/*-legacy`da yashaydi, `pnpm run build` ularning `dist/`ini har deployda
yangilab turadi; rollback = nginx vhost'ni `proxy_pass`dan `root+try_files`ga
qaytarish + `systemctl reload nginx` (~2 daqiqa, konteyner/DNS o'zgarishsiz).

## 12. Production deployment checklist

- [ ] `git pull origin main` (server: /var/www/procraft)
- [ ] `pnpm install --no-frozen-lockfile`
- [ ] `pnpm run build` — 16/16 yashil (legacy dist'lar ham yangilanadi)
- [ ] `docker compose build web profiles admin`
- [ ] `docker compose up -d web profiles admin` (api/postgres'ga tegmaydi)
- [ ] `curl -s 127.0.0.1:3001/login | grep -c Procraft` → ≥1
- [ ] `curl -s -H "Host: rax1mjon.procraft.uz" 127.0.0.1:3002/ | grep -c og:title` → 1
- [ ] `curl -s 127.0.0.1:3003/ | grep -c Procraft` → ≥1
- [ ] nginx vhost'larni almashtirish (infra/nginx/*.conf bo'yicha), `nginx -t`,
      `systemctl reload nginx`
- [ ] Brauzerda: login → dashboard → profil tahrir → shablon → PDF → logout
- [ ] `https://{user}.procraft.uz` — view-source'da og:title ko'rinishi
- [ ] Google Search Console'da profil URL'ni "URL inspection" bilan tekshirish
- [ ] Muammo bo'lsa: nginx rollback (yuqorida)
