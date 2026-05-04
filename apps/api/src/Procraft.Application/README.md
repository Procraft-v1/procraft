Application layer hosts CQRS entry points (MediatR), validation (FluentValidation), and contracts implemented in Infrastructure.

- **Depends on** `Procraft.Domain` only.
- **Never references** `Procraft.Infrastructure` or `Procraft.Api`.

Auth flows are scaffolded under `Auth/`; other bounded contexts keep folder shells for future prompts.
