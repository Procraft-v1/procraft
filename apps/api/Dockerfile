# Procraft API — skeleton multi-stage Dockerfile
# Final wiring (non-root user, distroless, probes) completes during deployment rollout.

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .

RUN dotnet restore Procraft.sln
RUN dotnet publish src/Procraft.Api/Procraft.Api.csproj -c Release -o /app/out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Procraft.Api.dll"]
