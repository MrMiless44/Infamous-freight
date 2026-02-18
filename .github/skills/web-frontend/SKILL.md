---
name: Web Frontend Development
description: Build and optimize Next.js 14 TypeScript frontend with SSR, components, pages, and analytics integration
applyTo:
  - apps/web/**/*
keywords:
  - next.js
  - react
  - typescript
  - ssr
  - ssg
  - components
  - pages
  - esm
  - vercel
---

# Web Frontend Development Skill

## 📋 Quick Rules

1. **Module System**: ESM (`import`), TypeScript
2. **Framework**: Next.js 14 (App Router preferred)
3. **Port**: 3000 (via `WEB_PORT` env var)
4. **Shared Types**: Import from `@infamous-freight/shared`
5. **API Calls**: Use `process.env.API_BASE_URL` for backend communication
6. **Analytics**: Vercel Analytics + Speed Insights + Datadog RUM

## 📁 File Organization

- **Pages**: `apps/web/pages/` (legacy Pages Router) or `apps/web/app/`
- **Components**: `apps/web/components/`
- **Styles**: Tailwind CSS or CSS Modules
- **Config**: `apps/web/next.config.mjs`

## 🚀 Server-Side Rendering (SSR)

```typescript
// apps/web/pages/shipment/[id].tsx
import { GetServerSideProps } from 'next';
import { ApiResponse, Shipment } from '@infamous-freight/shared';

interface Props {
  shipment: Shipment;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  try {
    const res = await fetch(
      `${process.env.API_BASE_URL}/api/shipments/${params?.id}`
    );
    const result: ApiResponse<Shipment> = await res.json();

    if (!result.success || !result.data) {
      return { notFound: true };
    }

    return {
      props: { shipment: result.data },
      revalidate: 60, // ISR: revalidate every 60s
    };
  } catch (err) {
    return { notFound: true };
  }
};

export default function ShipmentPage({ shipment }: Props) {
  return <div>{/* render shipment */}</div>;
}
```

## 📊 Analytics Integration

**Vercel Analytics** (`apps/web/pages/_app.tsx`):
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

**Datadog RUM** (when `NEXT_PUBLIC_ENV=production`):
```typescript
if (process.env.NEXT_PUBLIC_ENV === 'production') {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DD_APP_ID!,
    clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
    site: process.env.NEXT_PUBLIC_DD_SITE!,
  });
}
```

## ⚡ Performance Optimization

**Code Splitting**:
```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('../components/Chart'), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});
```

**Bundle Analysis**:
```bash
cd apps/web
ANALYZE=true pnpm build
# Opens interactive visualization
```

**Targets**:
- First Load JS < 150KB
- Total bundle < 500KB
- LCP < 2.5s, FID < 100ms, CLS < 0.1

## 🧪 Testing

```bash
pnpm --filter web test
pnpm --filter web test:e2e  # Playwright
```

## 📦 Environment Variables

- `API_BASE_URL`: Backend endpoint (set in `.env.local`)
- `NEXT_PUBLIC_ENV`: `production` or `development`
- `NEXT_PUBLIC_DD_*`: Datadog credentials (production only)

## 🚀 Deployment

- **Production**: Vercel (auto-deploy from `main`)
- **Environment**: `NEXT_PUBLIC_ENV=production`
- **CI Checks**: Type checking, linting, Lighthouse scores
