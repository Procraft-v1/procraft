# Procraft admin (admin.procraft.uz) — Next.js standalone production build.
# Build context is the REPO ROOT (workspace packages are needed):
#   docker compose build admin
#   docker build -f apps/admin/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/admin/package.json ./apps/admin/package.json
RUN pnpm install --no-frozen-lockfile --filter @procraft/admin...

FROM deps AS build
COPY apps/admin ./apps/admin

ARG VITE_API_URL=https://api.procraft.uz/api
ARG VITE_UPLOADS_URL=https://api.procraft.uz/uploads
ARG VITE_APP_NAME=Procraft
ENV VITE_API_URL=$VITE_API_URL \
    VITE_UPLOADS_URL=$VITE_UPLOADS_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    NEXT_OUTPUT_STANDALONE=true \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @procraft/admin build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/admin/public ./apps/admin/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD wget -qO /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/admin/server.js"]
