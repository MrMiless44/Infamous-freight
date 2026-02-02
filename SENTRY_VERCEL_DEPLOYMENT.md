# 🚀 Sentry + Vercel Deployment Guide (Infæmous Freight)

**Critical**: Follow these steps EXACTLY to avoid broken Sentry events and minified stack traces.

---

## ⚠️ Critical Issue: Middleware Blocking Sentry

**FIXED** ✅ - The middleware matcher now excludes `/monitoring` (Sentry's tunnel route).

Without this fix, you'd see:
- Sentry events return 401/403/500
- Browser console shows "Failed to send event to Sentry"
- No errors appear in Sentry dashboard

**What was changed:**
```typescript
// middleware.ts - BEFORE (broken)
matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"]

// middleware.ts - AFTER (fixed) ✅
matcher: ["/((?!_next/static|_next/image|favicon.ico|public|monitoring).*)"]
```

---

## 📋 Pre-Deployment Checklist

### 1. ✅ Install @sentry/nextjs Package

```bash
cd /workspaces/Infamous-freight-enterprises
pnpm --filter web add @sentry/nextjs
```

**Verify installation:**
```bash
pnpm --filter web list | grep sentry
# Should show: @sentry/nextjs
```

---

### 2. ✅ Create Sentry Project (if not done)

1. Go to https://sentry.io
2. Click **Projects** → **Create Project**
3. Platform: **Next.js**
4. Project name: `javascript-nextjs`
5. Team: `infamous-freight-enterprise`
6. Copy the **DSN** shown (you'll need it)

---

### 3. ✅ Create Sentry Auth Token (CRITICAL)

**This is required for source maps to upload to Vercel!**

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click **Create New Token**
3. Name: `Vercel Deployment - Infæmous Freight`
4. **Scopes** (select these):
   - ✅ `project:releases`
   - ✅ `org:read`
   - ✅ `project:write` (optional but recommended)
5. Click **Create Token**
6. **Copy the token immediately** (you won't see it again)

Example token format:
```
sntrys_eyJpYXQiOjE3MDk1ODM2MDAuMT...
```

---

### 4. ✅ Add Environment Variables to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables for **ALL environments** (Production, Preview, Development):

| Variable                         | Value                                        | Environment     |
| -------------------------------- | -------------------------------------------- | --------------- |
| `NEXT_PUBLIC_SENTRY_DSN`         | `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` | All             |
| `SENTRY_DSN`                     | Same as above                                | All             |
| `SENTRY_AUTH_TOKEN`              | Your auth token from step 3                  | All             |
| `SENTRY_ORG`                     | `infamous-freight-enterprise`                | All             |
| `SENTRY_PROJECT`                 | `javascript-nextjs`                          | All             |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `production`                                 | Production only |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `preview`                                    | Preview only    |

**Why ALL environments?**
- Vercel builds in each environment separately
- Without the token, production builds will fail to upload source maps
- Preview deployments help test Sentry before production

---

### 5. ✅ Verify Middleware Configuration

**Already fixed** ✅ - The middleware now skips `/monitoring`

If you modify middleware in the future, **always** ensure:

```typescript
// In apps/web/middleware.ts

const SKIP_PATHS = [
  "/_next",
  "/api/health",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/monitoring", // ← MUST BE HERE for Sentry to work
];

// AND in the matcher:
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|monitoring).*)",
    //                                                   ↑ MUST BE HERE
  ],
};
```

**Test locally:**
```bash
pnpm --filter web dev
# Visit: http://localhost:3000/monitoring
# Should return 404, not 401/403
```

---

### 6. ✅ Update Local .env.local

Create/update `apps/web/.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_your_token_here
SENTRY_ORG=infamous-freight-enterprise
SENTRY_PROJECT=javascript-nextjs
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
```

**Never commit `.env.local`** - it's already in `.gitignore`

---

### 7. ✅ Test Build Locally (Monorepo-Safe)

```bash
# From repo root
cd /workspaces/Infamous-freight-enterprises

# Build ONLY the web app (monorepo-safe)
pnpm --filter web build

# Check for Sentry upload messages:
# - "Uploading source maps..."
# - "Source maps uploaded successfully"
# - No errors about "SENTRY_AUTH_TOKEN missing"
```

**Expected output:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Sentry: Uploading source maps... 
✓ Sentry: Source maps uploaded successfully
```

**If you see errors:**
- `SENTRY_AUTH_TOKEN is not set` → Check .env.local
- `Invalid token` → Regenerate token with correct scopes
- `Organization not found` → Check SENTRY_ORG spelling

---

### 8. ✅ Commit and Push

```bash
git add -A
git commit -m "fix(sentry): add tunnel route, fix middleware, configure for Vercel"
git push origin main
```

---

### 9. ✅ Deploy to Vercel (Clear Cache)

**First deployment after Sentry setup:**

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Three dots (⋮) → **Redeploy**
4. ✅ **Check "Clear build cache"** ← CRITICAL for pnpm monorepos
5. Click **Redeploy**

**Why clear cache?**
- pnpm in monorepos can cache incorrectly
- Stale `next.config.mjs` might not have Sentry wrapper
- Fresh build ensures all Sentry SDK files are generated

---

### 10. ✅ Verify Deployment (30 seconds)

**Check build logs in Vercel:**

1. Click on the deployment
2. Expand **Build** logs
3. Search for: `Sentry`

**You should see:**
```
✓ Sentry configuration detected
✓ Uploading source maps to Sentry...
✓ Source maps uploaded successfully
```

**If you don't see this:**
- Source maps won't work (minified errors)
- Check SENTRY_AUTH_TOKEN is set in Vercel env vars

---

### 11. ✅ Test Live Sentry (Critical)

**Visit your deployed app:**

```
https://your-app.vercel.app/debug-sentry
```

**Test sequence:**
1. Click "Throw JavaScript Error"
2. Wait 10 seconds
3. Go to https://sentry.io/organizations/infamous-freight-enterprise/issues/
4. You should see the error with:
   - ✅ Stack trace pointing to **TypeScript** code (not minified)
   - ✅ User session replay available
   - ✅ Environment: `production`
   - ✅ Release: commit SHA

**Also check browser Network tab:**
- Filter for: `monitoring`
- Should see: POST `/monitoring` → 200 OK (not 401/403/500)

**If /monitoring returns 401/403:**
- Middleware is still blocking it
- Re-check middleware.ts matcher
- Redeploy with cache cleared

---

## 🔥 Common Vercel + Sentry Issues

### Issue 1: "Source maps not uploaded" in build logs

**Cause:** Missing or invalid `SENTRY_AUTH_TOKEN`

**Fix:**
1. Regenerate token: https://sentry.io/settings/account/api/auth-tokens/
2. Add to Vercel: Settings → Environment Variables → `SENTRY_AUTH_TOKEN`
3. Redeploy with **Clear Cache**

---

### Issue 2: `/monitoring` returns 401/403 in production

**Cause:** Middleware blocking Sentry tunnel route

**Fix:**
```typescript
// apps/web/middleware.ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|monitoring).*)",
    //                                                   ↑ ADD THIS
  ],
};
```

Then redeploy.

---

### Issue 3: "Sentry not initializing" in browser console

**Cause:** Missing `NEXT_PUBLIC_SENTRY_DSN` in Vercel env vars

**Fix:**
1. Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel env vars (all environments)
2. Redeploy

---

### Issue 4: Errors appear in Sentry but with minified stack traces

**Cause:** Source maps not uploaded OR wrong release version

**Fix:**
1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel
2. Check build logs for "Source maps uploaded"
3. Ensure `SENTRY_RELEASE` matches between client/server
4. Redeploy with **Clear Cache**

---

### Issue 5: pnpm monorepo build fails on Vercel

**Cause:** Vercel not detecting correct pnpm version or workspace structure

**Fix:**
1. Ensure `package.json` has: `"packageManager": "pnpm@9.15.0"`
2. Root directory: `/` (not `/apps/web`)
3. Framework Preset: **Next.js**
4. Build Command: `pnpm --filter web build`
5. Output Directory: `apps/web/.next`
6. Install Command: `pnpm install`

---

## 📊 Vercel Environment Variables (Complete List)

Copy-paste these into Vercel Dashboard:

```bash
# Sentry - Required for all environments
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_your_long_token_here
SENTRY_ORG=infamous-freight-enterprise
SENTRY_PROJECT=javascript-nextjs

# Environment-specific (set per environment in Vercel)
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production  # or preview, or development
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% in production, 1.0 in dev
```

---

## ✅ Success Indicators

Your Sentry + Vercel integration is working when:

1. ✅ Build logs show "Source maps uploaded successfully"
2. ✅ `/monitoring` endpoint returns 200/204 (not 401/403)
3. ✅ Test errors appear in Sentry within 10 seconds
4. ✅ Stack traces show TypeScript code (not minified)
5. ✅ Session Replay available on error events
6. ✅ Release matches commit SHA in Sentry
7. ✅ No "SENTRY_AUTH_TOKEN missing" warnings

---

## 🎯 Quick Verification Checklist

Before marking "done":

- [ ] `@sentry/nextjs` installed in `apps/web/package.json`
- [ ] Sentry project created: `javascript-nextjs`
- [ ] Auth token created with `project:releases` scope
- [ ] All 5 Vercel env vars added (all environments)
- [ ] Middleware excludes `/monitoring` in both places
- [ ] Local build succeeds with source map upload
- [ ] Vercel build succeeds with cache cleared
- [ ] `/monitoring` returns 200 (not 401/403)
- [ ] Test error appears in Sentry with readable stack trace
- [ ] Session replay available

---

## 🚨 Emergency Rollback

If Sentry breaks production:

**Option 1: Disable Sentry (quick)**
```bash
# In Vercel env vars, set:
NEXT_PUBLIC_SENTRY_DSN=

# Redeploy
```

**Option 2: Remove tunnel route (if blocking requests)**
```javascript
// apps/web/next.config.mjs
tunnelRoute: undefined,  // Disable tunnel

// Then redeploy
```

**Option 3: Revert commit**
```bash
git revert HEAD
git push
# Vercel auto-redeploys
```

---

## 📞 Support

- **Vercel Logs**: https://vercel.com/infamous-freight-enterprise/your-project/deployments
- **Sentry Dashboard**: https://sentry.io/organizations/infamous-freight-enterprise/
- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel Support**: https://vercel.com/support

---

## 🎉 You're Ready!

Once all checkboxes are ✅, your Sentry integration is **production-ready** on Vercel.

**Next steps:**
1. Monitor Sentry dashboard for first week
2. Adjust sample rates based on volume
3. Set up team alerts
4. Review session replays for UX insights

**Status: Ready for Production Deployment** ✅

---

*Last Updated: February 2, 2026*  
*Project: Infæmous Freight Enterprises*  
*Platform: Vercel + Next.js + pnpm monorepo*
