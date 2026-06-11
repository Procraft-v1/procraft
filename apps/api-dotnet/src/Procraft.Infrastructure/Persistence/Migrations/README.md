# EF Core migrations

Commands are documented in the parent [`README.md`](../../README.md) for this project.

Typical first migration after schema changes:

```powershell
cd apps/api/src/Procraft.Api
dotnet ef migrations add InitialAuth --project ..\Procraft.Infrastructure\Procraft.Infrastructure.csproj --startup-project Procraft.Api.csproj --output-dir Persistence\Migrations
dotnet ef database update --project ..\Procraft.Infrastructure\Procraft.Infrastructure.csproj --startup-project Procraft.Api.csproj
```

Requires the .NET 8 SDK and PostgreSQL connectivity (`ConnectionStrings:DefaultConnection` or `DATABASE_URL`).
