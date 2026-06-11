# `Procraft.Api`

ASP.NET host entrypoint assembling:

- [`Program.cs`](./Program.cs) — Serilog, DI (`AddApplication`, `AddInfrastructure`), cookie policy, CORS, Swagger, middleware ordering, controllers, `/health` map.
- [`Middleware/`](./Middleware/) — `ExceptionHandlingMiddleware`, `CsrfMiddleware` (scaffold).
- [`Extensions/`](./Extensions/) — Swagger, CORS, cookie helpers (`CookieExtensions`), environment-aware JWT bridging (`WireJwtSecretsFromEnvironment`).

See repo-level [`README.md`](../../README.md) for dotnet/ef commands.
