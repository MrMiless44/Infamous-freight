# Infæmous Freight - Codebase Recommendations

**Generated**: 2026-03-16
**Status**: Active Recommendations

---

## Executive Summary

This document provides comprehensive recommendations for improving the Infæmous Freight codebase based on a thorough analysis of code quality, security, performance, documentation, and best practices.

### Priority Matrix

| Priority | Count | Timeline | Impact |
|----------|-------|----------|--------|
| **CRITICAL** | 5 | Q1 2026 | High |
| **HIGH** | 5 | Q1-Q2 2026 | Medium-High |
| **MEDIUM** | 5 | Q2-Q3 2026 | Medium |
| **LOW** | 5 | Ongoing | Low-Medium |

---

## 1. CRITICAL PRIORITY (Q1 2026)

### 1.1 XXE Vulnerability Monitoring (CRITICAL - Security)
**Issue**: XXE injection vulnerability via AWS SDK XML parsing
**CVE**: 10.0 severity
**Status**: Blocked - awaiting AWS SDK fix
**Timeline**: Monitor for Q2 2026 release

**Actions Required**:
1. Implement XML schema validation before parsing
2. Create incident response plan for exploitation attempts
3. Add explicit XXE protection in XML parser configuration
4. Monitor AWS SDK release notes for security patches

**Files Affected**: `apps/api/src/services/*` (S3, Billing operations)

---

### 1.2 Replace console.log with Structured Logging (CRITICAL - Operations)
**Issue**: 309 console statements in production code
**Impact**: Potential information leakage, interferes with structured logging

**Actions Required**:
```javascript
// Before
console.log("User logged in", userId);

// After
logger.info("User logged in", { userId, timestamp: Date.now() });
```

**Implementation Steps**:
1. Add ESLint rule: `"no-console": ["error", { allow: ["warn", "error"] }]`
2. Create migration script to replace console.* with logger.*
3. Run codemod across all source files
4. Update CI to enforce no-console rule

**Files**: All `apps/api/src/**/*.{js,ts}` files

---

### 1.3 Complete TypeScript Migration (CRITICAL - Code Quality)
**Issue**: 520 source files mixing .js and .ts with duplicates
**Impact**: Confusion about canonical files, migration path unclear

**Duplicate Files Found**:
- `apps/api/src/app.js` and `apps/api/src/app.ts`
- `apps/api/src/auth/jwt.js` and `apps/api/src/auth/jwt.ts`
- `apps/api/src/index.js` and `apps/api/src/index.ts`

**Actions Required**:
1. Audit all duplicate .js/.ts pairs
2. Choose TypeScript version as canonical
3. Delete .js versions after verification
4. Update imports across codebase
5. Add pre-commit hook to prevent new .js files in TypeScript directories

**Timeline**: 2-3 sprints

---

### 1.4 Consolidate Service Layer (CRITICAL - Maintainability)
**Issue**: 149 service files with significant overlap
**Impact**: Code duplication, maintenance burden

**Consolidation Plan**:

| Current Services | Consolidated Service | Reduction |
|-----------------|---------------------|-----------|
| analyticsService.js, analyticsBIService.js, advancedReporting.js, advancedReportingEngine.js | analytics/index.ts | 4 → 1 |
| emailService.js, emailService.aws-ses.js | email/provider.ts (with strategy pattern) | 2 → 1 |
| notificationService.js, pushNotifications.js, pushNotificationService.js, smsNotifications.js | notifications/index.ts | 4 → 1 |
| twoFactorAuthService.js, mfaService.js, multiFactorAuth.js | auth/mfa.ts | 3 → 1 |
| queryOptimization.js, queryOptimizationService.js | database/optimization.ts | 2 → 1 |

**Expected Result**: 149 files → ~50 services

---

### 1.5 Fix Dockerfile Consistency (CRITICAL - Deployment)
**Issue**: Multiple Dockerfiles with different Node versions and bad practices

**Current State**:
```dockerfile
# apps/api/Dockerfile - Node 20
FROM node:20-alpine
RUN pnpm install --no-frozen-lockfile  # ❌ Non-reproducible

# Dockerfile.api - Node 24
FROM node:24-alpine
RUN pnpm install --no-frozen-lockfile  # ❌ Non-reproducible
```

