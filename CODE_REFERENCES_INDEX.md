# Code References Index

## 📁 Complete File Structure with Links

### Web Frontend (`web/`)

#### Pages & Entry Points
- [web/pages/_app.tsx](web/pages/_app.tsx) - App wrapper, global providers
- [web/pages/_document.tsx](web/pages/_document.tsx) - HTML document structure
- [web/pages/index.tsx](web/pages/index.tsx) - Home page
- [web/pages/dashboard.tsx](web/pages/dashboard.tsx) - Dashboard
- [web/pages/shipments/index.tsx](web/pages/shipments/index.tsx) - Shipments list
- [web/pages/api/[...params].ts](web/pages/api/[...params].ts) - API proxy (SSR)

#### Components
- [web/components/OptimizedImage.tsx](web/components/OptimizedImage.tsx) - Image optimization wrapper
- [web/components/Header.tsx](web/components/Header.tsx) - Site header
- [web/components/Sidebar.tsx](web/components/Sidebar.tsx) - Navigation sidebar
- [web/components/LoadingSpinner.tsx](web/components/LoadingSpinner.tsx) - Loading indicator
- [web/components/ShipmentCard.tsx](web/components/ShipmentCard.tsx) - Shipment display
- [web/components/Modal.tsx](web/components/Modal.tsx) - Reusable modal

#### Utilities & Hooks
- [web/utils/dynamicImports.ts](web/utils/dynamicImports.ts) - Code splitting utilities
- [web/utils/api.ts](web/utils/api.ts) - API client
- [web/utils/auth.ts](web/utils/auth.ts) - Auth helpers
- [web/hooks/useAuth.ts](web/hooks/useAuth.ts) - Auth hook
- [web/hooks/useShipments.ts](web/hooks/useShipments.ts) - Shipments SWR hook
- [web/hooks/useFetch.ts](web/hooks/useFetch.ts) - Generic fetch hook

#### Configuration
- [web/next.config.mjs](web/next.config.mjs) - Next.js config (webpack, image optimization)
- [web/tailwind.config.js](web/tailwind.config.js) - Tailwind CSS config
- [web/tsconfig.json](web/tsconfig.json) - TypeScript config
- [web/.env.example](web/.env.example) - Environment template

### API Backend (`api/`)

#### Routes (Express Router)
- [api/src/routes/health.js](api/src/routes/health.js) - Health/status endpoints
- [api/src/routes/users.js](api/src/routes/users.js) - User CRUD + auth
- [api/src/routes/shipments.js](api/src/routes/shipments.js) - Shipment management
- [api/src/routes/ai.commands.js](api/src/routes/ai.commands.js) - AI inference API
- [api/src/routes/voice.js](api/src/routes/voice.js) - Voice/audio processing
- [api/src/routes/billing.js](api/src/routes/billing.js) - Stripe/PayPal integration
- [api/src/routes/webhooks.js](api/src/routes/webhooks.js) - Webhook receivers

#### Middleware
- [api/src/middleware/security.js](api/src/middleware/security.js) - **JWT auth, rate limiting, scopes**
- [api/src/middleware/validation.js](api/src/middleware/validation.js) - **Request validation**
- [api/src/middleware/errorHandler.js](api/src/middleware/errorHandler.js) - **Global error handling**
- [api/src/middleware/advancedSecurity.js](api/src/middleware/advancedSecurity.js) - Token rotation, enhanced auth
- [api/src/middleware/logger.js](api/src/middleware/logger.js) - Winston logging
- [api/src/middleware/securityHeaders.js](api/src/middleware/securityHeaders.js) - Helmet headers
- [api/src/middleware/securityEnhanced.js](api/src/middleware/securityEnhanced.js) - Enhanced security (input sanitization)

#### Services
- [api/src/services/aiSyntheticClient.js](api/src/services/aiSyntheticClient.js) - OpenAI/Anthropic/synthetic AI
- [api/src/services/cacheService.js](api/src/services/cacheService.js) - **Redis caching (5-min TTL)**
- [api/src/services/websocketServer.js](api/src/services/websocketServer.js) - **Real-time WebSocket server**
- [api/src/services/emailService.js](api/src/services/emailService.js) - Transactional email
- [api/src/services/stripeService.js](api/src/services/stripeService.js) - Stripe integration
- [api/src/services/paypalService.js](api/src/services/paypalService.js) - PayPal integration

#### Configuration & Entry
- [api/src/index.js](api/src/index.js) - Express app setup (main entry)
- [api/src/config.js](api/src/config.js) - Environment config
- [api/.env.example](api/.env.example) - Environment template
- [api/tsconfig.json](api/tsconfig.json) - TypeScript config (if using .ts files)

