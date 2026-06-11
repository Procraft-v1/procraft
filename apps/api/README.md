# Procraft API (NestJS)

ASP.NET Core backendning to'liq paritetli NestJS porti. Eski C# kodi rollback
uchun [`apps/api-dotnet`](../api-dotnet) da saqlanadi. Endpoint shartnomasi,
cookie/JWT formatlari, xato javoblari va baza sxemasi o'zgarmagan — batafsil:
[`docs/MIGRATION_REPORT.md`](../../docs/MIGRATION_REPORT.md).

## Arxitektura

```
src/
├── main.ts                  # .env qidiruvi (C# LoadEnvironmentFile pariteti) + bootstrap
├── app.factory.ts           # Middleware pipeline (ASP.NET tartibida) — test bilan umumiy
├── app.module.ts            # TypeORM (synchronize: false) + controllerlar
├── config/env.ts            # Env nomlari .NET bilan birxil; ADO.NET conn-string parser
├── common/                  # Exceptionlar, global filter (C# xato formati),
│   │                        # FluentValidation-paritetli validator, sana serializatsiya
│   └── guid-param.pipe.ts   # {id:guid} route constraint pariteti (404)
├── database/
│   ├── entities.ts          # EF sxemasiga 1:1 (snake_case jadval, PascalCase ustun)
│   ├── ef-migrations.ts     # __EFMigrationsHistory bilan ishlaydigan migration runner
│   └── seed.ts              # TemplateSeeder + StaticAccountSeeder (faqat dev)
├── auth/                    # TokenService (HS256, C# claimlari), PasswordHasher
│   │                        # (Identity V3 PBKDF2 — bayt mosligi isbotlangan),
│   └──                      # CookieService, CSRF middleware, JWT guard
├── profile/                 # Profil CRUD + avatar + ommaviy profil
├── sections/                # 8 ta bo'lim: skills, skill-categories, projects,
│                            # experiences, educations, certificates, social-links,
│                            # custom-sections
├── analytics/ templates/ subscriptions/ admin/ pdf/ health/
├── email/                   # nodemailer (Smtp__* env), stub xulqi C# bilan bir xil
└── storage/                 # /uploads lokal fayl saqlash (yo'l/URL formati bir xil)
```

## Ishga tushirish

```bash
pnpm install
pnpm --filter @procraft/api-backend dev     # ts-node-dev, PORT=8080
pnpm --filter @procraft/api-backend build   # tsc → dist/
pnpm --filter @procraft/api-backend test    # e2e (Docker'da Postgres ko'taradi)
```

Konfiguratsiya `.env` dan (repo ildizidan yuqoriga qidiriladi). Majburiy:
`JWT_SECRET` (≥32 belgi), `JWT_ISSUER`, `JWT_AUDIENCE`, `DATABASE_URL` yoki
`ConnectionStrings__DefaultConnection`. Swagger faqat Development'da: `/swagger`.

## Muhim invariantlar (buzmaslik shart)

1. **TypeORM `synchronize` hech qachon yoqilmasin** — sxemaga faqat
   `ef-migrations.ts` egalik qiladi.
2. Yangi migratsiya qo'shganda EF uslubidagi ID (`yyyyMMddHHmmss_Nom`) bilan
   `MIGRATIONS` ro'yxati oxiriga qo'shing — rollback mosligi saqlansin.
3. Hash funksiyalarida **katta harfli hex** (`Convert.ToHexString` pariteti).
4. Mutatsiya javoblarida profil bo'limlari bo'sh massiv bo'lib qaytadi —
   bu C# xulqi, frontend shunga mos.
