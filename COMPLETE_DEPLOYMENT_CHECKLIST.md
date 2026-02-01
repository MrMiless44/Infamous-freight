# Complete Production Deployment Checklist - 100%

## 📋 Master Checklist

### Phase 1: Supabase (Required for All)
- [ ] Create Supabase project at https://supabase.com/dashboard
- [ ] Get API credentials (URL + Anon Key + Service Role Key)
- [ ] Read: `SUPABASE_SETUP_GUIDE.md`
- [ ] (Automated option): `npx supabase login && npx supabase link`

**Time: 5-10 minutes**

---

### Phase 2: Vercel Deployment (Recommended - Easiest)
- [ ] Go to https://vercel.com/new
- [ ] Import: `MrMiless44/Infamous-freight`
- [ ] Root Directory: `apps/web`
- [ ] Build Command: `cd ../.. && pnpm --filter web build`
- [ ] Add Environment Variables (from Supabase)
- [ ] Click Deploy
- [ ] Verify URL works: `https://infamous-freight-XXXXX.vercel.app`
- [ ] Read: `VERCEL_GIT_INTEGRATION_GUIDE.md`

**Time: 5-10 minutes**
**Cost: Free tier available, $20/month for pro features**

---

### Phase 3: Fly.io Deployment (Optional - More Reliable)
- [ ] Read: `FLY_IO_DEPLOYMENT_GUIDE.md`
- [ ] Run: `curl -L https://fly.io/install.sh | sh`
- [ ] Run: `flyctl auth login`
- [ ] Run: `flyctl launch --no-deploy` (from repo root)
- [ ] Run: `flyctl secrets set NEXT_PUBLIC_SUPABASE_URL="..."` (and other env vars)
- [ ] Run: `flyctl deploy --remote-only`
- [ ] Verify URL works: `https://infamous-freight.fly.dev`

**Time: 5-10 minutes**
**Cost: $5.70/month per instance (free tier available)**

---

### Phase 4: Environment Variables (Critical)
- [ ] Read: `ENV_VARIABLES_SETUP.md`
- [ ] Supabase account created with credentials
- [ ] `apps/web/.env.local` set (development)
- [ ] Vercel env vars added (if deploying there)
- [ ] Fly.io secrets set (if deploying there)

**Time: 5 minutes**

---

## 🚀 Quick Start (Choose One)

### Option A: Vercel Only (Fastest)
1. Create Supabase project (5 min)
2. Go to https://vercel.com/new
3. Import GitHub repo, configure, deploy (5 min)
4. **Total: ~10 minutes**
5. **Cost: Free with Vercel/Supabase free tiers**

### Option B: Fly.io Only (Most Reliable)
1. Create Supabase project (5 min)
2. Install Fly CLI (2 min)
3. `flyctl launch` + `flyctl deploy` (5 min)
4. **Total: ~12 minutes**
5. **Cost: Free tier or $5.70/month**

### Option C: Both Vercel + Fly.io (100% Recommended)
1. Create Supabase project (5 min)
2. Deploy to Vercel (5 min)
3. Deploy to Fly.io (5 min)
4. **Total: ~15 minutes**
5. **Cost: Free for both (or total ~$26/month**
6. **Benefit: Global redundancy, automatic failover**

---

## 📖 Detailed Guides

| Service | Guide | Time | Difficulty |
|---------|-------|------|-----------|
| Supabase | `SUPABASE_SETUP_GUIDE.md` | 5-10 min | ⭐ Easy |
| Vercel | `VERCEL_GIT_INTEGRATION_GUIDE.md` | 5-10 min | ⭐ Easy |
| Fly.io | `FLY_IO_DEPLOYMENT_GUIDE.md` | 5-10 min | ⭐ Easy |
| Env Vars | `ENV_VARIABLES_SETUP.md` | 5 min | ⭐ Easy |

---

## ✅ Verification Steps

After each deployment:

### Vercel Verification
```
1. Visit: https://infamous-freight-XXXXX.vercel.app
2. App should load (no errors)
3. Check browser console (F12) - no red errors
4. Vercel dashboard shows "Ready" ✓
```

### Fly.io Verification
```bash
flyctl open
# App should open in browser

flyctl logs
# Should show "nodejs app ready on port 3000" ✓
```

### Supabase Verification
```
1. Go to Supabase dashboard
2. Settings → API
3. Copy Project URL and Anon Key
4. Verify they work in app
```

---

## 🔍 Common Issues & Solutions

### "Vercel build failed"
- Check Root Directory is `apps/web`
- Check Build Command: `cd ../.. && pnpm --filter web build`
- Check env vars are in Production environment
- Redeploy from Vercel dashboard

### "Fly.io deploy failed"
- Check logs: `flyctl logs`
- Ensure Dockerfile supports pnpm
- Verify Node.js version in Dockerfile
- Check environment variables set: `flyctl secrets list`

### "Supabase connection error"
- Verify URL format: `https://xxxxx.supabase.co` (NOT .com)
- Verify Anon Key is 200+ characters
- Verify `.env.local` has no extra spaces
- Check Supabase project is "Running" in dashboard

### "App loads but shows errors"
- Check browser console (F12 → Console tab)
- Check service logs:
  - Vercel: Deployments → Latest → Logs
  - Fly.io: `flyctl logs`
- Check env vars match exactly

---

## 📊 Deployment Status

### Current Progress
- ✅ Code ready (all files in git)
- ✅ Configuration files created (vercel.json, fly.toml, etc.)
- ✅ Guides created (this checklist + detailed steps)
- ⏳ Supabase setup (awaiting user action)
- ⏳ Vercel deployment (awaiting user action)
- ⏳ Fly.io deployment (awaiting user action)

### What's Left
1. **You**: Complete Supabase setup (browser action - 5 min)
2. **Vercel**: Git integration deployment (browser clicks - 5 min)
3. **Fly.io**: CLI commands (terminal - 10 min)

### Estimated Total Time
- **Supabase**: 5-10 minutes
- **Vercel**: 5-10 minutes (if doing)
- **Fly.io**: 5-10 minutes (if doing)
- **Total**: 15-30 minutes for full setup

---

## 🎯 Next Steps

### Immediate (Right Now)
1. Read relevant guide(s) above
2. Click the appropriate links
3. Follow the step-by-step instructions

### For Vercel
👉 **Go to:** https://vercel.com/new

### For Fly.io
👉 **Run:** 
```bash
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
flyctl auth login
```

### For Supabase
👉 **Go to:** https://supabase.com/dashboard

---

## 💡 Pro Tips

1. **Deploy Vercel first** - it's fastest
2. **Keep .env files safe** - never commit keys to git
3. **Use free tiers initially** - upgrade if traffic grows
4. **Both platforms** = automatic failover if one goes down
5. **Set custom domains** - after deployment works

---

## 📞 Support

If stuck:
1. **Check the detailed guides** (links above)
2. **Check Logs** (Vercel → Deployments, Fly.io → `flyctl logs`)
3. **Check Env Vars** (must be exact match from Supabase)
4. **Check Console** (Browser F12 → Console tab for JS errors)

---

## 🎉 Once Complete

✅ Production app deployed globally
✅ Automatic SSL/TLS
✅ Global CDN
✅ Auto-scaling
✅ Can handle production traffic

**Congrats on going live!** 🚀
