# WEEK 2A: DATABASE INTEGRATION 100%

**Phase**: Database Migration & Persistence  
**Time**: 2-4 hours  
**Status**: STARTING  
**Target**: Replace mock data with PostgreSQL

---

## 🎯 OBJECTIVE

Transition from in-memory mock data to persistent PostgreSQL database while maintaining all API functionality and adding new features.

---

## ✅ STEP 1: VERIFY POSTGRESQL SETUP

### Check Docker Status

```bash
# List running containers
docker ps

# Start PostgreSQL if needed
docker-compose up -d postgres

# Verify connection
docker exec -it postgres psql -U postgres -c "SELECT version();"
```

### Connection Details

```
Host: localhost
Port: 5432
User: postgres
Password: (check .env or docker-compose.yml)
Database: infamous_freight
```

---

## ✅ STEP 2: UPDATE PRISMA SCHEMA

### Current State

The Prisma schema should already exist at `api/prisma/schema.prisma`

### Required Updates

```prisma
// Enable relationship between User and Shipment
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  role      String    @default("user")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  shipments Shipment[] // Add this line
}

model Shipment {
  id              Int     @id @default(autoincrement())
  trackingNumber  String  @unique
  status          String
  origin          String
  destination     String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String?   // FK to User
  user            User?     @relation(fields: [createdBy], references: [id])

  // Add indexes for performance
  @@index([status])
  @@index([trackingNumber])
  @@index([createdAt])
}
```

---

## ✅ STEP 3: RUN DATABASE MIGRATIONS

### First Time Setup

```bash
cd api

# Install Prisma if not already done
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name initial_migration

# Open Prisma Studio to verify schema
pnpm prisma studio
```

### Verify Migration

- Open `http://localhost:5555` (Prisma Studio)
- Should see `users` and `shipments` tables
- Click "Seed" to add test data (optional)

---

## ✅ STEP 4: CREATE DATABASE SEED FILE

### File: `api/prisma/seed.js`

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.shipment.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: "hashed_password", // In production, use bcrypt
      role: "admin",
    },
  });

  // Create test shipments
  const shipments = await prisma.shipment.createMany({
    data: [
      {
        trackingNumber: "IFE-001",
        status: "IN_TRANSIT",
        origin: "Los Angeles",
        destination: "New York",
        createdBy: user.id,
      },
      {
        trackingNumber: "IFE-002",
        status: "DELIVERED",
        origin: "Chicago",
        destination: "Miami",
        createdBy: user.id,
      },
      {
        trackingNumber: "IFE-003",
        status: "PENDING",
        origin: "Seattle",
        destination: "Boston",
        createdBy: user.id,
      },
    ],
  });

  console.log(`✅ Created ${shipments.count} shipments`);
  console.log(`✅ Created user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seed

```bash
cd api
pnpm prisma db seed
```

---

## ✅ STEP 5: UPDATE API TO USE DATABASE

### Update: `api/production-server.js`

**Replace the mock data section:**

```javascript
// OLD (remove this):
// let mockShipments = [
//   { id: 1, trackingNumber: 'IFE-001', ... }
// ];

// NEW (add this):
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
```

### Update GET /api/shipments

```javascript
// OLD version with mock data:
router.get("/api/shipments", authenticate, async (req, res) => {
  const filtered = mockShipments.filter(
    (s) => !req.query.status || s.status === req.query.status,
  );
  res.json({ success: true, data: filtered });
});

// NEW version with database:
router.get("/api/shipments", authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search } },
        { origin: { contains: search } },
        { destination: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.shipment.count({ where });

    // Get paginated results
    const shipments = await prisma.shipment.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: order },
    });

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});
```

### Update POST /api/shipments

```javascript
// NEW version with database:
router.post("/api/shipments", authenticate, async (req, res) => {
  try {
    const errors = validateShipment(req.body);
    if (errors.length) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: errors });
    }

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: req.body.trackingNumber,
        status: req.body.status || "PENDING",
        origin: req.body.origin,
        destination: req.body.destination,
        createdBy: req.user.sub,
      },
    });

    cache.set(`shipment:${shipment.id}`, shipment, 600000);
    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Tracking number already exists" });
    }
    res.status(500).json({ error: "Failed to create shipment" });
  }
});
```

### Update GET /api/shipments/:id

```javascript
router.get("/api/shipments/:id", authenticate, async (req, res) => {
  try {
    const cacheKey = `shipment:${req.params.id}`;
    let shipment = cache.get(cacheKey);

    if (!shipment) {
      shipment = await prisma.shipment.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }

      cache.set(cacheKey, shipment, 600000);
    }

    res.json({ success: true, data: shipment });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shipment" });
  }
});
```

### Update PUT /api/shipments/:id

```javascript
router.put("/api/shipments/:id", authenticate, async (req, res) => {
  try {
    const shipment = await prisma.shipment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: req.body.status,
        origin: req.body.origin,
        destination: req.body.destination,
      },
    });

    cache.delete(`shipment:${req.params.id}`);
    res.json({ success: true, data: shipment });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Shipment not found" });
    }
    res.status(500).json({ error: "Failed to update shipment" });
  }
});
```

### Update DELETE /api/shipments/:id

```javascript
router.delete("/api/shipments/:id", authenticate, async (req, res) => {
  try {
    await prisma.shipment.delete({
      where: { id: parseInt(req.params.id) },
    });

    cache.delete(`shipment:${req.params.id}`);
    res.json({ success: true, message: "Shipment deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Shipment not found" });
    }
    res.status(500).json({ error: "Failed to delete shipment" });
  }
});
```

---

## ✅ STEP 6: ADD PRISMA DEPENDENCY

```bash
cd api
npm install @prisma/client
# or: pnpm add @prisma/client
```

---

## ✅ STEP 7: TEST DATABASE INTEGRATION

### Start Services

```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d postgres

