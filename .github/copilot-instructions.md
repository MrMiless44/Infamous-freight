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
- `packages/ui`

## Coding Standards

- All code must be written in TypeScript where applicable.
- No hardcoded secrets.
- All APIs require authentication middleware.
- Prisma must be used for database access.
- All new endpoints require unit tests.

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
