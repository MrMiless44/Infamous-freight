/**
 * Web Bundle Optimization Guide
 * 
 * Target metrics:
 * - First Load JS: < 150KB
 * - Total bundle: < 500KB
 * - LCP: < 2.5s
 * - FID: < 100ms
 * - CLS: < 0.1
 */

// ✅ Code splitting: Dynamic imports for heavy components
// web/pages/dashboard.tsx
import dynamic from 'next/dynamic';

const ShipmentChart = dynamic(
  () => import('../components/ShipmentChart'),
  {
    loading: () => <div className="skeleton" />,
    ssr: false,
  }
);

const ReportGenerator = dynamic(
  () => import('../components/ReportGenerator'),
  {
    loading: () => <div>Loading report generator...</div>,
  }
);

// ✅ Tree-shaking: Export named exports instead of default
// web/lib/utils.ts
export const formatDate = (date: Date) => date.toLocaleDateString();
export const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
export const sanitizeEmail = (email: string) => email.toLowerCase().trim();

// Consumers can then import only what they need:
// import { formatDate } from '../lib/utils';

// ✅ Compression: Enable gzip in next.config.mjs
// next.config.mjs
/** @type {import('next').NextConfig} */
const config = {
  compress: true,
  swcMinify: true,
  reactStrictMode: true,
  optimizeFonts: true,
  experimental: {
    esmExternals: true,
    isrMemoryCacheSize: 52 * 1024 * 1024, // 52MB
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
};

// ✅ Image optimization: Use next/image everywhere
// web/components/ShipmentCard.tsx
import Image from 'next/image';

export function ShipmentCard({ shipment }) {
  return (
    <div>
      {shipment.image && (
        <Image
          src={shipment.image}
          alt={`Shipment ${shipment.id}`}
          width={400}
          height={300}
          priority={false}
          placeholder="blur"
        />
      )}
      <h3>{shipment.trackingId}</h3>
    </div>
  );
}

// ✅ Route-based code splitting (automatic in Next.js)
// Each route automatically gets its own bundle chunk:
// - pages/dashboard -> dashboard.js
// - pages/shipments -> shipments.js
// - pages/billing -> billing.js

// ✅ Lazy load expensive libraries
// web/lib/chartLibrary.ts
export async function loadChartLibrary() {
  const recharts = await import('recharts');
  return recharts;
}

// ✅ Preload critical resources in _app.tsx
// web/pages/_app.tsx
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Preconnect to API */}
        <link
          rel="preconnect"
          href="https://infamous-freight-api.fly.dev"
        />
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://cdn.stripe.com" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

// ✅ Run bundle analyzer
// ANALYZE=true pnpm --filter web build

// ✅ Monitor with Lighthouse CI (configured in .lighthouserc.json)
// Results tracked in .github/workflows/lighthouse-ci.yml

module.exports = {
  config,
};
