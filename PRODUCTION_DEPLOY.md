# Production Deploy (Infamous Freight)

## Recommended: Web on Vercel + API on Render

### 1) Deploy API (Render)

- Create a Render Web Service pointing to this repo
- Root directory: `api`
- Use `api/render.yaml` values (or paste into UI)

**Required env (Render):**

- NODE_ENV=production
- PORT=3001
- JWT_SECRET=<strong random>
- CORS_ORIGINS=https://YOUR_VERCEL_DOMAIN,https://YOUR_CUSTOM_DOMAIN
- AI_PROVIDER=stub|openai|anthropic

**If persistent avatars (Phase-5):**

- AVATAR_STORAGE=s3
- S3_BUCKET=...
- S3_ENDPOINT=...
- S3_ACCESS_KEY_ID=...
- S3_SECRET_ACCESS_KEY=...
- S3_PUBLIC_BASE_URL=https://PUBLIC_BASE/...

Verify:

- GET https://YOUR_API_DOMAIN/health returns ok or 200

### 2) Deploy Web (Vercel)

- Import repo in Vercel
- Set Root Directory = `web`
- Env:
  - NEXT_PUBLIC_API_URL=https://YOUR_API_DOMAIN
  - NEXT_PUBLIC_AVATAR_STORAGE=s3 (or `local` if not using object store)

Verify:

- https://YOUR_WEB_DOMAIN/settings/avatar loads
- Upload/select works
- https://YOUR_WEB_DOMAIN/genesis loads and chats

### 3) CORS must match exactly

If web calls fail:

- Add both the Vercel production and preview domains to CORS_ORIGINS (comma-separated)

## Smoke test order

1. API `/health`
2. API `/v1/avatars/system`
3. Web `/settings/avatar`
4. Web `/genesis`
