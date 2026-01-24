# Infamous Freight Shared Package

Shared TypeScript types, constants, and utilities used across all packages in the Infamous Freight monorepo.

## 📋 Overview

This package provides a centralized location for shared code that is used by multiple packages:
- **API** (backend)
- **Web** (Next.js frontend)
- **Mobile** (React Native/Expo app)

## 🎯 Purpose

- **Type Safety**: Shared TypeScript interfaces and types
- **Constants**: Centralized configuration values
- **Utilities**: Common helper functions
- **Consistency**: Single source of truth for domain models

## 🛠 Tech Stack

- **TypeScript**: 5.5+
- **Build**: TypeScript compiler (tsc)
- **Module System**: CommonJS (compatible with API's CommonJS)

## 📦 Installation

This package is workspace-internal and installed automatically with pnpm:

```bash
# From repository root
pnpm install
```

## 🏗 Building

The shared package **must be built before** using it in other packages:

```bash
# From repository root
pnpm --filter @infamous-freight/shared build

# Or from packages/shared directory
cd packages/shared && pnpm build
```

This compiles TypeScript source files from `src/` to JavaScript in `dist/`.

## 📚 Usage

### In API (CommonJS)

```javascript
const { SHIPMENT_STATUSES, HTTP_STATUS } = require('@infamous-freight/shared');
const { ApiResponse } = require('@infamous-freight/shared');

// Use constants
if (status === SHIPMENT_STATUSES.DELIVERED) {
  // ...
}

// Use response type
const response = new ApiResponse({
  success: true,
  data: shipment
});
res.status(HTTP_STATUS.OK).json(response);
```

### In Web (ESM/TypeScript)

```typescript
import { SHIPMENT_STATUSES, ApiResponse, type Shipment } from '@infamous-freight/shared';

// Use types
const shipment: Shipment = {
  id: '123',
  status: SHIPMENT_STATUSES.IN_TRANSIT,
  // ...
};

// Use response type
const response: ApiResponse<Shipment> = {
  success: true,
  data: shipment
};
```

## 📁 Structure

```
packages/shared/
├── src/
│   ├── types.ts         # TypeScript interfaces and types
│   ├── constants.ts     # Shared constants
│   ├── utils.ts         # Utility functions
│   ├── env.ts           # Environment configuration
│   └── index.ts         # Main export file
├── dist/                # Compiled output (git-ignored)
├── tsconfig.json        # TypeScript configuration
├── package.json
└── README.md
```

## 📝 Exports

### Types (`types.ts`)

Domain models and interfaces:

```typescript
export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  origin: Location;
  destination: Location;
  // ...
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  // ...
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  meta?: ResponseMeta;
}
```

### Constants (`constants.ts`)

Shared configuration values:

```typescript
export const SHIPMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
} as const;
```

### Utilities (`utils.ts`)

Helper functions:

```typescript
export function generateTrackingNumber(): string;
export function formatCurrency(amount: number, currency?: string): string;
export function isValidEmail(email: string): boolean;
export function sanitizeInput(input: string): string;
```

### Environment (`env.ts`)

Environment variable validation and access:

```typescript
export interface EnvConfig {
  nodeEnv: string;
  apiPort: number;
  databaseUrl: string;
  jwtSecret: string;
  // ...
}

export const env: EnvConfig;
```

## 🔄 Development Workflow

### Making Changes

1. **Edit source files** in `src/`
2. **Rebuild the package**:
   ```bash
   pnpm --filter @infamous-freight/shared build
   ```
3. **Restart dependent services** (API, Web):
   ```bash
   pnpm dev
   ```

### Type Checking

```bash
# Type check without emitting files
pnpm --filter @infamous-freight/shared typecheck
```

### Cleaning Build Artifacts

```bash
pnpm --filter @infamous-freight/shared clean
```

## ⚠️ Important Notes

### Build Before Use

The shared package **must be built** before starting the API or Web app:

```bash
# Correct order
pnpm --filter @infamous-freight/shared build
pnpm dev
```

### Why CommonJS?

The shared package uses CommonJS module format because:
1. The API is CommonJS-based
2. Maximum compatibility across packages
3. Simpler interop without ESM/CJS mixed modules

### Incremental Builds

TypeScript's incremental compilation is enabled. Build cache is stored in `.cache/tsbuildinfo.json`.

## 🧪 Testing

Currently, the shared package does not have tests since it primarily contains types and constants. However, integration tests in API and Web packages validate the usage of shared code.

## 🤝 Contributing

### Adding New Types

1. Add type definitions to `src/types.ts`
2. Export from `src/index.ts`
3. Rebuild: `pnpm build`
4. Update documentation

### Adding New Constants

1. Add constants to `src/constants.ts`
2. Export from `src/index.ts`
3. Rebuild: `pnpm build`
4. Document usage in this README

### Adding New Utilities

1. Add function to `src/utils.ts`
2. Export from `src/index.ts`
3. Add JSDoc comments
4. Rebuild: `pnpm build`
5. Consider adding tests if complex logic

## 📄 License

Proprietary - Copyright © 2025 Infæmous Freight. All Rights Reserved.

---

**Note**: This is an internal workspace package and is not published to npm.
