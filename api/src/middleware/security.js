/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Security & Authentication Middleware
 */

const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

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

module.exports = {
  limiters,
  rateLimit: limiters.general,
  authenticate,
  requireScope,
  auditLog,
};
