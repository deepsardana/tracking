# ── Stage 1: Build React client ───────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client/package*.json ./client/
RUN npm ci --prefix client
COPY client/ ./client/
RUN npm run build --prefix client

# ── Stage 2: Compile TypeScript server + generate Prisma client ───────────────
# Debian slim (not Alpine): Prisma query engine needs OpenSSL 3 on glibc/musl match
FROM node:20-slim AS server-build
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY server/package*.json ./server/
RUN npm ci --prefix server
COPY server/ ./server/
RUN npm run prisma:generate --prefix server
RUN npm run build --prefix server

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-slim
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Server: compiled JS + dependencies + Prisma schema (needed for migrate deploy)
COPY --from=server-build /app/server/dist         ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/prisma       ./server/prisma
COPY --from=server-build /app/server/package.json ./server/package.json

# Client: built static files (served by Express in production)
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
EXPOSE 4000

WORKDIR /app/server

COPY server/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]
