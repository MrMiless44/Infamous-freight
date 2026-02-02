# 🚀 Deploy Infamous Freight to Vercel - Complete 100% Guide

## 🎯 Current Status: Vercel Project Not Found

Your code is ready on GitHub, but we need to create/connect the Vercel deployment.

---

## ⚡ OPTION 1: Quick Deploy (RECOMMENDED - 5 minutes)

### Step 1: Import from GitHub to Vercel

1. **Go to Vercel**: https://vercel.com/new

2. **Click "Add New..." → Project**

3. **Import Git Repository**:
   - Search for: `MrMiless44/Infamous-freight`
   - Or paste: `https://github.com/MrMiless44/Infamous-freight`
   - Click **"Import"**

4. **Configure Project**:
   ```
   Framework Preset: Next.js
   Root Directory: ./   (leave as default OR select "web" if prompted)
   Build Command: cd ../.. && pnpm -w --filter web build
   Output Directory: .next (or leave default)
   Install Command: cd ../.. && corepack enable && pnpm -w install --frozen-lockfile
   ```

5. **Add Environment Variables** (Click "Environment Variables" dropdown):

   Add these 6 variables NOW before deploying:

   #### Variable 1:
   ```
   Name:  NEXT_PUBLIC_SUPABASE_URL
   Value: https://wnaievjffghrzjtuvutp.supabase.co
   ```

   #### Variable 2:
   ```
   Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWlldmpmZmdocnp0anV2dXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTk5ODYsImV4cCI6MjA4NTM5NTk4Nn0.59SaifUYbMp2UASCyz_Qk4LUhzvARb2_biOqqZfV8f0
   ```

   #### Variable 3:
   ```
   Name:  SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWlldmpmZmdocnp0anV2dXRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgxOTk4NiwiZXhwIjoyMDg1Mzk1OTg2fQ.9caFrLVAmPzcPrqfvYMAJO9r2jGMX8nXElcBOuEUwuw
   ```

   #### Variable 4:
   ```
   Name:  DATABASE_URL
   Value: postgresql://postgres.wnaievjffghrztjuvutp:Ssmm022587$$@aws-1-us-east-2.pooler.supabase.com:6543/postgres
   ```

   #### Variable 5:
   ```
   Name:  NODE_ENV
   Value: production
   ```

   #### Variable 6:
   ```
   Name:  JWT_SECRET
   Value: ZYBpTP8D2oMg78DUZfmkVbNol2z5P9xRhrjSdSEkS5s=
   ```

6. **Click "Deploy"**

7. **Wait 3-5 minutes** for the build to complete

8. **Visit your deployed app** - Vercel will show you the URL (something like `infamous-freight-xxxx.vercel.app`)

---

## 📝 OPTION 2: Use Vercel CLI (Alternative)

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the web directory
cd web
vercel --prod

# Follow prompts:
# - Link to existing project? No (create new)
# - Project name: infamous-freight-enterprises
# - Directory: ./
# - Override settings? Yes, add the build/install commands from above
```

Then add environment variables via:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# (repeat for all 6 variables)
```

---

## ✅ After Deployment - Verification

### 1. Check Web App
Visit your Vercel URL (will be shown after deployment)
- Should see the Infamous Freight Enterprises homepage
- No errors in browser console

### 2. Check API Health
Visit: `https://your-vercel-url.vercel.app/api/health`

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123.45,
  "timestamp": 1738505600000
}
```

### 3. Check Database
If you see `"database": "connected"` → **🎉 100% DEPLOYED!**

---

## 🎯 Quick Checklist

- [ ] Go to https://vercel.com/new
- [ ] Import `MrMiless44/Infamous-freight` repository
- [ ] Add all 6 environment variables
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Visit `/api/health` endpoint
- [ ] Verify `"database": "connected"`
- [ ] 🎉 **100% COMPLETE!**

---

## 🆘 Troubleshooting

### "Build failed" error
- Check that you selected the correct framework (Next.js)
- Verify the build command includes `pnpm -w --filter web build`
- Check Vercel build logs for specific errors

### "Module not found" errors
- Make sure the install command runs from workspace root
- Verify `corepack enable` is in the install command
- Check that pnpm is used (not npm)

### Database shows "disconnected"
- Double-check DATABASE_URL was copied exactly (including password)
- Verify all 6 environment variables were added
- Try redeploying after adding env vars

### Deployment not found
- This means you haven't imported from GitHub yet
- Follow Option 1 above to create the Vercel project

---

## 📊 Expected Timeline

- Import to Vercel: **30 seconds**
- Add environment variables: **2 minutes**  
- Initial deployment build: **3-5 minutes**
- Verification: **30 seconds**

**Total time to 100%: ~8 minutes**

---

## 🎉 Success Criteria

When you see this response at `/api/health`:
```json
{
  "status": "ok",
  "database": "connected"
}
```

**YOU ARE 100% DEPLOYED TO THE WORLD! 🌍**

- ✅ Web application live on Vercel global CDN
- ✅ Database connected to Supabase
- ✅ SSL/TLS automatic
- ✅ Auto-scaling enabled
- ✅ GitHub auto-deploy on future pushes

---

**Start here:** https://vercel.com/new

Good luck! 🚀
