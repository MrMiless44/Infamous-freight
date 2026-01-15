# API Endpoints Reference

## 📡 Complete API Routes Documentation

**Base URL**: `https://infamous-freight-api.fly.dev` (production)  
**API Version**: v1  
**Authentication**: Bearer JWT token in Authorization header

---

## 🏥 Health & Status Endpoints

### Health Check (Public)

```http
GET /api/health
```

**Description**: General health status, database connection, uptime  
**Auth**: None  
**Rate Limit**: Unlimited (health check exclusion)  
**Response**:

```json
{
  "status": "ok",
  "uptime": 3600.5,
  "timestamp": 1705334400000,
  "database": "connected"
}
```

### Liveness Probe (Public)

```http
GET /api/health/live
```

**Description**: Kubernetes liveness probe  
**Auth**: None  
**Rate Limit**: Unlimited  
**Response**: `200 OK` or `503 Service Unavailable`

### Readiness Probe (Public)

```http
GET /api/health/ready
```

**Description**: Kubernetes readiness probe  
**Auth**: None  
**Rate Limit**: Unlimited  
**Response**: `200 OK` or `503 Service Unavailable`

**Reference**: [api/src/routes/health.js](api/src/routes/health.js)

---

## 👥 User Management Endpoints

### List All Users (Admin)

```http
GET /api/users
Authorization: Bearer <token>
```

**Auth**: Required, scope `users:read`  
**Rate Limit**: 100 requests/15 min  
**Query Params**:

- `skip` - Number of records to skip (pagination)
- `take` - Number of records to return (max 100)
- `role` - Filter by role (admin, driver, manager)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "driver",
      "createdAt": "2025-01-15T00:00:00Z"
    }
  ],
  "total": 100
}
```

### Get User by ID

```http
GET /api/users/:userId
Authorization: Bearer <token>
```

**Auth**: Required, own user or admin scope `users:read`  
**Rate Limit**: 100 requests/15 min  
**Params**: `userId` - User UUID

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1-555-0000",
    "role": "driver",
    "createdAt": "2025-01-15T00:00:00Z"
  }
}
```

### Create User (Signup)

```http
POST /api/users
Content-Type: application/json
```

**Auth**: None  
**Rate Limit**: 5 attempts/15 min (password reset limiter)  
**Body**:

```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "New User",
  "phone": "+1-555-0000"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Update User

```http
PATCH /api/users/:userId
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth**: Required, own user or admin scope `users:write`  
**Rate Limit**: 100 requests/15 min  
**Body**: Partial user object (email, name, phone, preferences)

**Response**: Updated user object

### Delete User

```http
DELETE /api/users/:userId
Authorization: Bearer <token>
```

**Auth**: Required, own user or admin scope `users:delete`  
**Rate Limit**: 100 requests/15 min  
**Response**:

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Reference**: [api/src/routes/users.js](api/src/routes/users.js)

---

## 📦 Shipment Management Endpoints

### List Shipments

```http
GET /api/shipments
Authorization: Bearer <token>
```

**Auth**: Required, scope `shipments:read`  
**Rate Limit**: 100 requests/15 min (cached 5 min)  
**Query Params**:

- `status` - Filter by status (pending, in_transit, delivered, cancelled)
- `driverId` - Filter by driver
- `skip` - Pagination offset
- `take` - Pagination limit

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "trackingNumber": "IFE-2025-00001",
      "origin": "New York, NY",
      "destination": "Los Angeles, CA",
      "status": "in_transit",
      "driverId": "uuid",
      "createdAt": "2025-01-15T00:00:00Z",
      "estimatedDelivery": "2025-01-20T00:00:00Z"
    }
  ],
  "total": 50
}
```

### Get Shipment by ID

```http
GET /api/shipments/:shipmentId
Authorization: Bearer <token>
```

**Auth**: Required, scope `shipments:read`  
**Rate Limit**: 100 requests/15 min (cached 5 min)  
**Response**: Full shipment object with real-time location

### Create Shipment

```http
POST /api/shipments
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth**: Required, scope `shipments:create`  
**Rate Limit**: 100 requests/15 min  
**Body**:

