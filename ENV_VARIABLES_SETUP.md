# Environment Variables Setup

## For apps/web/.env.local (Development)

```env
# Supabase - Get from https://supabase.com/dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# This is only needed for server-side operations
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vercel (Optional - auto-set by Vercel CLI)
VERCEL_OIDC_TOKEN=...
```

## For Vercel (Production)

**Add in Vercel Dashboard → Settings → Environment Variables → Production:**

```
NEXT_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## For Fly.io (Production)

**Set via CLI:**

```bash
flyctl secrets set \
  NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Getting These Values

### From Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. You'll see:
   - **Project URL** → Copy this to `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon (public) key** → Copy this to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → Keep this private! Use for backend only

**URL Format Examples:**
- `https://xyzabc123.supabase.co`
- NOT `https://xyzabc123.supabase.com` (wrong domain)

**Key Format:**
- Should start with `eyJhbGc...`
- Should be 200-300 characters long
- If it looks too short, you may have the wrong key

---

## Important Security Notes

1. **Never commit `SUPABASE_SERVICE_ROLE_KEY`** to git
2. **Anon key** is public - safe to commit
3. **Service role key** is like a password - treat like database password
4. Rotate keys periodically in Supabase dashboard

---

## Testing Locally

Once set in `.env.local`:

```bash
cd apps/web
pnpm dev
```

In browser console (F12), you should see:
```
Supabase connected ✓
```

If error, check:
1. URL exactly matches Supabase dashboard
2. Anon key is 200+ characters
3. No extra spaces in `.env.local`

---

## For CI/CD Pipelines

If you use GitHub Actions or other CI/CD:

1. Add secrets to your repo:
   - GitHub: Settings → Secrets and variables → Actions
   - GitLab: Settings → CI/CD → Variables
   - BitBucket: Settings → Pipelines → Repository variables

2. Reference in workflow:
   ```yaml
   env:
     NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
     NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
   ```

---

## Checklist

- [ ] Created Supabase project
- [ ] Copied API keys (URL + Anon key)
- [ ] Added to `apps/web/.env.local` (development)
- [ ] Added to Vercel (production)
- [ ] Added to Fly.io (production) via `flyctl secrets set`
- [ ] Tested locally with `pnpm dev`
- [ ] Verified Supabase connection in browser console
