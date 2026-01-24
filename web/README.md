# Infamous Freight Web

Next.js 14 frontend application for the Infamous Freight enterprise freight management platform.

## 📋 Overview

Modern, performant web application built with Next.js 14, React 18, and TypeScript, providing a comprehensive interface for freight management operations.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router + Pages Router hybrid)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: CSS Modules / Tailwind CSS (if configured)
- **State Management**: React Context + Hooks
- **Data Fetching**: Next.js native fetch with caching
- **Payment Integration**: Stripe React components
- **Analytics**: Vercel Analytics + Speed Insights
- **Monitoring**: Datadog RUM (Real User Monitoring)

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.15.0
- API server running (port 4000)

### Installation

```bash
# From repository root
pnpm install

# Build shared package (required dependency)
pnpm --filter @infamous-freight/shared build
```

### Environment Configuration

Create `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
NEXT_PUBLIC_API_URL=http://localhost:4000

# Application
NEXT_PUBLIC_APP_NAME=Infæmous Freight
NEXT_PUBLIC_ENV=development

# Stripe (Payment Processing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Analytics (Optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
```

### Development Server

```bash
# From repository root
pnpm web:dev

# Or from web directory
cd web && pnpm dev
```

The app will be available at `http://localhost:3000`.

## 💻 Development

### Key Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Build with bundle analysis
pnpm build:analyze

# Start production server (requires build first)
pnpm start

# Type check
pnpm typecheck

# Lint
pnpm lint

# Fix lint issues
pnpm lint:fix
```

### Project Structure

```
web/
├── pages/               # Next.js pages (Pages Router)
│   ├── _app.tsx        # App wrapper
│   ├── _document.tsx   # HTML document
│   ├── index.tsx       # Home page
│   └── api/            # API routes (backend-for-frontend)
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── lib/                # Utilities and helpers
├── public/             # Static assets
├── styles/             # Global styles
├── utils/              # Utility functions
├── middleware.ts       # Next.js middleware
├── next.config.js      # Next.js configuration
├── tsconfig.json       # TypeScript configuration
└── package.json
```

## 🏗 Building

### Production Build

```bash
# Create optimized production build
pnpm build

# Build output will be in .next/ directory
```

### Build Analysis

Analyze bundle size:

```bash
pnpm build:analyze

# Opens bundle analyzer in browser
```

### Environment-Specific Builds

```bash
# Development build
NODE_ENV=development pnpm build

# Production build
NODE_ENV=production pnpm build
```

## 🧪 Testing

### Unit Tests

```bash
# Run component tests (when configured)
pnpm test

# Run with coverage
pnpm test:coverage
```

### E2E Tests

End-to-end tests are located in the repository root's `e2e/` directory:

```bash
# From repository root
pnpm test:e2e
```

## 🎨 Features

### Core Features

- **Dashboard**: Real-time freight management overview
- **Shipment Tracking**: Track shipments with real-time updates
- **User Management**: Admin and user role management
- **Payment Processing**: Integrated Stripe checkout
- **Analytics Dashboard**: Business insights and metrics
- **Responsive Design**: Mobile-first, works on all devices

### Performance Optimizations

- **Static Site Generation (SSG)**: Pre-rendered pages
- **Incremental Static Regeneration (ISR)**: Update static content
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Bundle Analysis**: Track and optimize bundle size

### Security Features

- **CSP Headers**: Content Security Policy
- **CORS**: Configured for API communication
- **Authentication**: JWT-based auth with API
- **Input Sanitization**: XSS protection

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set these in your deployment platform:

**Required:**
- `NEXT_PUBLIC_API_BASE` - API endpoint URL
- `NEXT_PUBLIC_API_URL` - Full API URL

**Optional:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` - Analytics ID
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

### Build Configuration

Next.js config (`next.config.js`) includes:
- Environment variable validation
- Image domain configuration
- Bundle analyzer (optional)
- Compression settings
- Security headers

### Static Export (Optional)

For static hosting:

```bash
# Add to package.json
"export": "next export"

# Build and export
pnpm build && pnpm export
```

## 🔌 API Integration

### Fetching Data

```typescript
// Using native fetch with TypeScript
import type { ApiResponse, Shipment } from '@infamous-freight/shared';

async function getShipments(): Promise<Shipment[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/shipments`);
  const data: ApiResponse<Shipment[]> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message);
  }
  
  return data.data;
}
```

### Server-Side Rendering (SSR)

```typescript
// pages/shipments/[id].tsx
import type { GetServerSideProps } from 'next';
import type { Shipment } from '@infamous-freight/shared';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params;
  const response = await fetch(`${process.env.API_BASE_URL}/api/shipments/${id}`);
  const data = await response.json();
  
  return {
    props: {
      shipment: data.data
    }
  };
};
```

### Client-Side Fetching

```typescript
// components/ShipmentList.tsx
import { useEffect, useState } from 'react';
import type { Shipment } from '@infamous-freight/shared';

export function ShipmentList() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/shipments`)
      .then(res => res.json())
      .then(data => setShipments(data.data));
  }, []);
  
  return (
    <div>
      {shipments.map(shipment => (
        <div key={shipment.id}>{shipment.trackingNumber}</div>
      ))}
    </div>
  );
}
```

## 🎨 Component Development

### Component Structure

```tsx
// components/ShipmentCard/ShipmentCard.tsx
import type { Shipment } from '@infamous-freight/shared';
import styles from './ShipmentCard.module.css';

interface ShipmentCardProps {
  shipment: Shipment;
  onUpdate?: (id: string) => void;
}

export function ShipmentCard({ shipment, onUpdate }: ShipmentCardProps) {
  return (
    <div className={styles.card}>
      <h3>{shipment.trackingNumber}</h3>
      <p>Status: {shipment.status}</p>
      {onUpdate && (
        <button onClick={() => onUpdate(shipment.id)}>Update</button>
      )}
    </div>
  );
}
```

### Best Practices

1. **Use TypeScript**: Always type your props and state
2. **Import shared types**: Use types from `@infamous-freight/shared`
3. **Optimize images**: Use Next.js `<Image>` component
4. **Lazy load**: Use dynamic imports for heavy components
5. **Error boundaries**: Wrap components in error boundaries
6. **Accessibility**: Follow WCAG guidelines

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first approach */
.container {
  width: 100%;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    width: 750px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    width: 1000px;
  }
}
```

## 🤝 Contributing

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write semantic HTML
- Add PropTypes or TypeScript types
- Document complex logic

### Pull Request Checklist

- [ ] Code builds without errors
- [ ] TypeScript types are correct
- [ ] Components are responsive
- [ ] No console errors in browser
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Lighthouse score > 90
- [ ] Accessibility checked

## 📊 Performance Monitoring

### Vercel Analytics

Automatic performance monitoring is enabled via `@vercel/analytics`.

### Lighthouse CI

Run Lighthouse audits:

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun
```

### Bundle Analysis

```bash
pnpm build:analyze

# Opens visualization of bundle size
```

## 📄 License

Proprietary - Copyright © 2025 Infæmous Freight. All Rights Reserved.

## 📞 Support

For issues and questions:
- GitHub Issues: [MrMiless44/Infamous-freight](https://github.com/MrMiless44/Infamous-freight/issues)
- Email: 237955567+MrMiless44@users.noreply.github.com

---

Built with ❤️ using Next.js 14
