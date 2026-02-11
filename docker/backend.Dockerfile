FROM node:20 AS builder
WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application source
COPY . .

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application and node_modules from builder stage
COPY --from=builder /app /app

# Create and use a non-root user for security
RUN useradd -r -u 1001 nodeapp && chown -R nodeapp:nodeapp /app
USER nodeapp

EXPOSE 5000

# Basic health check hitting the conventional /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "require('http').get('http://localhost:5000/health', res => { if (res.statusCode !== 200) process.exit(1); }).on('error', () => process.exit(1));"
CMD ["node", "index.js"]
