# PayPal SDK Migration Guide

## Overview
Migrated from deprecated `@paypal/checkout-server-sdk` to `@paypal/paypal-server-sdk` v2.2.0.

## **⚠️ IMPORTANT: Code Changes Required**

The new PayPal SDK has a completely different API structure. The billing routes need to be updated.

## Old SDK (Deprecated) vs New SDK

### Old SDK Structure
```typescript
import paypal from "@paypal/checkout-server-sdk";

// Environment and client setup
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// Creating orders
const request = new paypal.orders.OrdersCreateRequest();
request.requestBody({ ... });
const order = await client.execute(request);
```

### New SDK Structure  
```typescript
import { paypalClient, ordersController } from "@paypal/paypal-server-sdk";

// Client setup
const client = paypalClient({
  clientCredentialsAuthCredentials: {
    oAuthClientId: clientId,
    oAuthClientSecret: clientSecret,
  },
  environment: Environment.Sandbox,
});

// Creating orders
const response = await ordersController.ordersCreate({
  body: { ... }
});
```

## Required Code Changes

### File: `src/apps/api/src/routes/billing.ts`

**Lines 3, 14-21**: Replace old SDK import and client creation:

```typescript
// OLD (remove):
import paypal from "@paypal/checkout-server-sdk";

function createPayPalClient() {
  const paypalConfig = config.getPayPalConfig();
  const environment = new paypal.core.SandboxEnvironment(
    paypalConfig.clientId,
    paypalConfig.clientSecret,
  );
  return new paypal.core.PayPalHttpClient(environment);
}

// NEW (use):
import { 
  Client as PayPalClient,
  OrdersController,
  Environment 
} from "@paypal/paypal-server-sdk";

function createPayPalClient() {
  const paypalConfig = config.getPayPalConfig();
  return new PayPalClient({
    clientCredentialsAuthCredentials: {
      oAuthClientId: paypalConfig.clientId,
      oAuthClientSecret: paypalConfig.clientSecret,
    },
    environment: paypalConfig.sandbox ? Environment.Sandbox : Environment.Production,
  });
}
```

**Lines 474-496**: Replace order creation:

```typescript
// OLD (remove):
const client = createPayPalClient();
const request = new paypal.orders.OrdersCreateRequest();
request.prefer("return=representation");
request.requestBody({
  intent: "CAPTURE",
  purchase_units: [
    {
      amount: {
        currency_code: "USD",
        value: (DEFAULT_PLAN.price / 100).toFixed(2),
      },
    },
  ],
  application_context: {
    return_url: returnUrl,
    cancel_url: cancelUrl,
  },
});

const order = await client.execute(request);
const approvalUrl = /* complex extraction logic */;

// NEW (use):
const client = createPayPalClient();
const ordersController = new OrdersController(client);

const response = await ordersController.ordersCreate({
  prefer: "return=representation", 
  body: {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: (DEFAULT_PLAN.price / 100).toFixed(2),
        },
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  },
});

const approvalUrl = response.result?.links?.find(
  link => link.rel === "approve"
)?.href;
```

**Lines 514-523**: Replace order capture:

```typescript
// OLD (remove):
const client = createPayPalClient();
const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
captureRequest.requestBody({});
const capture = await client.execute(captureRequest);

// NEW (use):
const client = createPayPalClient();
const ordersController = new OrdersController(client);

const response = await ordersController.ordersCapture({
  id: orderId,
  prefer: "return=representation",
});
```

### File: `src/apps/api/src/types/paypal.d.ts`

**Delete this file** - No longer needed with new SDK (it has built-in TypeScript types)

## Testing Checklist

After updating the code:

- [ ] Test PayPal order creation: `POST /api/billing/paypal/order`
- [ ] Test PayPal order capture: `POST /api/billing/paypal/capture`  
- [ ] Verify sandbox environment configuration
- [ ] Verify production environment configuration
- [ ] Test error handling for invalid orders
- [ ] Verify approval URL extraction works
- [ ] Test with real PayPal sandbox account

## Configuration

Ensure these environment variables are set:

```bash
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_SANDBOX=true  # or false for production
PAYPAL_RETURN_URL=https://your-domain.com/billing/paypal/success
PAYPAL_CANCEL_URL=https://your-domain.com/billing/cancel
```

## Documentation

- New SDK Docs: https://developer.paypal.com/api/rest/sdks/paypal-server/
- GitHub: https://github.com/paypal/PayPal-Server-SDK
- Migration Guide: https://developer.paypal.com/api/rest/sdks/migration-guide/

## Status

- ✅ Package updated: `@paypal/paypal-server-sdk@2.2.0` installed
- ⏸️ Code migration: **PENDING** (requires manual updates as outlined above)
- ⏸️ Testing: **PENDING** (after code migration)

## Next Steps

1. Update `src/apps/api/src/routes/billing.ts` with new SDK code
2. Delete `src/apps/api/src/types/paypal.d.ts`
3. Test PayPal endpoints in sandbox
4. Deploy and verify in production

**Estimated Time**: 30-45 minutes  
**Risk Level**: Low (PayPal is optional payment method, can be disabled)  
**Breaking Changes**: None (API routes remain the same)
