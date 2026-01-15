## Monorepo-friendly API image for Render/Fly/DO
FROM node:18-alpine AS base

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Cache deps first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY api/package.json ./api/package.json

RUN pnpm install --frozen-lockfile || pnpm install

# Copy full repo (api + packages + shared assets)
COPY . .

# Build API if script exists (CI-safe)
RUN pnpm -C api --if-present build || true

EXPOSE 3001
ENV NODE_ENV=production
CMD ["pnpm", "-C", "api", "start"]