```json
{
  "origin": "New York, NY",
  "destination": "Los Angeles, CA",
  "items": [
    {
      "description": "Electronics",
      "quantity": 5,
      "weight": 15.5
    }
  ],
  "driverId": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trackingNumber": "IFE-2025-00001",
    "status": "pending",
    "createdAt": "2025-01-15T00:00:00Z"
  }
}
```

### Update Shipment Status

```http
PATCH /api/shipments/:shipmentId
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth**: Required, scope `shipments:update`  
**Rate Limit**: 100 requests/15 min  
**Body**:

```json
{
  "status": "in_transit",
  "location": { "lat": 40.7128, "lng": -74.006 }
}
```

### Delete Shipment

```http
DELETE /api/shipments/:shipmentId
Authorization: Bearer <token>
```

**Auth**: Required, scope `shipments:delete`  
**Rate Limit**: 100 requests/15 min  
**Response**: Success message

**Reference**: [api/src/routes/shipments.js](api/src/routes/shipments.js)

---

## 🤖 AI Commands Endpoints

### Execute AI Command

```http
POST /api/ai/commands
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth**: Required, scope `ai:command`  
**Rate Limit**: 20 requests/1 min  
**Body**:

```json
{
  "command": "route_optimization",
  "parameters": {
    "shipmentIds": ["uuid1", "uuid2"],
    "optimize": "time"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "result": "Optimized route with 15% time savings",
    "confidence": 0.92,
    "timestamp": "2025-01-15T00:00:00Z"
  }
}
```

### List AI Providers

```http
GET /api/ai/providers
Authorization: Bearer <token>
```

**Auth**: Required, scope `ai:read`  
**Response**:

```json
{
  "success": true,
  "data": {
    "active": "openai",
    "available": ["openai", "anthropic", "synthetic"],
    "fallback": "synthetic"
  }
}
```

**Reference**: [api/src/routes/ai.commands.js](api/src/routes/ai.commands.js)

---

## 🎙️ Voice Processing Endpoints

### Upload Voice Command

```http
POST /api/voice/ingest
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Auth**: Required, scope `voice:ingest`  
**Rate Limit**: 10 uploads/1 min  
**Multipart Fields**:

- `audio` - Audio file (mp3, wav, m4a, max 10MB)
- `metadata` - JSON object with shipmentId, driverId, etc.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transcription": "Deliver package to 123 Main Street",
    "confidence": 0.95,
    "processedAt": "2025-01-15T00:00:00Z"
  }
}
```

### Execute Voice Command

```http
POST /api/voice/command
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth**: Required, scope `voice:command`  
**Rate Limit**: 10 commands/1 min  
**Body**:

```json
{
  "transcription": "Update status to delivered",
  "shipmentId": "uuid",
  "confidence": 0.95
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "action": "status_update",
    "shipmentId": "uuid",
    "newStatus": "delivered"
  }
}
```

**Reference**: [api/src/routes/voice.js](api/src/routes/voice.js)

---

## 💳 Billing Endpoints

### Create Payment Intent

```http
POST /api/billing/payment-intent
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth**: Required, scope `billing:create`  
**Rate Limit**: 30 requests/15 min  
**Body**:

```json
{
  "amount": 9999,
  "currency": "usd",
  "paymentMethod": "stripe",
  "metadata": {
    "shipmentId": "uuid"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdef",
    "publishableKey": "pk_live_abcdef..."
  }
}
```

### Confirm Payment

