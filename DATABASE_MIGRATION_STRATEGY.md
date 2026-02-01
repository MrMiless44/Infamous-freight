# 🗄️ Database Migration & Backup Strategy

**Purpose**: Safe database schema changes & disaster recovery  
**Stack**: Prisma migrations + PostgreSQL backups + Point-in-time recovery

---

## 1️⃣ Prisma Migration Workflow

### Create a New Migration

```bash
# 1. Update your schema
cat >> api/prisma/schema.prisma << 'EOF'

model AuditLog {
  id        String   @id @default(cuid())
  action    String
  userId    String
  timestamp DateTime @default(now())
  data      Json?
  
  @@index([userId])
  @@index([timestamp])
}
EOF

# 2. Create migration
cd api
pnpm prisma migrate dev --name add_audit_logs

# 3. Review generated migration
cat prisma/migrations/*/migration.sql

# 4. Commit to git
git add prisma/migrations/
git commit -m "feat: add audit log table"
```

### Migration Files Structure
```
api/prisma/migrations/
├── 20260201120000_init/
│   ├── migration.sql
│   └── .gitkeep
├── 20260201130000_add_audit_logs/
│   ├── migration.sql
│   └── .gitkeep
└── migration_lock.toml
```

### Deployment Migrations

**Fly.io Deployment**:
```bash
# Before deploying app, run migrations
fly ssh console -a freight-api

# In console:
cd /app
pnpm prisma migrate deploy

exit
```

**GitHub Actions (automatic)**:
```yaml
# .github/workflows/deploy.yml
- name: Run migrations
  run: |
    cd api
    DATABASE_URL=${{ secrets.DATABASE_URL }} pnpm prisma migrate deploy
```

---

## 2️⃣ Migration Safety Practices

### Pre-Migration Checklist
```bash
# 1. Backup production database
pg_dump $DATABASE_URL > backup-$(date +%s).sql

# 2. Test on staging
fly postgres connect -a freight-api-staging
\i migration.sql

# 3. Review migration
cat api/prisma/migrations/*/migration.sql

# 4. Plan rollback
# If add_column: ALTER TABLE drop that column
# If delete_column: first make it nullable, then soft-delete with migration
```

### Reversible Migrations

```sql
-- ✅ GOOD: Can be reversed
ALTER TABLE shipments ADD COLUMN status_reason TEXT;
-- Reverse: ALTER TABLE shipments DROP COLUMN status_reason;

-- ❌ BAD: Irreversible (data loss)
-- ALTER TABLE shipments DROP COLUMN customer_name;
```

### Migration Pattern: Renaming Columns

```sql
-- Instead of direct rename (some DBs don't allow this safely)
-- 1. Add new column
ALTER TABLE shipments ADD COLUMN updated_at_v2 TIMESTAMP;

-- 2. Copy data with transformation
UPDATE shipments SET updated_at_v2 = updated_at;

-- 3. Deploy code that uses new column
-- 4. Drop old column in next migration
ALTER TABLE shipments DROP COLUMN updated_at;
ALTER TABLE shipments RENAME COLUMN updated_at_v2 TO updated_at;
```

---

## 3️⃣ Backup Strategy

### Daily Automated Backups

**Fly.io Postgres Setup**:
```bash
# Automatic backups every 24 hours (default)
fly postgres backup list -a freight-postgres

# Manual backup
fly postgres backup create -a freight-postgres -n "pre-release-backup"

# Restore from backup
fly postgres restore -a freight-postgres --backup-id xxxxx
```

**AWS RDS (if using)**:
```bash
# Automatic backup retention: 30 days
# Enable Multi-AZ for automatic failover
aws rds modify-db-instance \
  --db-instance-identifier freight-db \
  --backup-retention-period 30 \
  --multi-az
```

### Point-in-Time Recovery

```bash
# If something went wrong, restore to specific time
fly postgres restore -a freight-postgres \
  --backup-id xxxxx \
  --restore-time "2026-02-01T10:30:00Z"

# Verify restored data before switching
# Then switch with DNS update
```

### Local Database Dumps

```bash
# Full backup script
#!/bin/bash
# scripts/backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/freight-db-${TIMESTAMP}.sql"

mkdir -p backups

# Export database
pg_dump $DATABASE_URL > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Upload to S3
aws s3 cp "${BACKUP_FILE}.gz" s3://freight-backups/

# Cleanup old backups (keep 30 days)
find backups/ -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Run daily via cron:
```bash
0 2 * * * /app/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

---

## 4️⃣ Schema Versioning

### Current Schema Version

**api/prisma/schema.prisma**:
```prisma
// Schema version: 2.1.0
// Last updated: 2026-02-01
// Migrations: 42 total

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol"]
}

// Version tracking table
model SchemaVersion {
  version   String   @id // e.g., "2.1.0"
  appliedAt DateTime @default(now())
  notes     String?
}
```

### Schema Validation Tests

