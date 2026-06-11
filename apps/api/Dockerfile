# Procraft API — NestJS multi-stage production build.
# Drop-in replacement for the previous ASP.NET image: same port (8080), same
# /health endpoint, same env variables, same /app/uploads volume path.

FROM node:22-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Production dependencies only.
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app

# curl is required by the docker-compose healthcheck command.
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist
COPY --from=build /src/package.json ./package.json

RUN mkdir -p /app/uploads

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/main.js"]