```http
POST /api/billing/payment-confirm
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth**: Required, scope `billing:write`  
**Rate Limit**: 30 requests/15 min  
**Body**:

```json
{
  "paymentIntentId": "pi_1234567890",
  "paymentMethodId": "pm_1234567890"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "amount": 9999,
    "transactionId": "txn_abc123"
  }
}
```

### List Invoices

```http
GET /api/billing/invoices
Authorization: Bearer <token>
```

**Auth**: Required, scope `billing:read`  
**Rate Limit**: 30 requests/15 min (cached 5 min)  
**Response**: Array of invoice objects

**Reference**: [api/src/routes/billing.js](api/src/routes/billing.js)

---

## 🔔 WebSocket Real-Time Endpoints

### Connect to WebSocket

```
wss://infamous-freight-api.fly.dev/ws
Authorization: Bearer <token>
```

**Auth**: Required, JWT token in query or header  
**Rate Limit**: Unlimited connections (per user)

**Connection Flow**:

1. Client connects with JWT token
2. Server validates token
3. Client sends subscribe message:

```json
{
  "type": "subscribe",
  "channels": ["shipment:123", "user:456"],
  "scopes": ["shipments:read"]
}
```

**Server Response**:

```json
{
  "type": "subscribed",
  "channels": ["shipment:123", "user:456"],
  "timestamp": "2025-01-15T00:00:00Z"
}
```

**Real-Time Updates** (from server):

```json
{
  "type": "update",
  "channel": "shipment:123",
  "data": {
    "status": "in_transit",
    "location": { "lat": 40.7128, "lng": -74.006 },
    "timestamp": "2025-01-15T00:00:00Z"
  }
}
```

**Reference**: [api/src/services/websocketServer.js](api/src/services/websocketServer.js)

---

## 🔐 Authentication Endpoints

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Auth**: None  
**Rate Limit**: 5 attempts/15 min  
**Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "driver"
    }
  }
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Auth**: Required  
**Response**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Token

```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

**Auth**: Required  
**Response**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Request Password Reset

```http
POST /api/auth/password-reset-request
Content-Type: application/json
```

**Auth**: None  
**Rate Limit**: 3 attempts/24 hours  
**Body**:

```json
{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Reset link sent to email"
}
```

---

## 📊 Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "msg": "Invalid email"
    }
  ],
  "timestamp": "2025-01-15T00:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning           | Example               |
| ---- | ----------------- | --------------------- |
| 200  | OK                | Request successful    |
| 201  | Created           | Resource created      |
| 400  | Bad Request       | Validation error      |
| 401  | Unauthorized      | Missing/invalid token |
| 403  | Forbidden         | Insufficient scope    |
| 404  | Not Found         | Resource not found    |
| 429  | Too Many Requests | Rate limit exceeded   |
| 500  | Server Error      | Internal error        |

---

## ⚙️ Rate Limiting

All endpoints enforce rate limiting based on scope:

| Limiter            | Window   | Max | Key Generator |
| ------------------ | -------- | --- | ------------- |
| **General**        | 15 min   | 100 | User ID or IP |
| **Auth**           | 15 min   | 5   | IP only       |
| **AI**             | 1 min    | 20  | User ID or IP |
| **Billing**        | 15 min   | 30  | User ID or IP |
| **Voice**          | 1 min    | 10  | User ID or IP |
| **Export**         | 60 min   | 5   | User ID or IP |
| **Password Reset** | 24 hours | 3   | Email or IP   |
| **Webhook**        | 1 min    | 100 | IP only       |

**Rate Limit Headers**:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1705334400
```

**Reference**: [api/src/middleware/security.js](api/src/middleware/security.js#L32)

---

## 🔑 JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "uuid",
    "email": "user@example.com",
    "role": "driver",
    "scopes": ["shipments:read", "shipments:write", "voice:ingest"],
    "iat": 1705334400,
    "exp": 1705420800
  }
}
```

**Token Lifetime**: 24 hours (configurable via env)  
**Scope Enforcement**: Per-route via `requireScope()` middleware

---

## 📡 Webhook Events

### Event Types

- `shipment.created` - New shipment created
- `shipment.updated` - Shipment status changed
- `shipment.delivered` - Shipment delivered
- `payment.completed` - Payment successful
- `user.registered` - New user signup

### Webhook Payload

```json
{
  "event": "shipment.updated",
  "id": "evt_abc123",
  "timestamp": "2025-01-15T00:00:00Z",
  "data": {
    "shipmentId": "uuid",
    "status": "in_transit",
    "previousStatus": "pending"
  }
}
```

### Webhook Signature

```
X-Webhook-Signature: sha256=abc123...
X-Webhook-Timestamp: 1705334400
```

---

**Last Updated**: January 15, 2026 | **Version**: 1.0 | **Status**: Complete 100%
