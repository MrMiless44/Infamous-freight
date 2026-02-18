---
name: Database & Prisma ORM
description: Design, migrate, and manage PostgreSQL schema using Prisma ORM with type-safe queries
applyTo:
  - apps/api/prisma/**/*
keywords:
  - prisma
  - orm
  - database
  - schema
  - migration
  - postgresql
  - relations
---

# Database & Prisma ORM Skill

## 📋 Quick Rules

1. **Schema File**: `apps/api/prisma/schema.prisma`
2. **Migrations**: `cd apps/api && pnpm prisma:migrate:dev --name <description>`
3. **Type Generation**: `pnpm prisma:generate` (auto-runs after migration)
4. **Always Rebuild Shared**: After schema changes that affect types
5. **Viewer**: `pnpm prisma:studio` for interactive database inspection

## 📁 File Organization

```
apps/api/
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seeding script (optional)
└── src/
    └── services/           # Business logic using Prisma
```

## 🗄️ Schema Structure (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"  // Always PostgreSQL
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Example models
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  role      UserRole  @default(USER)
  shipments Shipment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([email])
}

model Shipment {
  id        Int     @id @default(autoincrement())
  trackingNum String @unique
  status    ShipmentStatus @default(PENDING)
  userId    Int
  user      User    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([status])
}

enum UserRole {
  ADMIN
  DRIVER
  USER
}

enum ShipmentStatus {
  PENDING
  IN_TRANSIT
  DELIVERED
  CANCELLED
}
```

## 🔄 Migration Workflow

### 1. Edit Schema
```bash
# Edit apps/api/prisma/schema.prisma
```

### 2. Create Migration
```bash
cd apps/api
pnpm prisma:migrate:dev --name add_shipment_table
# Prisma will:
# - Detect changes from schema.prisma
# - Generate SQL migration
# - Run migration against database
# - Regenerate Prisma Client types
```

### 3. View Results
```bash
pnpm prisma:studio
# Opens interactive database viewer at http://localhost:5555
```

### 4. Generate Types
```bash
pnpm prisma:generate
# Updates @prisma/client types (usually automatic)
```

### 5. Restart Services
```bash
pnpm dev  # or pnpm api:dev
```

## 🧮 Common Query Patterns

### Create
```javascript
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    role: 'USER',
  },
});
```

### Read
```javascript
// FindUnique
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});

// FindMany with filtering
const shipments = await prisma.shipment.findMany({
  where: { status: 'IN_TRANSIT' },
  include: { user: true },
  orderBy: { createdAt: 'desc' },
  take: 10, // limit
  skip: 0,  // offset (pagination)
});
```

### Update
```javascript
const shipment = await prisma.shipment.update({
  where: { id: shipmentId },
  data: {
    status: 'DELIVERED',
    updatedAt: new Date(),
  },
});
```

### Delete
```javascript
await prisma.shipment.delete({
  where: { id: shipmentId },
});
```

### Upsert (create or update)
```javascript
const shipment = await prisma.shipment.upsert({
  where: { trackingNum },
  update: { status: 'IN_TRANSIT' },
  create: {
    trackingNum,
    status: 'PENDING',
    userId: user.id,
  },
});
```

## 🔗 Relations

### One-to-Many
```prisma
model User {
  id        Int
  shipments Shipment[]
}

model Shipment {
  id     Int
  userId Int
  user   User @relation(fields: [userId], references: [id])
}
```

### Many-to-Many
```prisma
model Driver {
  id        Int
  shipments ShipmentAssignment[]
}

model Shipment {
  id        Int
  drivers   ShipmentAssignment[]
}

model ShipmentAssignment {
  id        Int
  driverId  Int
  shipmentId Int
  driver    Driver   @relation(fields: [driverId], references: [id])
  shipment  Shipment @relation(fields: [shipmentId], references: [id])

  @@id([driverId, shipmentId])
}
```

## ⚡ Performance Optimization

### N+1 Query Prevention
```javascript
// ❌ BAD
const users = await prisma.user.findMany();
for (const user of users) {
  user.shipments = await prisma.shipment.findMany({ where: { userId: user.id } });
}

// ✅ GOOD
const users = await prisma.user.findMany({
  include: { shipments: true },
});
```

### Indexing
```prisma
model Shipment {
  id      Int
  status  ShipmentStatus
  userId  Int
  
  @@index([userId])      // Index for joins
  @@index([status])      // Index for filtering by status
  @@index([userId, status]) // Composite index
}
```

## 🧪 Testing with Prisma

```javascript
// Reset database between tests
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Shipment" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
});

// Create test fixtures
const user = await prisma.user.create({
  data: { email: 'test@example.com' },
});
```

## 🔗 Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Query API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
