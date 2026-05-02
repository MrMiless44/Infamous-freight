# -----------------------------
# Stage 1: Install production dependencies
# -----------------------------
FROM node:22-bookworm-slim AS prod-deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile --prod --filter @infamous-freight/api...


# -----------------------------
# Stage 2: Build the API
# -----------------------------
FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile --filter @infamous-freight/api...

COPY apps/api ./apps/api

# Dummy DATABASE_URL so Prisma can generate the client during the image build.
# Set the real DATABASE_URL as a Fly secret at runtime.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN pnpm -C apps/api exec prisma generate --schema=prisma/schema.prisma
RUN pnpm -C apps/api run build


# -----------------------------
# Stage 3: Runtime image
# -----------------------------
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy production dependencies, including pnpm's virtual store and workspace node_modules.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy package metadata needed by runtime tooling and diagnostics.
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

# Copy built API and Prisma schema.
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

# Copy the generated Prisma client from the build stage.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nodejs \
  && chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/apps/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; const http = require('http'); const req = http.get('http://127.0.0.1:' + port + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.setTimeout(8000, () => { req.destroy(); process.exit(1); });"

# Flexible startup for common TypeScript output layouts.
CMD ["sh", "-c", "if [ -f dist/src/server.js ]; then node dist/src/server.js; elif [ -f dist/server.js ]; then node dist/server.js; elif [ -f dist/index.js ]; then node dist/index.js; else echo 'ERROR: No valid server entry found in dist'; find dist -maxdepth 4 -type f; exit 1; fi"]
