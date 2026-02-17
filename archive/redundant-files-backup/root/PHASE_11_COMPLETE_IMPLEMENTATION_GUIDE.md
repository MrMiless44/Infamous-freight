# Phase 11 Complete Implementation Guide

## Overview

Phase 11 delivers Advanced Analytics and Intelligence across four services:

- Real-Time Analytics Dashboard
- Cohort Analysis and Segmentation
- Predictive Analytics Engine
- Business Intelligence Reports

These services are implemented in the API layer with a dedicated route group at:

- `/api/analytics/phase11/*`

## Architecture

- Language/runtime: Node.js (CommonJS)
- Data access: Prisma ORM
- Auth: JWT with scope-based authorization
- Rate limits: existing limiters from security middleware
- Response format: `ApiResponse` shape from shared

## Services

### Real-Time Analytics

- Live KPI tracking with dashboard snapshots
- Time-series generation by granularity
- Custom widget creation
- Export to CSV/JSON/PDF
- Cache TTL: 10 seconds

### Cohort Analysis

- Cohort creation by signup, first order, spending, activity, geography,
  behavior
- LTV and churn probability modeling
- RFM segmentation
- Retention curves
- Lookalike audiences
- Cache TTL: 1 hour

### Predictive Analytics

- Churn prediction with risk levels
- LTV prediction with growth trajectory
- Upsell opportunity identification
- Campaign response prediction
- What-if scenario modeling
- Cache TTL: 30 minutes

### Business Intelligence

- Executive summaries
- Financial and operational reports
- Trend analysis and forecasting
- Custom report templates
- Report scheduling
- Cache TTL: 1 hour

## API Endpoints

Base path: `/api/analytics/phase11`

### Real-Time Analytics

- `GET /kpi/:metricName`
- `POST /time-series`
- `GET /dashboard/snapshot`
- `GET /export`
- `POST /widget`

### Cohort Analysis

- `POST /cohort`
- `GET /cohort/:cohortId/retention`
- `GET /user/:userId/ltv`
- `POST /rfm-analysis`
- `POST /lookalike`

### Predictive Analytics

- `GET /predict/churn/:userId`
- `GET /predict/ltv/:userId`
- `GET /predict/upsell/:userId`
- `POST /predict/campaign-response`
- `POST /what-if`

### Business Intelligence

- `GET /report/executive-summary`
- `POST /report/financial`
- `POST /report/operational`
- `POST /report/trend`
- `POST /report/custom`
- `POST /report/schedule`
- `GET /report/:reportId/export`

### Health

- `GET /health`

## Security

Scopes introduced in shared:

- `analytics:read`
- `analytics:write`
- `analytics:cohort`
- `analytics:predict`
- `analytics:reports`
- `analytics:reports:schedule`

Use the scope middleware in the order:
`limiters -> authenticate -> requireScope -> auditLog -> validators -> handleValidationErrors -> handler`

## Database Schema

Phase 11 adds the following tables:

- `dashboard_widgets`
- `customer_cohorts`
- `analytics_predictions`
- `bi_reports`
- `report_schedules`

The Prisma schema is updated in
[apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma).

## Tests

- Phase 11 test suite:
  [apps/api/tests/phase11.test.js](apps/api/tests/phase11.test.js)
- Run: `pnpm --filter api test -- phase11.test.js`

## Deployment

Use the Phase 11 deployment helper:

- `./deploy-phase11.sh development`
- `./deploy-phase11.sh staging`
- `./deploy-phase11.sh production`

## Known Constraints

- Prisma migration requires Node.js tooling in the environment.
- Ensure shared package is rebuilt after updating scopes:
  `pnpm --filter @infamous-freight/shared build`
