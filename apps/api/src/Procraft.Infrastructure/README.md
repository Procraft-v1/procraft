# `Procraft.Infrastructure`

Implements `Procraft.Application` ports: PostgreSQL EF Core, password hashing (`PasswordHasher` / `IPasswordHasher`), HttpOnly auth cookie helpers (`CookieService` / `ICookieService`), JWT access tokens (`TokenService` / `ITokenService`), request metadata (`RequestContextService` / `IRequestContext`), PDF stub (`QuestPdfService`), uploads (`LocalFileStorageService`), SMTP + Telegram stubs, and design-time tooling (`DesignTimeDbContextFactory`).

## Persistence

- `ApplicationDbContext` applies configurations from `Persistence/Configurations/*`.
- `DesignTimeDbContextFactory` resolves `DATABASE_URL` or `ConnectionStrings__DefaultConnection` for `dotnet ef` tooling.

## EF Core migrations

Run from `apps/api/src/Procraft.Api`:

```powershell
dotnet ef migrations add <MigrationName> `
  --project ..\Procraft.Infrastructure\Procraft.Infrastructure.csproj `
  --startup-project Procraft.Api.csproj `
  --output-dir Persistence\Migrations
```

Apply to PostgreSQL:

```powershell
dotnet ef database update `
  --project ..\Procraft.Infrastructure\Procraft.Infrastructure.csproj `
  --startup-project Procraft.Api.csproj
```

Ensure Postgres is reachable before running updates.

## Security

- Sensitive values (`Jwt:Secret`, `JWT_SECRET`, DB passwords, SMTP/API tokens) come from secrets or environment — never commit real values.
