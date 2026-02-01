# Authentication System - Quick Start

This document provides a quick reference for the Supabase authentication system
in this project.

## 🚀 Quick Start

### 1. Setup Supabase

```bash
# Go to https://supabase.com/dashboard
# Create a new project
# Copy credentials to apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Use Authentication in Components

```tsx
import { useAuth } from "@/hooks/useAuth";

export function MyComponent() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <p>Please sign in to continue</p>
      )}
    </div>
  );
}
```

### 3. Protect Routes

```tsx
import { ProtectedRoute } from "@/hooks/ProtectedRoute";

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <YourPageContent />
    </ProtectedRoute>
  );
}
```

## 📂 Project Structure

```
apps/web/
├── pages/
│   ├── _app.tsx                    # AuthProvider wrapped here
│   ├── dashboard.tsx               # Example protected page
│   ├── login.tsx                   # Redirects to /auth/sign-in
│   ├── signup.tsx                  # Redirects to /auth/sign-up
│   └── auth/
│       ├── sign-in.tsx             # Email/password login
│       ├── sign-up.tsx             # User registration
│       ├── reset-password.tsx      # Password recovery
│       └── callback.tsx            # OAuth redirect
├── src/
│   ├── lib/supabase/
│   │   ├── browser.ts              # Browser-side Supabase client
│   │   ├── server.ts               # Server-side Supabase client
│   │   └── middleware.ts           # Edge middleware client
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth state hook
│   │   └── ProtectedRoute.tsx      # Route protection HOC
│   └── context/
│       └── AuthContext.tsx         # Auth context provider
└── middleware.ts                   # Edge middleware (auth + geolocation)
```

## 🔑 API Reference

### `useAuth()` Hook

```tsx
const { user, isLoading, isAuthenticated, signOut } = useAuth();

// user: Supabase User object or null
// isLoading: boolean - true while fetching initial user
// isAuthenticated: boolean - true if user exists
// signOut(): Promise<void> - Sign out current user
```

### `useAuthContext()` Hook

```tsx
// Must be used inside AuthProvider
const { user, isLoading, isAuthenticated, signOut } = useAuthContext();
```

### `ProtectedRoute` Component

```tsx
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// Automatically redirects to /auth/sign-in if not authenticated
// Shows loading spinner while checking auth state
```

## 🔐 Authentication Flows

### Email/Password Sign Up

1. User fills form on `/auth/sign-up`
2. Form validates (email, password match, etc.)
3. Calls `supabase.auth.signUp()`
4. Supabase sends confirmation email
5. User clicks link in email to confirm
6. User can now sign in

### Email/Password Sign In

1. User fills form on `/auth/sign-in`
2. Calls `supabase.auth.signInWithPassword()`
3. JWT session created
4. Redirected to dashboard (or previous page)

### OAuth (GitHub/Google)

1. User clicks "Sign in with GitHub/Google" button
2. Calls `supabase.auth.signInWithOAuth()`
3. Redirected to provider (GitHub/Google)
4. User authorizes
5. Redirected to `/auth/callback`
6. Callback page processes session
7. User sent to dashboard

### Password Reset

1. User enters email on `/auth/reset-password`
2. Calls `supabase.auth.resetPasswordForEmail()`
3. Supabase sends reset email
4. User clicks link in email
5. Redirected to `/auth/reset-password` with reset token
6. User enters new password
7. Calls `supabase.auth.updateUser()`
8. Password updated, user redirected to sign-in

## 🛡️ Protected Routes

Middleware automatically protects these routes:

- `/dashboard`
- `/loads`
- `/threads`

Unauthenticated users are redirected to `/auth/sign-in?next=/original-url`

## 🔗 Available Auth Pages

| Route                  | Purpose                      |
| ---------------------- | ---------------------------- |
| `/auth/sign-in`        | Email/password login + OAuth |
| `/auth/sign-up`        | User registration            |
| `/auth/reset-password` | Password recovery            |
| `/auth/callback`       | OAuth provider redirect      |
| `/login`               | Redirects to `/auth/sign-in` |
| `/signup`              | Redirects to `/auth/sign-up` |

## 📊 User Data

User data is stored in Supabase auth tables:

```sql
-- auth.users - Main user accounts
-- auth.identities - OAuth provider links

-- Optional: Create public.profiles for extended data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## ⚙️ Environment Variables

```dotenv
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (for server-side use with RLS bypass)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Testing

To test the auth system:

```bash
# 1. Start dev server
pnpm dev

# 2. Visit http://localhost:3000
# 3. Click "Sign Up" → Create account
# 4. Confirm email (check Supabase logs in dev mode)
# 5. Sign in with new account
# 6. Should see dashboard
```

## 🐛 Common Issues

### "Missing Supabase environment variables"

**Solution**: Make sure `.env.local` has both variables:

```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### "Invalid redirect URI" (OAuth)

**Solution**: Add redirect URL to Supabase dashboard:

- Settings → Authentication → Redirect URLs
- Add: `http://localhost:3000/auth/callback`
- Production: `https://your-domain.com/auth/callback`

### "useAuthContext must be used within AuthProvider"

**Solution**: Make sure `_app.tsx` wraps app with `<AuthProvider>`. Check
[pages/\_app.tsx](pages/_app.tsx).

### OAuth shows blank page

**Solution**: Clear browser cookies and cache:

1. Open DevTools (F12)
2. Application → Cookies → Delete all for localhost
3. Reload page

## 📚 Learn More

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase + Next.js SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- [OAuth Setup Guide](SUPABASE_INTEGRATION_GUIDE.md#4-configure-oauth-providers-optional)
