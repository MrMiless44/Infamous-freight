FROM node:18-alpine

LABEL maintainer="Santorio Djuan Miles <237955567+MrMiless44@users.noreply.github.com>"
LABEL description="Infamous Freight Enterprises - Full-stack application"

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.9

# Copy workspace and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/

# Install ALL dependencies (including dev dependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build the application (builds shared first, then api)
RUN pnpm --filter @infamous-freight/shared build && pnpm --filter api build

# Expose port for web
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Production command - run the web server
CMD ["sh", "-c", "cd web && npm start"]

# Health check for web frontend
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
