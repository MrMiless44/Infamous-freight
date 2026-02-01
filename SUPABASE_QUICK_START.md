# Supabase Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- ✅ Docker installed and running
- ✅ pnpm installed (v10.28.2+)
- ✅ Node.js 24.x installed

### Step 1: Install Supabase CLI (30 seconds)

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Or use npm
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Start Supabase (2 minutes)

```bash
# From project root
cd /workspaces/Infamous-freight-enterprises

# Start all Supabase services
supabase start

# ⏳ First run takes ~2 minutes (downloads Docker images)
# ⚡ Subsequent starts take ~10 seconds
```

**You'll see output like this**:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Access Supabase Studio (10 seconds)

Open your browser to: **http://localhost:54323**

You'll see the Supabase admin interface with:
- 📊 **Database**: 9 tables, 3 views ready
- 🔐 **Auth**: User management
- 📁 **Storage**: 5 buckets configured
- ⚡ **Edge Functions**: 3 functions deployed
- 📈 **Logs**: Real-time query logs

### Step 4: Update Web App Environment (30 seconds)

```bash
# Copy to web app
cp apps/web/.env.example apps/web/.env.local

# Edit apps/web/.env.local
# Update these values from `supabase start` output:
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
```

### Step 5: Start Development (30 seconds)

```bash
# Start web app
pnpm web:dev

# Open: http://localhost:3000
```

---

## 📊 What You Get Out of the Box

### 1. Database (9 Tables Ready)

- **organizations** - Multi-tenant structure
- **users** - User profiles (linked to auth)
- **drivers** - Driver management
- **customers** - Customer accounts
- **shipments** - Freight tracking
- **shipment_events** - Activity timeline
- **invoices** - Billing
- **invoice_items** - Line items
- **audit_logs** - System audit trail

### 2. Security (40+ Policies Active)

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Organization-level data isolation
- ✅ Role-based access (admin, manager, dispatcher, driver, user)
- ✅ Self-service profile management
- ✅ Audit logging

### 3. Storage (5 Buckets)

- **shipment-documents** (private, 50MB)
- **driver-documents** (private, 10MB)
- **invoices** (private, 10MB)
- **organization-logos** (public, 2MB)
- **avatars** (public, 1MB)

### 4. Edge Functions (3 APIs)

- **analytics** - Dashboard metrics
- **shipment-tracking** - Real-time location updates
- **thread-summary** - Message summarization

### 5. Demo Data (Testing Ready)

- 1 organization: "Infamous Freight Enterprises"
- 3 customers: Acme Corp, TechStart Inc, Global Logistics
- No users/drivers (create via auth signup)

---

## 🧪 Testing the Integration

### Test 1: View Database

```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run queries
\dt  # List tables
SELECT * FROM public.organizations;
SELECT * FROM public.customers;
\q   # Quit
```

### Test 2: Call Edge Function

```bash
# Test analytics function
curl -X POST 'http://localhost:54321/functions/v1/analytics' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"timeRange": "7d"}'
```

### Test 3: Upload File (from Web App)

```typescript
// In your React component
const uploadFile = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${userId}/avatar.jpg`, file);
    
  if (error) console.error('Error:', error);
  else console.log('Success:', data);
};
```

---

## 🎯 Common Use Cases

### 1. Fetch Shipments (with Relations)

```typescript
import { createBrowserClient } from '@/lib/supabase/browser';

const supabase = createBrowserClient();

