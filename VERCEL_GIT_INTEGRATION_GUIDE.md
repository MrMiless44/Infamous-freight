# Vercel Deployment Guide - Git Integration (Recommended)

## Why Git Integration?
- ✅ No CLI issues with monorepos
- ✅ Automatic deploys on git push
- ✅ Easy environment variable management
- ✅ Vercel handles pnpm workspaces automatically

---

## Step-by-Step Deployment

### Step 1: Open Vercel Dashboard
Go to: https://vercel.com/new

You should see your GitHub repositories on the right side.

### Step 2: Import Repository

**If you see "MrMiless44/Infamous-freight":**
- Click the **"Import"** button

**If you don't see it:**
- Click **"Import Git Repository"**
- Paste: `https://github.com/MrMiless44/Infamous-freight`
- Click **"Continue"**

### Step 3: Configure Build Settings

**Root Directory:**
1. Click **"Edit"** next to "Root Directory"
2. Change from `/` to `apps/web`
3. Click **"✓"** to confirm

**Build Settings (Framework):**
- **Framework Preset**: Should auto-detect as **Next.js**
- If not, select it manually

**Build Command (Override):**
1. Click **"Override"** in Build section
2. Enter build command:
   ```
   cd ../.. && pnpm --filter web build
   ```
3. Leave **Output Directory** as `.next`
4. Leave **Install Command** blank (Vercel will use pnpm automatically)

### Step 4: Set Environment Variables

**Important:** Add these BEFORE deploying:

1. Click **"Environment Variables"**
2. Add for **Production** environment:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc... (mark as SECRET)
```

Get these values from:
- https://supabase.com/dashboard → Your Project → Settings → API

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)

**Your production URL will be:**
```
https://infamous-freight-XXXXXXXXX-infaemous.vercel.app
```

---

## Verification

After deployment:

1. **Check Build Status:**
   - Project → Deployments → Latest
   - Should show ✅ "Ready" in green

2. **Test Your App:**
   - Click production URL
   - You should see the app loading
   - Check browser console for Supabase connection

3. **View Logs:**
   - Deployments → Latest → Logs
   - Should show:
     ```
     > Build successful
     ```

---

## Continuous Deployment

From now on, every time you push to `main`:
1. GitHub webhook triggers Vercel
2. Vercel automatically builds
3. When build passes, auto-deploys to production

No more manual deployments needed! ✅

---

## Troubleshooting

**Build Failed - "pnpm not found"**
- Root Directory is wrong - should be `apps/web`
- Build command is wrong - should be `cd ../.. && pnpm --filter web build`
- Fixed both? → Click **"Redeploy"** on Deployments page

**Environment Variables Missing**
- Check they're added to **Production** environment (not just Development)
- Values must be exact matches from Supabase dashboard

**App Shows Errors After Deploy**
- Check browser console (F12 → Console tab)
- Go to "Deployments → Latest → Logs" to see backend errors
- Common issue: Supabase URL/key mismatch

---

## Next Steps

1. ✅ Deploy to Vercel (you are here)
2. Optional: Deploy to Fly.io for redundancy
3. Set up custom domain (in Project Settings → Domains)
4. Configure monitoring (Vercel Analytics included)

See `FLY_IO_DEPLOYMENT.md` for Fly.io setup.
