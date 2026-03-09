# Infamous Freight

> AI-powered logistics SaaS platform for freight operations, carrier management, and shipment intelligence.

[![CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Infamous Freight is a multi-tenant freight SaaS platform designed to streamline freight operations. It provides real-time shipment tracking, AI-assisted carrier ranking, predictive rate analysis, and an analytics dashboard — all built on a modern TypeScript monorepo.

---

## Features

| Feature | Description |
|---|---|
| **Authentication** | JWT-based auth with role management (Admin, Dispatcher, Driver) |
| **Shipment Tracking** | Real-time GPS tracking with ETA risk prediction |
| **Carrier Intelligence** | AI-powered carrier ranking by lane and equipment type |
| **Rate Prediction** | Market-aware freight rate forecasting |
| **Analytics Dashboard** | Lane profitability, carrier benchmarks, and operational metrics |
| **Load Board** | Create, list, and manage freight loads |
| **Billing** | Stripe-powered subscription management |

---

## Architecture

```
infamous-freight/
├── apps/
│   ├── api/        # Express REST API (TypeScript, Node.js)
│   ├── web/        # Next.js management and analytics dashboard
│   ├── mobile/     # React Native driver application (Expo)
│   └── worker/     # Background job workers
├── packages/
│   └── shared/     # Shared types, constants, and utilities
├── .github/
│   └── workflows/  # CI/CD automation (GitHub Actions)
├── k8s/            # Kubernetes manifests
├── terraform/      # Infrastructure as Code
└── docker/         # Docker build configurations
```

**Tech Stack**

| Layer | Technology |
|---|---|
| API | Express 5, TypeScript, Zod, Pino |
| Web | Next.js 15, React, Tailwind CSS |
| Mobile | React Native, Expo |
| Database | PostgreSQL via Prisma ORM |
| Cache / Queue | Redis |
| Auth | JWT (HMAC / RS256 via JWKS) |
| CI/CD | GitHub Actions |
| Container | Docker, Kubernetes |

---

## Prerequisites

- **Node.js** >= 20 (pinned to 22 in CI — see `.nvmrc`)
- **pnpm** 9.x — `npm install -g pnpm@9`
- **Docker** & **Docker Compose** — for local database and cache
- **PostgreSQL** 15+ (or use the provided `docker-compose.yml`)
- **Redis** 7+ (or use the provided `docker-compose.yml`)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` and fill in the required values:

```dotenv
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://infamous:infamous@localhost:5432/infamous
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_jwt_secret_here
```

### 4. Start local services (Postgres + Redis)

```bash
docker compose up -d
```

### 5. Run database migrations

```bash
pnpm --filter @infamous/api exec prisma migrate dev
```

### 6. Build the shared package

```bash
pnpm --filter @infamous/shared build
```

### 7. Start the development server

```bash
# API only
pnpm dev:api

# API + Web frontend
pnpm dev:api & pnpm dev:web
```

The API will be available at `http://localhost:4000`.  
Interactive API docs: `http://localhost:4000/api/docs`

---

## Available Scripts

Run these from the **repository root** unless otherwise noted.

| Command | Description |
|---|---|
| `pnpm dev:api` | Start API in watch mode |
| `pnpm dev:web` | Start Next.js web frontend |
| `pnpm build` | Build all workspaces |
| `pnpm typecheck` | TypeScript type-check all workspaces |
| `pnpm lint` | Lint all workspaces |
| `pnpm test` | Run all tests |

---

## API Documentation

The API ships with an interactive **Swagger UI** available at:

```
http://localhost:4000/api/docs
```

The raw OpenAPI 3.0 specification is located at [`apps/api/openapi.yaml`](apps/api/openapi.yaml).

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/shipments/eta-risk` | AI-based ETA risk prediction |
| `POST` | `/api/carriers/rank` | Rank carriers for a lane |
| `POST` | `/api/rates/predict` | Predict freight rate |
| `POST` | `/api/auth/login` | Authenticate user |
| `GET` | `/api/loads` | List loads |
| `POST` | `/api/loads` | Create load |
| `GET` | `/api/analytics/lane-profit` | Lane profitability analysis |
| `POST` | `/api/billing/subscribe` | Create Stripe checkout session |
| `GET` | `/api/docs` | Swagger UI |

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter @infamous/api test

# Run with coverage
pnpm --filter @infamous/api exec vitest run --coverage
```

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

**Quick steps:**

1. Fork the repository and create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes with clear, conventional commit messages:
   ```bash
   git commit -m "feat(api): add shipment ETA risk endpoint"
   ```
3. Run checks before pushing:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
4. Open a pull request with a clear description of the change.

**Commit convention** — this repo uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation only |
| `chore:` | Maintenance, CI, config |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `BREAKING CHANGE:` | Breaking API changes (triggers major version) |

For large changes, open a [GitHub Discussion](https://github.com/MrMiless44/Infamous-freight/discussions) first.

---

## License

[MIT](LICENSE) © Infamous Freight