**Recommended Solution**:
```dockerfile
# Use multi-stage build
FROM node:22-alpine AS base
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @infamous-freight/api...

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @infamous-freight/api build

FROM node:22-alpine AS production
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

**Actions**:
1. Consolidate to single `apps/api/Dockerfile`
2. Remove `Dockerfile.api` from root
3. Standardize on Node 22 LTS
4. Add security scanning layer
5. Implement minimal production stage

---

## 2. HIGH PRIORITY (Q1-Q2 2026)

### 2.1 Reduce Jest Coverage Thresholds
**Current**:
```javascript
coverageThreshold: {
  global: {
    lines: 100,
    functions: 100,
    branches: 100,
    statements: 100
  }
}
```

**Recommended**:
```javascript
coverageThreshold: {
  global: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  },
  // Critical paths require higher coverage
  './src/auth/**': {
    lines: 95,
    functions: 95,
    branches: 90
  },
  './src/billing/**': {
    lines: 95,
    functions: 95,
    branches: 90
  },
  './src/marketplace/**': {
    lines: 90,
    functions: 90,
    branches: 85
  }
}
```

**Rationale**: 100% coverage is unrealistic and leads to testing anti-patterns

---

### 2.2 Consolidate Logger Implementations
**Issue**: 3 separate logger implementations

**Files**:
- `apps/api/src/lib/logger.ts`
- `apps/api/src/middleware/logger.js`
- `apps/api/src/utils/logger.js`

**Solution**:
1. Keep `apps/api/src/lib/logger.ts` as canonical
2. Move to shared package: `packages/shared/src/logger/index.ts`
3. Export from shared: `export { logger } from '@infamous-freight/shared'`
4. Update all imports
5. Delete duplicate implementations

---

### 2.3 Add Startup Environment Validation
**Issue**: No validation that required environment variables are set

**Implementation**:
```typescript
// apps/api/src/config/validateEnv.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  AWS_SES_ACCESS_KEY: z.string().optional(),
  AWS_SES_SECRET_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  REDIS_URL: z.string().url().optional()
}).refine(
  data => data.AWS_SES_ACCESS_KEY || data.SENDGRID_API_KEY,
  { message: "Either AWS SES or SendGrid credentials required" }
);

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Environment validation failed:");
    console.error(error.errors);
    process.exit(1);
  }
}
```

**Usage in server.ts**:
```typescript
import { validateEnv } from './config/validateEnv';

// First thing on startup
const env = validateEnv();
```

---

### 2.4 Fix ESLint Configuration Split
**Issue**: 6 separate ESLint configs with inconsistent rules

**Consolidation Plan**:
1. Keep `/configs/linting/eslint.config.js` as base
2. Extend in workspace packages with documented overrides only
3. Remove redundant configs
4. Document rule inheritance

---

### 2.5 Optimize CI/CD Build Process
**Current Issue**: Shared package rebuilt 5 times in CI

**Optimization**:
```yaml
# .github/workflows/ci.yml
jobs:
  build-shared:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
      - run: pnpm --filter @infamous-freight/shared build
      - uses: actions/upload-artifact@v3
        with:
          name: shared-dist
          path: packages/shared/dist

  lint:
    needs: build-shared
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
      - run: pnpm lint

  test:
    needs: build-shared
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [api, web, mobile, ai, worker]
    steps:
      - uses: actions/download-artifact@v3
      - run: pnpm --filter @infamous-freight/${{ matrix.package }} test
```

**Expected Improvement**: 40% faster CI runs

---

## 3. MEDIUM PRIORITY (Q2-Q3 2026)

### 3.1 Create Service Catalog
**File**: `/docs/services/README.md`

**Template**:
```markdown
# Service Catalog

## Analytics Services
### analytics/index.ts
**Purpose**: Unified analytics data collection and reporting
**Dependencies**: PostgreSQL, Redis
**Environment**: ANALYTICS_DB_URL
**Example Usage**:
\`\`\`typescript
import { trackEvent } from '@infamous-freight/api/analytics';
trackEvent('shipment.created', { shipmentId, userId });
\`\`\`
```

