// PHASE_9_INTEGRATION_GUIDE.md

# Phase 9 Integration Guide

## Quick Setup

### 1. Install Phase 9 Services

All services are already created in `/apps/api/src/services/`:

```
✅ advancedPayments.js         (250 lines)
✅ mobileWallet.js             (200 lines)
✅ pushNotifications.js         (280 lines)
✅ emailTemplating.js           (280 lines)
✅ smsNotifications.js          (240 lines)
✅ multiFactorAuth.js           (350 lines)
✅ advancedSearch.js            (280 lines)
✅ webhookSystem.js             (250 lines)
✅ loyaltyProgram.js            (220 lines)
✅ adminDashboard.js            (350 lines)
✅ contentManagement.js         (350 lines)
✅ apiVersioning.js             (250 lines)
✅ biometricAuthentication.js   (300 lines)
```

### 2. Enable Phase 9 Routes

Add to `apps/api/src/app.js`:

```javascript
const phase9Routes = require("./routes/phase9.advanced");

// Mount Phase 9 routes
app.use("/api", phase9Routes);
```

### 3. Configure Environment Variables

Create/update `.env`:

```env
# Payments
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
KLARNA_API_KEY=...
AFFIRM_API_KEY=...
AFTERPAY_API_KEY=...
PAYPAL_CLIENT_ID=...

# Notifications
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=...

# Search
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=...

# Biometric
WEBAUTHN_RP_NAME=Infamous Freight
WEBAUTHN_RP_ID=infamous-freight.com
WEBAUTHN_ORIGIN=https://infamous-freight.com

# Crypto
BITCOIN_RPC_URL=http://localhost:8332
ETHEREUM_RPC_URL=http://localhost:8545
POLYGON_RPC_URL=...
```

### 4. Initialize Payment Services

```javascript
const { AdvancedPaymentsService } = require("./services/advancedPayments");
const paymentService = new AdvancedPaymentsService(prisma);

// Test crypto payment
const cryptoPayment = await paymentService.processCryptoPayment({
  amount: 100,
  currency: "BTC",
  customerEmail: "user@example.com",
  invoiceId: "INV-001",
});
```

### 5. Setup Notification Services

```javascript
const { PushNotificationService } = require("./services/pushNotifications");
const { EmailTemplatingService } = require("./services/emailTemplating");
const { SMSNotificationService } = require("./services/smsNotifications");

const pushService = new PushNotificationService(prisma);
const emailService = new EmailTemplatingService();
const smsService = new SMSNotificationService(prisma);

// Send push notification
await pushService.sendPushNotification(userId, {
  title: "Shipment Updated",
  message: "Your shipment has been shipped",
  category: "shipment",
});
```

### 6. Enable Multi-Factor Authentication

```javascript
const { MultiFactorAuthService } = require("./services/multiFactorAuth");

const mfaService = new MultiFactorAuthService(prisma);

// Enable TOTP for user
const totpSetup = await mfaService.enableTOTP(userId);

// Verify MFA
const verified = await mfaService.verifyTOTP(userId, userToken);
```

### 7. Setup Webhooks

```javascript
const { WebhookSystemService } = require("./services/webhookSystem");

const webhookService = new WebhookSystemService(prisma);

// Register webhook
await webhookService.registerWebhook(userId, {
  url: "https://example.com/webhooks",
  events: ["shipment.created", "payment.completed"],
  secret: "your_webhook_secret",
});

// Trigger event
await webhookService.triggerEvent("shipment.created", {
  shipmentId: "ship_123",
  status: "created",
});
```

### 8. Search Integration

```javascript
const { AdvancedSearchService } = require("./services/advancedSearch");

const searchService = new AdvancedSearchService();

// Search shipments
const results = await searchService.searchShipments("New York", {
  status: "delivered",
  dateFrom: "2026-01-01",
  dateTo: "2026-12-31",
});

// Autocomplete
const suggestions = await searchService.autocomplete("John", "users");
```

### 9. Loyalty Program Setup

