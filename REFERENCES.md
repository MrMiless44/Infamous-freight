# Complete References Guide - Infamous Freight Enterprises

## 📚 Documentation References

### Architecture & Setup

- [README.md](README.md) - Project overview & getting started
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Complete deployment guide (329 lines)
- [SECURITY_HARDENING_CHECKLIST.md](SECURITY_HARDENING_CHECKLIST.md) - Security best practices
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [00_START_HERE.md](00_START_HERE.md) - Quick start guide

### Code References

- [.github/copilot-instructions.md](.github/copilot-instructions.md) - AI development patterns
- [web/README.md](web/) - Next.js 14 frontend setup
- [api/README.md](api/) - Express.js backend setup
- [mobile/README.md](mobile/) - React Native/Expo setup
- [packages/shared/README.md](packages/shared/) - Shared types & utilities

## 🔧 API References

### Health & Status

- **Health Check**: `GET /api/health`
- **Live Check**: `GET /api/health/live`
- **Readiness Check**: `GET /api/health/ready`

### API Documentation

- [api/src/routes/](api/src/routes/) - All route definitions
  - `health.js` - Health endpoints
  - `ai.commands.js` - AI inference API
  - `voice.js` - Audio processing
  - `billing.js` - Payment integration
  - `shipments.js` - Shipment CRUD
  - `users.js` - User management

### Middleware References

- [api/src/middleware/security.js](api/src/middleware/security.js)
  - `authenticate()` - JWT verification
  - `requireScope(scope)` - Authorization
  - `limiters` - Rate limiting (general, auth, ai, billing, voice, export, passwordReset, webhook)
  - `auditLog` - Request logging
- [api/src/middleware/validation.js](api/src/middleware/validation.js)
  - `validateString(field)` - String validation
  - `validateEmail(field)` - Email validation
  - `validatePhone(field)` - Phone validation
  - `validateUUID(field)` - UUID validation
  - `handleValidationErrors` - Error formatting

- [api/src/middleware/errorHandler.js](api/src/middleware/errorHandler.js) - Global error handling

## 🚀 Deployment References

### Platforms

