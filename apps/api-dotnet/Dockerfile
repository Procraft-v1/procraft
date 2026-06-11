# Procraft API — skeleton multi-stage Dockerfile
# Final wiring (non-root user, distroless, probes) completes during deployment rollout.

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Procraft.sln ./
COPY src/Procraft.Api/Procraft.Api.csproj src/Procraft.Api/
COPY src/Procraft.Application/Procraft.Application.csproj src/Procraft.Application/
COPY src/Procraft.Domain/Procraft.Domain.csproj src/Procraft.Domain/
COPY src/Procraft.Infrastructure/Procraft.Infrastructure.csproj src/Procraft.Infrastructure/
COPY tests/Procraft.Api.Tests/Procraft.Api.Tests.csproj tests/Procraft.Api.Tests/
COPY tests/Procraft.Application.Tests/Procraft.Application.Tests.csproj tests/Procraft.Application.Tests/

RUN dotnet restore Procraft.sln

COPY . .

RUN test -f src/Procraft.Infrastructure/Persistence/Migrations/20260504120000_CreateAuthTables.cs
RUN test -f src/Procraft.Infrastructure/Persistence/Migrations/20260504124500_AddTemplatesAndProfileSelection.cs
RUN dotnet publish src/Procraft.Api/Procraft.Api.csproj -c Release -o /app/out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
EXPOSE 8080

ENTRYPOINT ["dotnet", "Procraft.Api.dll"]
