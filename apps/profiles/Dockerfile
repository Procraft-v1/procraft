# Procraft public profiles (*.procraft.uz) — Next.js standalone SSR build.
# Build context is the REPO ROOT (workspace packages are needed):
#   docker compose build profiles
#   docker build -f apps/profiles/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/profiles/package.json ./apps/profiles/package.json
RUN pnpm install --no-frozen-lockfile --filter @procraft/profiles...

FROM deps AS build
COPY apps/profiles ./apps/profiles

ARG VITE_API_URL=https://api.procraft.uz/api
ARG VITE_UPLOADS_URL=https://api.procraft.uz/uploads
ARG VITE_APP_NAME=Procraft
ENV VITE_API_URL=$VITE_API_URL \
    VITE_UPLOADS_URL=$VITE_UPLOADS_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    NEXT_OUTPUT_STANDALONE=true \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @procraft/profiles build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=build --chown=nextjs:nodejs /repo/apps/profiles/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/profiles/.next/static ./apps/profiles/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/profiles/public ./apps/profiles/public

USER nextjs
EXPOSE 3000

# Hit a static asset, not `/`: the root 404s without a profile subdomain
# Host header (which the healthcheck cannot supply), but the server is up.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD wget -qO /dev/null http://127.0.0.1:3000/brand/procraft-app-icon-rounded.png || exit 1

CMD ["node", "apps/profiles/server.js"]
