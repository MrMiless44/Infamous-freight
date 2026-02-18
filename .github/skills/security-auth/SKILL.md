---
name: Security & Authentication
description: Implement JWT authentication, scope-based authorization, rate limiting, and security best practices
applyTo:
  - apps/api/src/middleware/security.js
  - apps/api/src/routes/**/*
keywords:
  - jwt
  - authentication
  - authorization
  - rate limiting
  - scopes
  - security
  - helmet
  - sentry
  - cors
---

# Security & Authentication Skill

## 📋 Quick Rules

1. **Auth Pattern**: `authenticate → requireScope → auditLog` middleware chain
2. **Rate Limits**: general 100/15m, auth 5/15m, ai 20/1m, billing 30/15m
3. **Error Handling**: Delegate to global `errorHandler` via `next(err)`
4. **JWT Scopes**: Define per-route, enforce via `requireScope()`
5. **Security Headers**: Applied via Helmet in `securityHeaders.js`

## 🔐 Authentication Flow

### 1. Middleware Setup

```javascript
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');

// Apply to protected routes:
router.post(
  '/shipment/create',
  limiters.general,      // Rate limit: 100/15min
  authenticate,          // Verify JWT token
  requireScope('shipment:create'), // Check permission
  auditLog,              // Log audit trail
  // ... handlers
);
```

### 2. JWT Token Structure

```typescript
interface JwtPayload {
  sub: string;           // User ID
  email: string;         // User email
  role: string;          // User role (ADMIN, DRIVER, USER)
  scopes: string[];      // Permission scopes
  iat: number;           // Issued at
  exp: number;           // Expiry time
}
```

### 3. Scope Definitions

**Common Scopes**:
- `ai:command` - Run AI inference
- `shipment:read` - View shipments
- `shipment:create` - Create shipments
- `shipment:update` - Update shipments
- `billing:*` - Billing operations
- `voice:ingest` - Upload audio
- `voice:command` - Voice commands
- `admin:*` - All admin operations

## 🛡️ Middleware Implementation

### `middleware/security.js`

```javascript
const jwt = require('jsonwebtoken');
const { ApiResponse, HTTP_STATUS } = require('@infamous-freight/shared');

// Rate limiters
const limiters = {
  general: createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  auth: createLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  billing: createLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  ai: createLimiter({ windowMs: 60 * 1000, max: 20 }),
};

// Authenticate JWT token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      new ApiResponse({ success: false, error: 'Missing token' })
    );
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      new ApiResponse({ success: false, error: 'Invalid token' })
    );
  }
};

// Require specific scope
const requireScope = (requiredScope) => (req, res, next) => {
  const userScopes = req.user?.scopes || [];
  
  if (!userScopes.includes(requiredScope)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      new ApiResponse({ success: false, error: 'Insufficient permissions' })
    );
  }
  
  next();
};

// Audit logging
const auditLog = (req, res, next) => {
  const auditEntry = {
    userId: req.user?.sub,
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };
  
  logger.info('Audit', auditEntry);
  next();
};

module.exports = { limiters, authenticate, requireScope, auditLog };
```

## 🔑 CORS Configuration

**Environment**: `CORS_ORIGINS` (comma-separated list)

```javascript
// middleware/security.js
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
```

**Example** (`.env`):
```bash
CORS_ORIGINS=http://localhost:3000,https://infamousfreight.com
```

## 🎯 Route Security Examples

### Scoped Endpoints

```javascript
// Public endpoint (no auth)
router.get('/health', (req, res) => { /* */ });

// Protected endpoint (auth required, any scope)
router.get(
  '/user/profile',
  limiters.general,
  authenticate,
  auditLog,
  async (req, res) => { /* */ }
);

// Scope-restricted endpoint
router.post(
  '/shipment/create',
  limiters.general,
  authenticate,
  requireScope('shipment:create'),
  auditLog,
  [validateShipment, handleValidationErrors],
  async (req, res, next) => { /* */ }
);

// Admin-only endpoint
router.delete(
  '/user/:id',
  limiters.general,
  authenticate,
  requireScope('admin:*'),
  auditLog,
  async (req, res, next) => { /* */ }
);
```

## 🚨 Error Handling with Sentry

```javascript
const Sentry = require('@sentry/node');

// Initialize
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
  tracesSampleRate: 0.1,
});

// Capture auth errors
router.use(authenticate, (err, req, res, next) => {
  Sentry.captureException(err, {
    tags: { auth: 'failed' },
    user: { id: req.user?.sub },
  });
  next(err);
});
```

## 🧪 Testing Auth

```javascript
// src/tests/auth.test.js
describe('Authentication', () => {
  const validToken = jwt.sign(
    { sub: '123', email: 'user@test.com', scopes: ['shipment:read'] },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  test('rejects requests without token', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
  });

  test('accepts valid token', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
  });

  test('rejects insufficient scopes', async () => {
    const limitedToken = jwt.sign(
      { sub: '123', scopes: ['user:read'] },
      process.env.JWT_SECRET
    );
    
    const res = await request(app)
      .post('/api/admin/action')
      .set('Authorization', `Bearer ${limitedToken}`);
    expect(res.status).toBe(403);
  });
});
```

## 📋 Security Checklist

- ✅ All protected routes use `authenticate` middleware
- ✅ Sensitive operations require specific `requireScope()`
- ✅ Rate limits applied appropriately per endpoint
- ✅ CORS origins whitelist configured in `.env`
- ✅ JWT secret in environment (not hardcoded)
- ✅ Errors delegated to global `errorHandler`
- ✅ Audit logging on sensitive operations
- ✅ Sentry DSN configured for production monitoring
- ✅ Helmet security headers enabled
- ✅ Input validation + `handleValidationErrors`

## 🔗 Resources

- [JWT.io](https://jwt.io) - Token debugger
- [Helmet Docs](https://helmetjs.github.io/) - Security headers
- [Sentry Docs](https://docs.sentry.io/) - Error tracking
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Security best practices