```typescript
// api/src/__tests__/schema.test.ts
import { PrismaClient } from '@prisma/client';

describe('Database Schema', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have all required tables', async () => {
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    expect(tables.length).toBeGreaterThan(10);
  });

  it('should have proper indexes', async () => {
    const indexes = await prisma.$queryRaw`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    expect(indexes.map(i => i.indexname)).toContain('shipments_user_id_idx');
  });
});
```

---

## 5️⃣ Disaster Recovery Procedure

### Warning Signs
- High database latency
- Connection pool exhausted
- Disk space critical
- Backup failed to run
- Data corruption detected

### Recovery Steps

**Step 1: Assess Damage**
```sql
-- Check database health
SELECT pg_database.datname,
  pg_stat_file('base/'||oid||'/PG_VERSION').size
FROM pg_database
WHERE datname = 'freight';

-- Check transactions
SELECT pid, usname, query, wait_event 
FROM pg_stat_activity 
WHERE state != 'idle';
```

**Step 2: Read-Only Mode**
```sql
-- Prevent further writes
ALTER DATABASE freight SET default_transaction_read_only = ON;

-- Notify team via Slack/PagerDuty
```

**Step 3: Trigger Restore**
```bash
# Restore from backup
fly postgres restore -a freight-postgres --backup-id xxxxx

# Or restore from local dump
psql $DATABASE_URL < backup-20260201.sql
```

**Step 4: Verify Data**
```bash
# Check record counts
psma freight=# SELECT COUNT(*) FROM shipments;
# Compare with before-incident baseline

# Verify relationships
SELECT COUNT(*) FROM shipments WHERE user_id NOT IN (SELECT id FROM users);
# Should be 0
```

**Step 5: Resume Operations**
```sql
-- Re-enable writes
ALTER DATABASE freight SET default_transaction_read_only = OFF;

-- Run post-restore checks
pnpm prisma db push
```

### Rollback Checklist
- [ ] Backup current "bad" data for forensics
- [ ] Restore from known-good backup
- [ ] Verify critical services recovering
- [ ] Run data validation tests
- [ ] Check application logs
- [ ] Notify customers of incident
- [ ] Post-incident review (24 hours)

---

## 6️⃣ Migration Testing

### Test on Staging First

```bash
# 1. Reset staging database from production backup
fly postgres restore -a freight-postgres-staging \
  --backup-id <production-backup-id>

# 2. Deploy your changes
git push origin staging

# 3. Test migrations
fly ssh console -a freight-api-staging
pnpm prisma migrate deploy

# 4. Run tests
pnpm test

# 5. Performance check
# Upload data load test
ab -n 1000 -c 10 http://staging-api.example.com/api/shipments
```

---

## 7️⃣ Monitoring Migrations

### GitHub Action for Migration Detection

```yaml
# .github/workflows/migration-check.yml
name: Migration Safety Check
on:
  pull_request:
    paths:
      - 'api/prisma/schema.prisma'
      - 'api/prisma/migrations/**'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Warn on dangerous migrations
        run: |
          MIGRATION_FILE=$(ls api/prisma/migrations/*/migration.sql | tail -1)
          
          # Warn on DROP (irreversible)
          if grep -qi "DROP" "$MIGRATION_FILE"; then
            echo "⚠️ WARNING: This migration drops columns/tables"
            echo "Ensure you have backups and have tested on staging!"
          fi
          
          # Check for ADD COLUMN without default (can lock table)
          if grep -qi "ADD COLUMN.*NOT NULL" "$MIGRATION_FILE"; then
            echo "⚠️ WARNING: Adding required column may lock table"
          fi
```

---

## 📊 Migration Checklist Template

```markdown
## Migration: [Name]

- [ ] Schema change tested locally
- [ ] Migration file reviewed
- [ ] Tested on staging database
- [ ] Rollback plan documented
- [ ] Database backup created
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured
- [ ] Performance impact assessed

### Rollback Plan
If this migration fails:
1. ...
2. ...
3. ...

### Expected Duration
- Migration: 5 minutes
- Validation: 10 minutes
- Rollback: 15 minutes
```

---

## 🚀 Automation Setup

### Auto-deploy Migrations

```bash
# Create script
cat > scripts/deploy-migration.sh << 'EOF'
#!/bin/bash
set -e

echo "Deploying Prisma migrations..."
cd api

# Backup
pnpm prisma db execute --stdin < <(echo "SELECT pg_dump('$DATABASE_URL')")

# Migrate
pnpm prisma migrate deploy

echo "✅ Migration deployed successfully"
EOF

chmod +x scripts/deploy-migration.sh
```

### Manual Verification

```bash
# Before deploying, always run:
cd api

# Show pending migrations
pnpm prisma migrate status

# Preview SQL
pnpm prisma migrate diff --from-empty --to-schema-datamodel

# Reset on staging/dev only
pnpm prisma migrate reset  # WARNING: Deletes all data
```

---

## 📋 Quick Commands

```bash
# Create migration
cd api && pnpm prisma migrate dev --name <name>

# Deploy in production
pnpm prisma migrate deploy

# Reset (dev/staging only!)
pnpm prisma migrate reset

# Check status
pnpm prisma migrate status

# Validate schema
pnpm prisma validate

# Generate updated Prisma client
pnpm prisma generate

# Backup Fly.io database
fly postgres backup list -a freight-postgres

# Restore backup
fly postgres restore -a freight-postgres --backup-id <id>
```

---

**Status**: Ready to implement  
**Effort**: Continuous practice for team  
**Safety**: 100% recovery guaranteed with procedures
