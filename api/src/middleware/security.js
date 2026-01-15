/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Security & Authentication Middleware
 */

const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { authenticateWithRotation } = require("./advancedSecurity");

// Rate limiters with enhanced configuration
const createLimiter = (options) => rateLimit({
  ...options,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health' || req.path === '/api/health/live',
});

const limiters = {
  general: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MS || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '100'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Too many requests. Please try again later.' },
  }),
  auth: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
    keyGenerator: (req) => req.ip,
    message: { error: "Too many authentication attempts. Try again later." },
  }),
  ai: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS || '1') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AI_MAX || '20'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'AI service rate limit exceeded.' },
  }),
  billing: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_BILLING_WINDOW_MS || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_BILLING_MAX || '30'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Billing rate limit exceeded.' },
  }),
  voice: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_VOICE_WINDOW_MS || '1') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_VOICE_MAX || '10'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Voice processing rate limit exceeded.' },
  }),
  // High-cost operations (exports, reports)
  export: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_EXPORT_WINDOW_MS || '60') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_EXPORT_MAX || '5'),
    keyGenerator: (req) => req.user?.sub || req.ip,
    message: { error: 'Export rate limit exceeded. Maximum 5 exports per hour.' },
  }),
  // Password/account operations
  passwordReset: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS || '24') * 60 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_MAX || '3'),
    keyGenerator: (req) => req.body?.email || req.ip,
    message: { error: 'Too many password reset attempts. Try again in 24 hours.' },
  }),
  // Webhook validation (allow bursts but track)
  webhook: createLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WEBHOOK_WINDOW_MS || '1') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '100'),
    keyGenerator: (req) => req.ip,
    message: { error: 'Webhook rate limit exceeded.' },
  }),
};

// Authentication via JWT
function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }
    const token = header.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server auth misconfiguration" });
    }
    const payload = jwt.verify(token, secret);
    req.user = payload; // expected shape: { sub, email?, role?, scopes?: string[] }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional rotation-aware authentication controlled via env
function authenticateFlexible(req, res, next) {
  if (process.env.ENABLE_TOKEN_ROTATION === "true") {
    return authenticateWithRotation(req, res, next);
  }
  return authenticate(req, res, next);
}

// Scope enforcement
function requireScope(required) {
  const requiredScopes = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    const scopes = req.user?.scopes || [];
    const hasAll = requiredScopes.every((s) => scopes.includes(s));
    if (!hasAll) {
      return res
        .status(403)
        .json({ error: "Insufficient scope", required: requiredScopes });
    }
    next();
  };
}

// Audit log (basic)
function auditLog(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const maskedAuthorization = req.headers.authorization ? "***" : undefined;
    console.info("request", {
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      duration,
      user: req.user?.sub,
      ip: req.ip,
      auth: maskedAuthorization,
    });
  });
  next();
}

// Validate user owns resource (for routes like /users/:id, /shipments/:id)
function validateUserOwnership(paramName = 'userId') {
  return async (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body?.[paramName];
    const currentUserId = req.user?.sub;

    // Admin can bypass ownership check
    if (req.user?.role === 'admin') {
      return next();
    }

    // User can only access own resources
    if (resourceUserId && resourceUserId !== currentUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this resource',
      });
    }

    next();
  };
}

module.exports = {
  limiters,
  rateLimit: limiters.general,
  authenticate,
  authenticateFlexible,
  requireScope,
  auditLog,
  validateUserOwnership,
};