const { data: shipments, error } = await supabase
  .from('shipments')
  .select(`
    *,
    customer:customers(name, email),
    driver:drivers(
      *,
      user:users(display_name, email)
    ),
    events:shipment_events(*)
  )
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false });
```

### 2. Subscribe to Real-Time Updates

```typescript
// Subscribe to shipment changes
const subscription = supabase
  .channel('shipments')
  .on(
    'postgres_changes',
    {
      event: '*',  // 'INSERT', 'UPDATE', 'DELETE', or '*'
      schema: 'public',
      table: 'shipments',
      filter: `organization_id=eq.${orgId}`
    },
    (payload) => {
      console.log('Change received!', payload);
      // Update UI in real-time
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

### 3. Call Edge Function

```typescript
// Get analytics data
const { data, error } = await supabase.functions.invoke('analytics', {
  body: {
    timeRange: '30d',
    metrics: ['shipments', 'drivers', 'revenue']
  }
});

if (data) {
  console.log('Analytics:', data);
  // {
  //   shipments: { total: 150, pending: 20, in_transit: 50, ... },
  //   drivers: { total: 30, available: 15, ... },
  //   revenue: { total: 50000, ... }
  // }
}
```

### 4. Upload Document

```typescript
// Upload shipment document
const uploadDocument = async (shipmentId: string, file: File) => {
  const filePath = `${shipmentId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('shipment-documents')
    .upload(filePath, file);
  
  if (error) throw error;
  
  // Get signed URL (for private buckets)
  const { data: { signedUrl } } = await supabase.storage
    .from('shipment-documents')
    .createSignedUrl(filePath, 3600);  // 1 hour expiry
  
  return signedUrl;
};
```

### 5. Create Shipment with Event

```typescript
// Create shipment and initial event in a transaction
const createShipment = async (shipmentData) => {
  // Insert shipment
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      cargo_description: 'Electronics',
      status: 'pending',
      // ... other fields
    })
    .select()
    .single();
  
  if (shipmentError) throw shipmentError;
  
  // Create initial event
  const { error: eventError } = await supabase
    .from('shipment_events')
    .insert({
      shipment_id: shipment.id,
      event_type: 'created',
      description: 'Shipment created',
      created_by: userId
    });
  
  if (eventError) throw eventError;
  
  return shipment;
};
```

---

## 🛠️ Essential Commands

### Supabase Management

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Restart Supabase
supabase stop && supabase start

# Reset database (⚠️ deletes all data!)
supabase db reset

# View logs
supabase logs  # All services
supabase functions logs analytics  # Specific function

# Check status
supabase status

# Generate TypeScript types
supabase gen types typescript --local > apps/web/types/supabase.ts
```

### Database Operations

```bash
# Connect to database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Create new migration
supabase migration new add_feature_name

# Apply migrations
supabase db reset  # Resets and applies all

# Push to production
supabase db push
```

### Edge Functions

```bash
# Create new function
supabase functions new my-function

# Serve locally (with hot reload)
supabase functions serve

# Deploy to production
supabase functions deploy my-function

# View function logs
supabase functions logs my-function
```

---

## 📋 Development Workflow

### Daily Development

1. **Start Services**
   ```bash
   # Terminal 1: Supabase
   supabase start
   
   # Terminal 2: Web app
   pnpm web:dev
   ```

2. **Make Changes**
   - Edit code in `apps/web/`
   - Hot reload automatic

3. **Database Changes**
   ```bash
   # Create migration
   supabase migration new my_change
   
   # Edit supabase/migrations/XXXXXX_my_change.sql
   # Apply
   supabase db reset
   ```

4. **End of Day**
   ```bash
   # Stop Supabase (frees ports)
   supabase stop
   ```

### Adding a New Feature

**Example: Add "vehicles" table**

1. **Create Migration**
   ```bash
   supabase migration new add_vehicles_table
   ```

2. **Edit Migration** (`supabase/migrations/XXXXXX_add_vehicles_table.sql`)
   ```sql
   CREATE TABLE public.vehicles (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     organization_id UUID NOT NULL REFERENCES public.organizations(id),
     make TEXT NOT NULL,
     model TEXT NOT NULL,
     year INTEGER,
     license_plate TEXT UNIQUE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
   
   -- Add policies
   CREATE POLICY "Users can view org vehicles"
     ON public.vehicles FOR SELECT
     USING (organization_id IN (
       SELECT organization_id FROM public.users WHERE id = auth.uid()
     ));
   
   -- Add trigger for updated_at
   CREATE TRIGGER update_vehicles_updated_at
     BEFORE UPDATE ON public.vehicles
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

3. **Apply Migration**
   ```bash
   supabase db reset
   ```

4. **Use in Code**
   ```typescript
   // Fetch vehicles
   const { data: vehicles } = await supabase
     .from('vehicles')
     .select('*')
     .eq('organization_id', orgId);
   ```

---

## 🚨 Troubleshooting

### Issue: "Port already in use"

```bash
# Kill processes on Supabase ports
lsof -ti:54321,54322,54323 | xargs kill -9

# Or stop Supabase properly
supabase stop
```

### Issue: "Docker not running"

```bash
# macOS: Open Docker Desktop
# Linux: sudo systemctl start docker

# Verify
docker ps
```

### Issue: "Migration failed"

```bash
# Check migration syntax
psql postgresql://postgres:postgres@localhost:54322/postgres \
  < supabase/migrations/your_migration.sql

# Reset and try again
supabase db reset
```

### Issue: "RLS blocking queries"

**Debug in Supabase Studio**:
1. Go to http://localhost:54323
2. Click "SQL Editor"
3. Run:
   ```sql
   -- Test as authenticated user
   SET ROLE authenticated;
   SELECT * FROM your_table;
   
   -- Check policies
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```

### Issue: "Edge Function not found"

```bash
# List functions
ls supabase/functions/

# Ensure function deployed locally
supabase functions serve

# Test endpoint
curl http://localhost:54321/functions/v1/your-function
```

---

## 📚 Next Steps

### Recommended Path

1. **Explore Studio** (5 mins)
   - View tables and data
   - Test SQL queries
   - Check RLS policies

2. **Create Test User** (5 mins)
   ```sql
   -- In Studio SQL Editor
   INSERT INTO auth.users (id, email) VALUES (
     gen_random_uuid(),
     'test@example.com'
   );
   ```

3. **Test CRUD Operations** (10 mins)
   - Create/read/update/delete in Studio
   - Verify RLS policies work

4. **Integrate Frontend** (30 mins)
   - Update .env.local
   - Test auth flow
   - Fetch/display data

5. **Deploy to Production** (1 hour)
   - Create Supabase project
   - Push migrations
   - Deploy Edge Functions
   - Update production env vars

### Learning Resources

- [Supabase Crash Course](https://supabase.com/docs/guides/getting-started)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Tutorial](https://supabase.com/docs/guides/functions/quickstart)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

## ✅ Verification

**All services running?**
```bash
supabase status
```

**Expected output**:
```
supabase local development setup is running.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Database populated?**
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT COUNT(*) FROM public.organizations;"
# Should show: 1 (demo org)
```

---

## 🎉 You're Ready!

Your Supabase instance is running with:
- ✅ Database (9 tables)
- ✅ Security (40+ RLS policies)
- ✅ Storage (5 buckets)
- ✅ Edge Functions (3 APIs)
- ✅ Demo data loaded

**Start building!** 🚀

For complete documentation, see: [SUPABASE_100_COMPLETE.md](SUPABASE_100_COMPLETE.md)