- **Web**: [Vercel](https://vercel.com/) - `https://infamous-freight-enterprises.vercel.app`
- **API**: [Fly.io](https://fly.io/) - `https://infamous-freight-api.fly.dev`
- **Mobile**: [EAS Build](https://eas.dev/) - iOS/Android builds
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
- **Cache**: [Redis](https://redis.io/) (Upstash, Railway, or Fly.io)

### CI/CD Workflows

- [.github/workflows/ci.yml](.github/workflows/ci.yml) - Test & lint on every push
- [.github/workflows/cd.yml](.github/workflows/cd.yml) - Deploy to Vercel & Fly.io
- [.github/workflows/health-check-monitoring.yml](.github/workflows/health-check-monitoring.yml) - Health checks every 5 min
- [.github/workflows/unified-deploy.yml](.github/workflows/unified-deploy.yml) - Unified deployment

### Deployment Scripts

- [scripts/setup-secrets-auto.sh](scripts/setup-secrets-auto.sh) - Automated secret configuration
- [scripts/monitor-build-status.sh](scripts/monitor-build-status.sh) - Build monitoring
- [scripts/setup-production.sh](scripts/setup-production.sh) - Production setup
- [scripts/create-pr.sh](scripts/create-pr.sh) - PR automation

## 🛠️ Technology Stack References

### Frontend (Next.js 14)

- **Framework**: [Next.js 14](https://nextjs.org/) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State**: [React Context](https://react.dev/reference/react/useContext) + [SWR](https://swr.vercel.app/)
- **Auth**: JWT (Bearer token)
- **API Client**: [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- **Build**: Webpack with code splitting
- **Performance**: Image optimization (AVIF/WebP), lazy loading, dynamic imports
- **Deployment**: Vercel CLI
- **Analytics**: Vercel Analytics, Datadog RUM

### Backend (Express.js)

- **Framework**: [Express.js](https://expressjs.com/) (Node.js 20)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Cache**: [Redis](https://redis.io/) (ioredis)
- **Real-time**: [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) (ws library)
- **Auth**: [JWT](https://jwt.io/) via jsonwebtoken
- **Rate Limiting**: [express-rate-limit](https://github.com/nfriedly/express-rate-limit)
- **Validation**: [express-validator](https://express-validator.github.io/)
- **Security**: [Helmet.js](https://helmetjs.github.io/), [Cors](https://github.com/expressjs/cors)
- **Logging**: [Winston](https://github.com/winstonjs/winston)
- **Error Tracking**: [Sentry](https://sentry.io/)
- **Deployment**: Fly.io

### Mobile (React Native + Expo)

- **Framework**: [Expo SDK v54](https://docs.expo.dev/)
- **Language**: TypeScript 5.3.3
- **Storage**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/)
- **Notifications**: [expo-notifications](https://docs.expo.dev/push-notifications/overview/)
- **Auth**: [expo-local-authentication](https://docs.expo.dev/modules/expo-local-authentication/) (Face ID/Touch ID)
- **Device**: [expo-device](https://docs.expo.dev/modules/expo-device/)
- **Build**: [EAS Build](https://eas.dev/)
- **Publishing**: Expo App Store, Google Play Store

### Shared Package

- **Path**: [packages/shared/](packages/shared/)
- **Exports**: Types, constants, utilities
- **Files**:
  - `types.ts` - Domain types (Shipment, User, etc.)
  - `constants.ts` - Shared constants (SHIPMENT_STATUSES, HTTP_STATUS)
  - `utils.ts` - Utility functions
  - `env.ts` - Environment validation
- **Build**: TypeScript → JavaScript (dist/)

## 📊 Environment Variables

### API (.env.production)

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
REDIS_URL=redis://your-redis-host:6379
WEBSOCKET_PORT=8080
AI_PROVIDER=openai|anthropic|synthetic
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=...
CORS_ORIGINS=https://infamous-freight-enterprises.vercel.app,...
SENTRY_DSN=https://...
LOG_LEVEL=info
```

### Web (.env.production)

```bash
NEXT_PUBLIC_API_URL=https://infamous-freight-api.fly.dev
NEXT_PUBLIC_API_BASE_URL=https://infamous-freight-api.fly.dev
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_DD_APP_ID=...
NEXT_PUBLIC_DD_CLIENT_TOKEN=...
NEXT_PUBLIC_DD_SITE=datadoghq.com
VERCEL_PROJECT_ID=...
```

### Mobile (.env)

```bash
EXPO_PROJECT_ID=...
API_BASE_URL=https://infamous-freight-api.fly.dev
WS_URL=wss://infamous-freight-api.fly.dev/ws
ENABLE_OFFLINE_QUEUE=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_BIOMETRIC_AUTH=true
```

## 🔐 Security References

### Authentication

- **Method**: JWT (Bearer token)
- **Storage**: Web - localStorage, Mobile - AsyncStorage
- **Rotation**: Configurable via `ENABLE_TOKEN_ROTATION` env
- **Scope-based**: Routes enforce specific scopes (e.g., `ai:command`, `voice:ingest`)
- **Reference**: [api/src/middleware/security.js](api/src/middleware/security.js)

### Rate Limiting (15-min windows)

- **General**: 100 requests/15min per user
- **Auth**: 5 attempts/15min (password reset, login)
- **AI**: 20 requests/1min per user
- **Billing**: 30 requests/15min per user
- **Voice**: 10 uploads/1min per user
- **Export**: 5 exports/1hour per user
- **Webhook**: 100 requests/1min per IP

### Headers

- [Helmet.js](https://helmetjs.github.io/) for CORS, CSP, XSS protection
- HTTPS only in production
- HSTS enabled (1 year)

## 📈 Performance References

### Web Bundle

- **Target**: <150KB First Load JS, <500KB total
- **Optimization**: Code splitting, lazy loading, image optimization
- **Tools**: Next.js webpack, dynamic imports, next/image
- **Metrics**: LCP <2.5s, FID <100ms, CLS <0.1

### API Performance

- **Cache**: Redis 5-min TTL
- **Target**: <100ms response time (cached), <500ms uncached
- **Pooling**: Database connection pooling via Prisma
- **Real-time**: WebSocket <100ms latency

### Database

- **Indexes**: Defined in [api/prisma/schema.prisma](api/prisma/schema.prisma)
- **Migrations**: [api/prisma/migrations/](api/prisma/migrations/)
- **Query optimization**: Eager loading (include), pagination

## 🧪 Testing References

### Test Files

- [api/src/\*_/_.test.js](api/src/) - Jest unit tests
- [e2e/](e2e/) - Playwright end-to-end tests
- **Coverage**: Target 75-84% for API
- **CI**: Runs on every push via GitHub Actions

### Testing Tools

- **Unit**: [Jest](https://jestjs.io/)
- **E2E**: [Playwright](https://playwright.dev/)
- **API**: [Thunder Client](https://www.thunderclient.com/), [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

## 📋 Feature References

### Priority 1: Bundle Optimization

- **Files**:
  - [web/components/OptimizedImage.tsx](web/components/OptimizedImage.tsx)
  - [web/utils/dynamicImports.ts](web/utils/dynamicImports.ts)
  - [web/next.config.mjs](web/next.config.mjs)
- **Impact**: 50% faster load, 40% smaller bundle

### Priority 2: Mobile Features

- **Files**:
  - [mobile/services/offlineQueue.ts](mobile/services/offlineQueue.ts) - AsyncStorage persistence
  - [mobile/services/pushNotifications.ts](mobile/services/pushNotifications.ts) - Expo SDK
  - [mobile/services/biometricAuth.ts](mobile/services/biometricAuth.ts) - Face ID/Touch ID
- **Impact**: Offline-first, real-time notifications, enhanced security

### Priority 3: API Enhancements

- **Files**:
  - [api/src/services/cacheService.js](api/src/services/cacheService.js) - Redis caching
  - [api/src/services/websocketServer.js](api/src/services/websocketServer.js) - Real-time
- **Impact**: 80% faster API, <100ms real-time latency

## 🔗 External Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Deployment

- [Vercel Docs](https://vercel.com/docs)
- [Fly.io Docs](https://fly.io/docs/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

### Tools & Services

- [GitHub](https://github.com/) - Source control
- [Sentry](https://sentry.io/) - Error tracking
- [Datadog](https://www.datadoghq.com/) - Monitoring & RUM
- [Upstash](https://upstash.com/) - Serverless Redis
- [Railway](https://railway.app/) - Hosting & databases

## 📞 Support & Links

### Repository

- **GitHub**: https://github.com/MrMiless44/Infamous-freight-enterprises
- **Issues**: https://github.com/MrMiless44/Infamous-freight-enterprises/issues
- **Actions**: https://github.com/MrMiless44/Infamous-freight-enterprises/actions
- **Discussions**: https://github.com/MrMiless44/Infamous-freight-enterprises/discussions

### Production URLs

- **Web**: https://infamous-freight-enterprises.vercel.app
- **API**: https://infamous-freight-api.fly.dev
- **API Health**: https://infamous-freight-api.fly.dev/api/health
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Fly.io Dashboard**: https://fly.io/dashboard

### Community & Docs

- [Next.js Community](https://github.com/vercel/next.js/discussions)
- [Express.js Community](https://expressjs.com/en/resources/community.html)
- [Expo Community](https://forums.expo.dev/)
- [TypeScript Community](https://www.typescriptlang.org/community)

## ✨ Version References

### Package Versions (Lock in package-lock.json / pnpm-lock.yaml)

- **Node.js**: 20.x
- **TypeScript**: 5.3.3
- **Next.js**: 14.x
- **React**: 18.x
- **Express**: 4.x
- **Prisma**: Latest
- **Expo SDK**: 54.x
- **pnpm**: 8.15.9

### API Version

- **Current**: v1 (via `/api/v1/...`)
- **Versioning**: URL-based versioning for backward compatibility

---

**This reference guide covers all aspects of the Infamous Freight Enterprises platform. For updates, refer to the latest docs in each module.** 🚀
