/*
 * Load Test Processor
 * Provides helper functions for Artillery load tests
 */

const jwt = require('jsonwebtoken');

// Generate a valid JWT token
function generateToken() {
  const secret = process.env.JWT_SECRET || 'test-secret-key';
  const token = jwt.sign(
    {
      sub: 'loadtest-user-' + Math.random().toString(36).substring(7),
      email: 'loadtest@test.local',
      role: 'user',
      scopes: ['shipments:read', 'shipments:write', 'billing:read'],
    },
    secret,
    { expiresIn: '1h' }
  );
  return token;
}

// Set Authorization header with valid token
function setAuthHeader(context, ee, next) {
  const token = generateToken();
  context.vars.authToken = token;
  return next();
}

// Get a random shipment ID (or generate a realistic UUID)
function getRandomShipmentId(context, ee, next) {
  // In real scenario, you'd query the database or API for actual IDs
  const uuid = require('crypto').randomUUID();
  context.vars.shipmentId = uuid;
  return next();
}

// Track custom metrics
function trackMetric(context, ee, next) {
  const startTime = Date.now();

  ee.on('response', (latency, statusCode) => {
    const duration = Date.now() - startTime;
    console.log(`[METRICS] Status: ${statusCode}, Latency: ${latency}ms, Duration: ${duration}ms`);
  });

  return next();
}

// Generate random shipment data
function generateShipmentData(context, ee, next) {
  const origins = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
  const destinations = ['Miami, FL', 'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Portland, OR'];

  context.vars.origin = origins[Math.floor(Math.random() * origins.length)];
  context.vars.destination = destinations[Math.floor(Math.random() * destinations.length)];
  context.vars.weight = Math.floor(Math.random() * 1000) + 1;
  context.vars.estimatedValue = Math.floor(Math.random() * 50000) + 100;

  return next();
}

// Simulate think time (user pause between actions)
function thinkTime(context, ee, next) {
  const delay = Math.floor(Math.random() * 5000) + 1000; // 1-6 seconds
  setTimeout(() => next(), delay);
}

// Log performance summary
function logSummary(context, ee, next) {
  console.log('=== Load Test Summary ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Scenario: ${context.scenario.name}`);
  console.log('========================');
  return next();
}

module.exports = {
  setAuthHeader,
  getRandomShipmentId,
  trackMetric,
  generateShipmentData,
  thinkTime,
  logSummary,
};
