---
name: API Backend Development
description: Develop, debug, and optimize Express.js CommonJS API routes, middleware, services, and integrations with Prisma ORM
applyTo:
  - apps/api/src/**/*
keywords:
  - express
  - api
  - middleware
  - routes
  - prisma
  - commonjs
  - error handling
  - rate limiting
  - jwt auth
---

# API Backend Development Skill

## 📋 Quick Rules

1. **Module System**: CommonJS (`require()`), not ESM
2. **Shared Types**: Always import from `@infamous-freight/shared`
3. **Route Structure**: `limiters → authenticate → requireScope → auditLog → validators → handleValidationErrors → handler → next(err)`
4. **Error Handling**: Delegate errors to global `errorHandler` via `next(err)`
5. **Rate Limits**:
   - General: 100/15min
   - Auth: 5/15min
   - AI: 20/1min
   - Billing: 30/15min

## 🛣️ Route Pattern

```javascript
const express = require('express');
const { validate, handleValidationErrors } = require('../middleware/validation');
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');
const { ApiResponse, HTTP_STATUS } = require('@infamous-freight/shared');
const router = express.Router();

router.post(
  '/action',
  limiters.general,
  authenticate,
  requireScope('scope:name'),
  auditLog,
  [validate.body('field'), handleValidationErrors],
  async (req, res, next) => {
    try {
      const result = await service.doAction(req.body);
      res.status(HTTP_STATUS.OK).json(new ApiResponse({ 
        success: true, 
        data: result 
      }));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
```

## 📁 File Organization

- **Routes**: `apps/api/src/routes/*.js` (one file per resource)
- **Middleware**: `apps/api/src/middleware/` (security, validation, error handling, logging)
- **Services**: `apps/api/src/services/` (business logic, external integrations)
- **Models**: `apps/api/prisma/schema.prisma`

## 🔐 Security Checklist

- ✅ Use `authenticate` for protected routes
- ✅ Use `requireScope()` to enforce permissions
- ✅ Use appropriate `limiters.{general,auth,billing,ai}`
- ✅ Validate all inputs with `validate.*` and `handleValidationErrors`
- ✅ Delegate errors to `next(err)`
- ✅ Log audit events with `auditLog`

## 🗄️ Database Tasks

When modifying the Prisma schema:
```bash
# After editing apps/api/prisma/schema.prisma
cd apps/api
pnpm prisma:migrate:dev --name <description>
pnpm prisma:generate
pnpm prisma:studio  # optional: interactive viewer
```

## 📊 Common Services

- **AI Integration**: `apps/api/src/services/aiSyntheticClient.js` (OpenAI/Anthropic/synthetic)
- **Health Checks**: `apps/api/src/routes/health.js`
- **Billing**: `apps/api/src/routes/billing.js` (Stripe/PayPal)
- **Voice Processing**: `apps/api/src/routes/voice.js` (Multer upload, text commands)

## 🧪 Testing

```bash
# Run all API tests
pnpm --filter api test

# Coverage report
pnpm --filter api test -- --coverage
# View: apps/api/coverage/index.html
```

**Test Requirements**:
- Coverage thresholds: ~75–84%
- Mock external services
- Mock JWT: `process.env.JWT_SECRET = 'test-secret'`