---

### 3.2 React Native 0.74 Upgrade Plan
**Status**: 13 HIGH-risk vulnerabilities blocked
**Timeline**: Q2 2026 for React Native 0.74 release

**Preparation Steps**:
1. Audit dependencies for React Native 0.74 compatibility
2. Create upgrade branch
3. Update testing infrastructure
4. Plan staged rollout

---

### 3.3 Implement SBOM for Supply Chain Security
**Tool**: cyclonedx-npm

**Implementation**:
```bash
# package.json scripts
"sbom:generate": "cyclonedx-npm --output-file sbom.json",
"sbom:scan": "trivy sbom sbom.json"
```

**CI Integration**:
```yaml
- name: Generate SBOM
  run: pnpm sbom:generate
- name: Scan SBOM
  run: pnpm sbom:scan
- name: Upload SBOM
  uses: actions/upload-artifact@v3
  with:
    name: sbom
    path: sbom.json
```

---

### 3.4 Standardize Error Responses
**Interface**:
```typescript
interface ErrorResponse {
  error: {
    code: string;        // e.g., "UNAUTHORIZED"
    message: string;     // Human-readable message
    details?: unknown;   // Additional context
  };
  requestId: string;     // For support tracking
  timestamp: string;     // ISO 8601
}
```

**Middleware**:
```typescript
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      details: err.details
    },
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});
```

---

### 3.5 Consolidate Cache Implementations
**Current**: 5 cache implementations
**Target**: 1 unified cache service with strategies

**Architecture**:
```typescript
// packages/shared/src/cache/index.ts
export interface CacheStrategy {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class RedisCache implements CacheStrategy { /* ... */ }
class MemoryCache implements CacheStrategy { /* ... */ }

export function createCache(type: 'redis' | 'memory'): CacheStrategy {
  return type === 'redis' ? new RedisCache() : new MemoryCache();
}
```

---

## 4. LOW PRIORITY (Ongoing)

### 4.1 Standardize Node Version
- Current: Mixed 20, 22, 24
- Target: Node 22 LTS
- Update: Dockerfiles, .nvmrc, package.json engines

### 4.2 Implement Semantic Versioning
- Use conventional commits
- Auto-generate CHANGELOG.md
- Tag releases with v prefix

### 4.3 Add Contract Testing
- Implement Pact for API consumers
- Document API versions
- Validate before releases

### 4.4 Create Database ER Diagrams
- Generate from Prisma schema
- Document relationships
- Include indexing strategy

### 4.5 Performance Regression Detection
- Baseline API response times
- Alert on >20% degradation
- Track in CI metrics

---

## Implementation Timeline

```
Q1 2026:
├── Week 1-2: Critical security items (1.1, 1.2)
├── Week 3-4: TypeScript migration (1.3)
├── Week 5-8: Service consolidation (1.4)
└── Week 9-12: Dockerfile fixes (1.5), Jest config (2.1)

Q2 2026:
├── Week 1-4: Logger consolidation (2.2), Env validation (2.3)
├── Week 5-8: ESLint fixes (2.4), CI optimization (2.5)
├── Week 9-12: Service catalog (3.1), Error standardization (3.4)
└── Monitor: React Native 0.74 release

Q3 2026:
├── Week 1-4: React Native upgrade (3.2)
├── Week 5-8: SBOM implementation (3.3)
├── Week 9-12: Cache consolidation (3.5)
└── Ongoing: Low priority items (4.*)
```

---

## Metrics for Success

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Service files | 149 | 50 | Q1 2026 |
| console.log usage | 309 | 0 | Q1 2026 |
| Duplicate .js/.ts | 50+ | 0 | Q1 2026 |
| CI build time | ~15min | <10min | Q2 2026 |
| Test coverage | 100% (strict) | 80% (realistic) | Q1 2026 |
| Security vulnerabilities (HIGH+) | 13 | 0 | Q3 2026 |

---

## Review Schedule

This document should be reviewed and updated:
- **Monthly**: During sprint planning
- **Quarterly**: Full progress review
- **Annually**: Complete refresh

Last updated: 2026-03-16
Next review: 2026-04-16
