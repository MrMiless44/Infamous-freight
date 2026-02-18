---
name: Shared Package Development
description: Manage and build TypeScript shared package with domain types, constants, utilities, and environment configuration
applyTo:
  - packages/shared/src/**/*
keywords:
  - shared
  - types
  - constants
  - utilities
  - typescript
  - build
  - dist
---

# Shared Package Development Skill

## 📋 Critical Rules

1. **Is Shared Code**: `@infamous-freight/shared` must be imported everywhere, never redefined
2. **Build Required**: When types/constants/utils change, rebuild BEFORE restarting services
3. **Export Everything**: All domain types, enums, constants, validators must be exports

## 🏗️ Package Structure

```
packages/shared/
├── src/
│   ├── types.ts        # Domain types, interfaces
│   ├── constants.ts    # Enums, static values (SHIPMENT_STATUSES, HTTP_STATUS, etc.)
│   ├── utils.ts        # Helper functions, validators
│   ├── env.ts          # Environment parsing & validation
│   └── index.ts        # Main export barrel
├── dist/               # Compiled output (auto-generated)
├── package.json
└── tsconfig.json
```

## 📝 Example Structure (`src/index.ts`)

```typescript
// Export types
export type {
  User,
  Shipment,
  ApiResponse,
  PaginationInput,
} from './types';

// Export constants/enums
export {
  SHIPMENT_STATUSES,
  USER_ROLES,
  HTTP_STATUS,
  RATE_LIMITS,
} from './constants';

// Export utilities
export {
  validateEmail,
  validatePhone,
  formatCurrency,
  parseJwt,
} from './utils';

// Export environment config
export { env } from './env';
```

## 🔄 Workflow: After Editing Shared

1. **Update files** in `packages/shared/src/*.ts`
2. **Build package**:
   ```bash
   pnpm --filter @infamous-freight/shared build
   ```
3. **Restart services** (if already running):
   ```bash
   pnpm dev  # or individually: pnpm api:dev, pnpm web:dev
   ```

## 📚 Key Exports

### Types (`src/types.ts`)
- `ApiResponse<T>` - Standard API response wrapper
- `User`, `Shipment`, `Driver` - Domain models
- `JwtPayload` - JWT token structure
- Request/Response DTOs

### Constants (`src/constants.ts`)
- `SHIPMENT_STATUSES` - enum of valid statuses
- `USER_ROLES` - enum of user roles
- `HTTP_STATUS` - HTTP status codes (200, 404, etc.)
- `RATE_LIMITS` - rate limit configurations
- `SCOPES` - JWT scope definitions

### Utilities (`src/utils.ts`)
- `validateEmail(email)` - Email validation
- `validatePhone(phone)` - Phone validation
- `validateUUID(uuid)` - UUID validation
- `formatCurrency(amount)` - Format to USD
- `parseJwt(token)` - Decode JWT

## 🛠️ Build Configuration

**`tsconfig.json`** - Compiles to `dist/`
**`package.json`** - Exports:
```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

## 🧪 Testing

```bash
pnpm --filter @infamous-freight/shared test
```

Ensure utilities, validators, and type exports work correctly.

## ⚠️ Anti-Patterns

❌ **DON'T**: Redefine types in API or Web
❌ **DON'T**: Hardcode status strings instead of using enums
❌ **DON'T**: Forget to rebuild after type/constant changes
❌ **DON'T**: Import non-exported items directly from src/

✅ **DO**: Import from `@infamous-freight/shared`
✅ **DO**: Rebuild before restarting services
✅ **DO**: Export all domain concepts from src/index.ts
