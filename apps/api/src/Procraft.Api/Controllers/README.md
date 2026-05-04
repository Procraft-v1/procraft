API controllers orchestrate ASP.NET primitives and delegate workflows to MediatR.

Rules:

- Keep controllers slim — serialize/deserialize payloads, map cookie helpers later, delegate to CQRS handlers.
- **Do not inject `DbContext` directly.**

Current controllers:

| Type | Responsibility |
| ---- | ------------- |
| `HealthController` | `GET /api/health` |
| `AuthController` | Routes under `/api/auth/*` (stub milestone) |

Global health probe for ingress also registered at **`GET /health`** via [`Extensions/WebApplicationExtensions.cs`](../Extensions/WebApplicationExtensions.cs).