#### Database
- [api/prisma/schema.prisma](api/prisma/schema.prisma) - **Database schema (User, Shipment, Driver, etc.)**
- [api/prisma/migrations/](api/prisma/migrations/) - Migration history
- [api/prisma/seed.ts](api/prisma/seed.ts) - Database seeding (optional)

#### Tests
- [api/src/__tests__/](api/src/__tests__/) - Jest unit tests
  - `auth.test.js` - Authentication middleware tests
  - `shipments.test.js` - Shipment CRUD tests
  - `ai.test.js` - AI service tests
  - `cache.test.js` - Cache service tests

### Mobile App (`mobile/`)

#### Screens (React Native)
- [mobile/src/screens/HomeScreen.tsx](mobile/src/screens/HomeScreen.tsx) - Home/dashboard
- [mobile/src/screens/ShipmentsScreen.tsx](mobile/src/screens/ShipmentsScreen.tsx) - Shipment list
- [mobile/src/screens/TrackingScreen.tsx](mobile/src/screens/TrackingScreen.tsx) - Real-time tracking
- [mobile/src/screens/AuthScreen.tsx](mobile/src/screens/AuthScreen.tsx) - Login/signup

#### Services (Core Features)
- [mobile/services/offlineQueue.ts](mobile/services/offlineQueue.ts) - **Offline-first queue (AsyncStorage)**
- [mobile/services/pushNotifications.ts](mobile/services/pushNotifications.ts) - **Expo push notifications**
- [mobile/services/biometricAuth.ts](mobile/services/biometricAuth.ts) - **Face ID/Touch ID authentication**
- [mobile/services/apiClient.ts](mobile/services/apiClient.ts) - HTTP client with queue support
- [mobile/services/syncService.ts](mobile/services/syncService.ts) - Auto-sync on reconnection

#### Components
- [mobile/src/components/ShipmentCard.tsx](mobile/src/components/ShipmentCard.tsx) - Shipment display
- [mobile/src/components/Map.tsx](mobile/src/components/Map.tsx) - Tracking map
- [mobile/src/components/LoadingOverlay.tsx](mobile/src/components/LoadingOverlay.tsx) - Loading state

#### Context & State
- [mobile/src/context/AuthContext.tsx](mobile/src/context/AuthContext.tsx) - Auth state
- [mobile/src/context/ShipmentContext.tsx](mobile/src/context/ShipmentContext.tsx) - Shipment state

#### Configuration
- [mobile/app.json](mobile/app.json) - Expo app config
- [mobile/.env.example](mobile/.env.example) - Environment template
- [mobile/tsconfig.json](mobile/tsconfig.json) - TypeScript config
- [mobile/eas.json](mobile/eas.json) - EAS Build config

### Shared Package (`packages/shared/`)

#### Type Definitions
- [packages/shared/src/types.ts](packages/shared/src/types.ts) - **Domain types (User, Shipment, Driver, ApiResponse)**

#### Constants
- [packages/shared/src/constants.ts](packages/shared/src/constants.ts) - **Shared constants (SHIPMENT_STATUSES, HTTP_STATUS, ROLES)**

#### Utilities
- [packages/shared/src/utils.ts](packages/shared/src/utils.ts) - Helper functions
- [packages/shared/src/env.ts](packages/shared/src/env.ts) - Environment validation

#### Build Output
- [packages/shared/dist/](packages/shared/dist/) - Compiled JavaScript + TypeScript declarations

### Scripts & Automation (`scripts/`)

#### Deployment & Setup
- [scripts/setup-secrets-auto.sh](scripts/setup-secrets-auto.sh) - **Automated secret configuration (Fly.io + Redis + mobile)**
- [scripts/setup-production.sh](scripts/setup-production.sh) - Production environment setup
- [scripts/monitor-build-status.sh](scripts/monitor-build-status.sh) - Build monitoring
- [scripts/create-pr.sh](scripts/create-pr.sh) - Automated PR creation

#### Database
- [scripts/seed-database.sh](scripts/seed-database.sh) - Database seeding
- [scripts/backup-database.sh](scripts/backup-database.sh) - Database backup

### CI/CD Workflows (`.github/workflows/`)

#### Continuous Integration
- [.github/workflows/ci.yml](.github/workflows/ci.yml) - Lint, test, type-check on every push
- [.github/workflows/security.yml](.github/workflows/security.yml) - Security scanning (optional)

#### Continuous Deployment
- [.github/workflows/cd.yml](.github/workflows/cd.yml) - Deploy to Vercel & Fly.io
- [.github/workflows/unified-deploy.yml](.github/workflows/unified-deploy.yml) - **Unified deployment for all platforms**
- [.github/workflows/health-check-monitoring.yml](.github/workflows/health-check-monitoring.yml) - **Health checks every 5 min**

