# Supabase Cloud Setup Guide

## Quick Setup (5 minutes)

### Option A: Automated Setup (Recommended)
```bash
cd /workspaces/Infamous-freight-enterprises
npx supabase login
# Authenticate in browser when prompted
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase functions deploy
```

### Option B: Manual Setup

#### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name**: Infamous Freight
   - **Database password**: Create a strong password (save it!)
   - **Region**: US East (closest to your users)
4. Click **"Create new project"** (takes 2-3 minutes)

#### Step 2: Get API Credentials
1. Once project is created, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon (public) key**: `eyJhbGc...` (starts with "eyJhbGc")
   - **service_role (secret) key**: Keep this safe!

#### Step 3: Link Local Project
```bash
npx supabase login
# Authenticate in browser

npx supabase link --project-ref YOUR_PROJECT_REF
# Use the project reference from Supabase dashboard (Settings → General → Reference ID)
```

#### Step 4: Push Database Schema
```bash
npx supabase db push
# This creates all tables in your Supabase database
```

#### Step 5: Deploy Edge Functions
```bash
npx supabase functions deploy analytics
npx supabase functions deploy shipment-tracking
```

---

## Environment Variables Setup

Create `.env.local` in `apps/web/` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Only needed for server-side operations (build/API routes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Vercel
VERCEL_OIDC_TOKEN=...
```

---

## Verification

Test your setup:
```bash
cd apps/web
pnpm dev
# Visit http://localhost:3000 and check console for Supabase connection
```

Check Supabase dashboard for:
- ✅ Tables created (shipments, users, etc.)
- ✅ Edge Functions deployed (analytics, shipment-tracking)
- ✅ API keys working

---

## Troubleshooting

**"Project not found"**
- Verify project reference ID from Supabase dashboard
- Format: `xxxxx` (not full URL)

**"Migrations failed"**
- Check database is running status in Supabase dashboard
- Manually review `supabase/migrations/` for issues

**"Edge Functions deploy failed"**
- Ensure all function files exist in `supabase/functions/`
- Check function syntax with `deno check`
