# Vercel Web Analytics Integration for Infamous Freight API

This document explains how Vercel Web Analytics has been integrated into the Infamous Freight API (Express.js backend).

## Overview

Vercel Web Analytics is now enabled on the API to track:
- API request metrics and performance
- Server-side analytics data
- Usage patterns and performance bottlenecks

## Installation

The `@vercel/analytics` package (v1.4.0) has been added to the API dependencies.

Install it with:
```bash
pnpm install
# or
npm install
# or
yarn install
# or
bun install
```

## Configuration

### 1. Enable Web Analytics in Vercel Dashboard

To start collecting data, you need to enable Web Analytics on your Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Infamous Freight** project
3. Navigate to the **Analytics** tab
4. Click **Enable** to activate Web Analytics

**Note:** Enabling Web Analytics will add new routes scoped at `/_vercel/insights/*` after your next deployment.

### 2. Initialize Analytics in Server

The analytics initialization is handled automatically in `api/src/server.js`. The `initializeAnalytics()` function is called at startup:

```javascript
// Initialize Vercel Web Analytics early
const { initializeAnalytics } = require("./config/analytics");
initializeAnalytics();
```

This is configured in `api/src/config/analytics.js` which:
- Calls the `inject()` function from `@vercel/analytics`
- Sets the appropriate mode based on `NODE_ENV`
- Handles errors gracefully with fallback logging

### 3. Environment Variables

No additional environment variables are required. The analytics work automatically when:
- The `@vercel/analytics` package is installed
- Your app is deployed to Vercel
- Web Analytics is enabled in the Vercel dashboard

The mode is automatically determined by `NODE_ENV`:
- **production**: Uses production tracking
- **development** or other: Uses development tracking

## How It Works

When deployed to Vercel:
1. The API initializes Vercel Analytics at startup
2. Analytics data is automatically collected from API requests
3. Data is sent to Vercel's analytics infrastructure
4. You can view metrics in the Vercel Dashboard → Analytics tab

The integration includes:
- **Automatic request tracking**: All API requests are tracked
- **Performance metrics**: Response times and latency data
- **Error tracking**: Server-side errors are captured
- **Route detection**: API routes are automatically identified

## Deployment

To deploy the updated API with Web Analytics:

```bash
# Using Vercel CLI
vercel deploy

# Or push to your Git repository if using Git deployments
git push origin flyio-new-files
```

Once deployed:
1. Web Analytics will automatically start collecting data
2. Data will appear in the Vercel Dashboard after a few minutes
3. You can view analytics in Dashboard → Your Project → Analytics tab

## Verification

To verify that analytics are working:

1. Deploy your app to Vercel
2. Visit your API endpoints to generate traffic
3. In your browser's Network tab, you should see requests to `/_vercel/insights/view`
4. After a few minutes, check your Vercel Dashboard Analytics tab

## Troubleshooting

### Analytics not showing data
- Ensure Web Analytics is enabled in Vercel Dashboard
- Wait a few minutes for initial data collection
- Check that your app is deployed to Vercel (not self-hosted)
- Verify `@vercel/analytics` is installed in dependencies

### Module not found errors
- Run `pnpm install` (or your package manager) to install dependencies
- Ensure `@vercel/analytics` appears in `api/package.json`

### Production mode not working
- Set `NODE_ENV=production` in your deployment environment
- Check Vercel project environment variables

## Next Steps

1. **View Data**: After deployment, check Analytics tab in Vercel Dashboard
2. **Custom Events** (Pro/Enterprise only): Track custom user interactions
3. **Filtering**: Use the dashboard to filter and analyze data
4. **Performance Optimization**: Use insights to optimize API performance

## References

- [Vercel Web Analytics Documentation](https://vercel.com/docs/analytics)
- [Analytics Package Documentation](https://vercel.com/docs/analytics/package)
- [Analytics Troubleshooting](https://vercel.com/docs/analytics/troubleshooting)
- [@vercel/analytics on npm](https://www.npmjs.com/package/@vercel/analytics)

## File Changes

### Created Files
- `api/src/config/analytics.js` - Analytics initialization module

### Modified Files
- `api/package.json` - Added `@vercel/analytics` dependency
- `api/src/server.js` - Initialize analytics at startup

## Notes

- The analytics integration follows the "other" framework pattern from Vercel documentation
- The `inject()` function is called once at server startup
- Analytics run in the background without affecting API performance
- Error handling is graceful with fallback logging