```javascript
const { LoyaltyProgramService } = require("./services/loyaltyProgram");

const loyaltyService = new LoyaltyProgramService(prisma);

// Create loyalty account
const account = await loyaltyService.createLoyaltyAccount(userId);

// Add points
await loyaltyService.addPoints(userId, 100, "purchase");

// Get summary
const summary = await loyaltyService.getLoyaltySummary(userId);
```

### 10. Admin Dashboard Access

```javascript
const { AdminDashboardService } = require("./services/adminDashboard");

const adminService = new AdminDashboardService(prisma);

// Get dashboard data
const overview = await adminService.getDashboardOverview();

// User management
const users = await adminService.getUserManagementData({
  role: "customer",
  limit: 50,
});
```

---

## API Endpoint Examples

### Payments

```bash
# Process crypto payment
curl -X POST http://localhost:4000/api/payments/crypto \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "BTC",
    "walletAddress": "1A1z7agoat...",
    "invoiceId": "INV-001"
  }'

# Process BNPL
curl -X POST http://localhost:4000/api/payments/bnpl \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "amount": 500,
    "provider": "klarna",
    "customerId": "cust_123",
    "shipmentId": "ship_456"
  }'
```

### Authentication

```bash
# Enable TOTP
curl -X POST http://localhost:4000/api/auth/mfa/totp/enable \
  -H "Authorization: Bearer $JWT"

# Verify MFA
curl -X POST http://localhost:4000/api/auth/mfa/verify \
  -H "Authorization: Bearer $JWT" \
  -d '{"token": "123456"}'
```

### Search

```bash
# Search shipments
curl "http://localhost:4000/api/search/shipments?q=New%20York" \
  -H "Authorization: Bearer $JWT"

# Autocomplete
curl "http://localhost:4000/api/search/autocomplete?q=John&category=users" \
  -H "Authorization: Bearer $JWT"
```

### Webhooks

```bash
# Register webhook
curl -X POST http://localhost:4000/api/webhooks/register \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "url": "https://example.com/webhooks",
    "events": ["shipment.created"],
    "secret": "your_secret"
  }'
```

---

## Error Handling

All Phase 9 services include comprehensive error handling:

```javascript
try {
  const result = await paymentService.processCryptoPayment(data);
} catch (err) {
  if (err.message.includes("insufficient_balance")) {
    // Handle insufficient balance
  } else if (err.message.includes("invalid_address")) {
    // Handle invalid crypto address
  } else {
    // Handle other errors
    logger.error("Payment error", { error: err, data });
  }
}
```

---

## Testing

### Unit Tests

```bash
npm run test --filter api

# Run specific service test
npm run test -- advancedPayments.test.js
```

### Integration Tests

```bash
npm run test:integration -- phase9

# With coverage
npm run test:coverage --filter api
```

### Load Testing

```bash
npm run load-test:phase9

# Specific service
npm run load-test:payments
```

---

## Monitoring & Logging

All services include structured logging:

```javascript
// From logger middleware
logger.info("Payment processed", {
  paymentId: "pay_123",
  amount: 500,
  currency: "USD",
  duration: 1250, // ms
});

// Analytics events
logger.debug("Search executed", {
  query: "New York",
  results: 145,
  executionTime: 230, // ms
});
```

Monitor in production:

- API response times (target: <200ms)
- Payment success rate (target: >99.5%)
- Notification delivery rate (target: >99%)
- Search performance (target: <500ms)

---

## Troubleshooting

### Crypto Payment Fails

- Check blockchain node connectivity
- Verify wallet address format
- Check gas/transaction fees

### Push Notifications Not Sending

- Verify FCM/APNs credentials
- Check device tokens are valid
- Review notification preferences

### Search Not Working

- Verify Elasticsearch is running
- Check indices are created
- Rebuild search index if needed

### MFA Issues

- Verify QR code generation
- Check OTP validity window (30 seconds)
- Review backup codes

---

## Next Steps

1. Deploy Phase 9 services to staging
2. Configure all external service credentials
3. Run integration tests
4. Performance testing under load
5. Deploy to production with canary release

For detailed API documentation, see
[PHASE_9_API_REFERENCE.md](PHASE_9_API_REFERENCE.md)