### Root Configuration

#### Package Management & Build
- [package.json](package.json) - Monorepo root package, pnpm workspaces
- [pnpm-workspace.yaml](pnpm-workspace.yaml) - Workspace definition
- [pnpm-lock.yaml](pnpm-lock.yaml) - Lock file (all dependencies)

#### Code Quality
- [eslint.config.js](eslint.config.js) - ESLint configuration
- [.prettierrc](.prettierrc) - Prettier formatting
- [tsconfig.json](tsconfig.json) - Root TypeScript config

#### Git & GitHub
- [.gitignore](.gitignore) - Git ignore rules
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - **AI development patterns**

#### Documentation
- [README.md](README.md) - Project overview
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [COPYRIGHT](COPYRIGHT) - License & copyright
- [AUTHORS](AUTHORS) - Project contributors
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference (if exists)
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Complete deployment guide
- [SECURITY_HARDENING_CHECKLIST.md](SECURITY_HARDENING_CHECKLIST.md) - Security best practices
- [REFERENCES.md](REFERENCES.md) - **This file - Complete references index**

### E2E Tests (`e2e/`)

- [e2e/tests/](e2e/tests/) - Playwright test suite
  - `auth.spec.ts` - Authentication flow tests
  - `shipments.spec.ts` - Shipment CRUD tests
  - `ui.spec.ts` - UI interaction tests

---

## 🔍 Quick Links by Purpose

### Want to understand authentication?
1. Start: [api/src/middleware/security.js](api/src/middleware/security.js)
2. Routes example: [api/src/routes/ai.commands.js](api/src/routes/ai.commands.js) (lines 17-38)
3. Mobile: [mobile/services/biometricAuth.ts](mobile/services/biometricAuth.ts)
4. Web: [web/hooks/useAuth.ts](web/hooks/useAuth.ts)

### Want to add a new API endpoint?
1. Create route in [api/src/routes/](api/src/routes/)
2. Follow pattern: limiters → authenticate → requireScope → validation → handler
3. Reference: [.github/copilot-instructions.md](.github/copilot-instructions.md#must-know-patterns)
4. Types in: [packages/shared/src/types.ts](packages/shared/src/types.ts)

### Want to optimize performance?
1. Bundle: [web/next.config.mjs](web/next.config.mjs)
2. Images: [web/components/OptimizedImage.tsx](web/components/OptimizedImage.tsx)
3. Code splitting: [web/utils/dynamicImports.ts](web/utils/dynamicImports.ts)
4. API cache: [api/src/services/cacheService.js](api/src/services/cacheService.js)

### Want to add mobile features?
1. Offline: [mobile/services/offlineQueue.ts](mobile/services/offlineQueue.ts)
2. Push: [mobile/services/pushNotifications.ts](mobile/services/pushNotifications.ts)
3. Biometric: [mobile/services/biometricAuth.ts](mobile/services/biometricAuth.ts)
4. Sync: [mobile/services/syncService.ts](mobile/services/syncService.ts)

### Want to deploy?
1. Checklist: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
2. Scripts: [scripts/setup-secrets-auto.sh](scripts/setup-secrets-auto.sh)
3. Workflows: [.github/workflows/unified-deploy.yml](.github/workflows/unified-deploy.yml)
4. Health: [.github/workflows/health-check-monitoring.yml](.github/workflows/health-check-monitoring.yml)

### Want to understand the database?
1. Schema: [api/prisma/schema.prisma](api/prisma/schema.prisma)
2. Migrations: [api/prisma/migrations/](api/prisma/migrations/)
3. Types: [packages/shared/src/types.ts](packages/shared/src/types.ts)
4. Seed (optional): [api/prisma/seed.ts](api/prisma/seed.ts)

### Want to add validation?
1. Common validators: [api/src/middleware/validation.js](api/src/middleware/validation.js)
2. Route example: [api/src/routes/users.js](api/src/routes/users.js)
3. Error handling: [api/src/middleware/errorHandler.js](api/src/middleware/errorHandler.js)

### Want to monitor health?
1. Health endpoint: [api/src/routes/health.js](api/src/routes/health.js)
2. Automated checks: [.github/workflows/health-check-monitoring.yml](.github/workflows/health-check-monitoring.yml)
3. Monitor script: [scripts/monitor-build-status.sh](scripts/monitor-build-status.sh)

---

**Last Updated**: January 15, 2026 | **Version**: 1.0 | **Status**: Complete 100%