# Terminal 2: Start API server
cd api
node production-server.js
```

### Test Endpoints

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. List shipments (from database)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/shipments

# 3. Get single shipment
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/shipments/1

# 4. Create new shipment
curl -X POST http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "IFE-NEW-004",
    "status": "PENDING",
    "origin": "Denver",
    "destination": "Phoenix"
  }'

# 5. Update shipment
curl -X PUT http://localhost:4000/api/shipments/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_TRANSIT"}'

# 6. Delete shipment
curl -X DELETE http://localhost:4000/api/shipments/4 \
  -H "Authorization: Bearer $TOKEN"
```

### Verify Data Persistence

```bash
# Open Prisma Studio
cd api
pnpm prisma studio

# Or query directly
docker exec postgres psql -U postgres -d infamous_freight -c "SELECT * FROM shipments;"
```

---

## ✅ STEP 8: HANDLE PRISMA CLIENT LIFECYCLE

### Update production-server.js Shutdown

```javascript
// Add graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
```

---

## ✅ STEP 9: UPDATE TESTS

### Update `api/__tests__/api.test.js`

Replace mock data tests with database tests:

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Before each test: clear database
beforeEach(async () => {
  await prisma.shipment.deleteMany();
  await prisma.user.deleteMany();
});

// After all tests: disconnect
afterAll(async () => {
  await prisma.$disconnect();
});

test("createShipment persists to database", async () => {
  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber: "TEST-001",
      status: "PENDING",
      origin: "Test City 1",
      destination: "Test City 2",
    },
  });

  expect(shipment.id).toBeDefined();
  expect(shipment.trackingNumber).toBe("TEST-001");

  // Verify it's in database
  const found = await prisma.shipment.findUnique({
    where: { id: shipment.id },
  });
  expect(found).toBeDefined();
});

test("getShipments returns from database", async () => {
  // Create test shipments
  await prisma.shipment.createMany({
    data: [
      {
        trackingNumber: "DB-001",
        status: "PENDING",
        origin: "A",
        destination: "B",
      },
      {
        trackingNumber: "DB-002",
        status: "DELIVERED",
        origin: "C",
        destination: "D",
      },
    ],
  });

  // Query database
  const shipments = await prisma.shipment.findMany();
  expect(shipments.length).toBe(2);
});
```

---

## ✅ STEP 10: VERIFY MIGRATION COMPLETENESS

### Checklist

- [ ] PostgreSQL container running
- [ ] Prisma migrations applied
- [ ] Database schema created
- [ ] Seed data inserted
- [ ] API updated to use Prisma
- [ ] CRUD operations tested
- [ ] Data persistence verified
- [ ] Tests updated
- [ ] Graceful shutdown implemented
- [ ] Production-server.js updated

### Verification Commands

```bash
# 1. Check database status
docker exec postgres psql -U postgres -d infamous_freight -c "\dt"

# 2. Count shipments
docker exec postgres psql -U postgres -d infamous_freight -c "SELECT COUNT(*) FROM shipments;"

# 3. Check Prisma schema
cd api && pnpm prisma schema

# 4. Run tests
cd api && node __tests__/api.test.js
```

---

## 🎯 EXPECTED RESULTS

**After Database Integration**:

- ✅ All shipment data persisted in PostgreSQL
- ✅ CRUD operations fully functional
- ✅ Data survives API restart
- ✅ Queries optimized with indexes
- ✅ Tests passing with database
- ✅ Graceful shutdown working
- ✅ Ready for Redis caching layer

**Performance Improvements**:

- Query time: <100ms for most operations
- Pagination: O(1) with offset/limit
- Search: <200ms with indexed columns

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Can't reach database"

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Start if needed
docker-compose up -d postgres

# Check logs
docker logs postgres
```

### Issue: "Migration failed"

```bash
# Reset database (⚠️ CAREFUL - DELETES DATA)
cd api
pnpm prisma migrate reset

# Or manually
docker exec postgres dropdb -U postgres infamous_freight
docker exec postgres createdb -U postgres infamous_freight
pnpm prisma migrate deploy
```

### Issue: "Prisma Client not found"

```bash
cd api
pnpm install @prisma/client
pnpm prisma generate
```

---

## ✅ NEXT PHASE

Once database integration is complete, proceed to:

- **Phase 2B**: E2E Testing (Playwright)
- **Phase 2C**: Load Testing (k6)
- **Phase 2D**: Redis Caching

See [NEXT_STEPS_100_WEEK2.md](NEXT_STEPS_100_WEEK2.md) for full Week 2 roadmap.

---

**Status**: Ready to Execute  
**Time Estimate**: 2-4 hours  
**Generated**: January 14, 2026
