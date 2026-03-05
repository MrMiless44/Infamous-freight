# Infamous Freight Copilot Instructions

Infamous Freight is an AI-powered logistics SaaS platform.

## Architecture

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Express
- Prisma ORM
- PostgreSQL
- JWT authentication (HMAC via `JWT_SECRET` by default, optional RS256 via JWKS middleware)

### Mobile
- React Native
- Expo

## Monorepo Structure

- `apps/api`
- `apps/web`
- `apps/mobile`
- `packages/shared`

## Coding Standards

- All code must be written in TypeScript where applicable.
- No hardcoded secrets.
- All non-public API endpoints must use the standard middleware stack: limiters → authenticate → requireOrganization → requireScope → auditLog → validators → handleValidationErrors.
- Prisma must be used for database access.
- All new endpoints require unit tests.
- Domain types, constants, and shared helpers must be imported from `@infamous-freight/shared` (do not redefine them locally in API, web, or mobile apps).
- When shared types/constants change, rebuild the shared package before running the API or tests: `pnpm --filter @infamous-freight/shared build` (this updates `packages/shared/dist`).

## Feature Delivery Order

When adding features:

1. Update backend API
2. Update shared types
3. Update frontend UI
4. Update documentation

## Freight Domain Terminology

- Carrier
- Shipper
- Broker
- Load
- Shipment
- Tracking
- Dispatch
- Rate Confirmation
