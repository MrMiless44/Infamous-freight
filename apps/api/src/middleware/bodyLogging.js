/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Request/Response Body Logging Middleware
 * 
 * Sanitizes sensitive data (PII, financial info) and logs request/response 
 * bodies for debugging without exposing confidential information
 */

const { logger } = require('./logger');

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
    'password',
    'creditCard',
    'creditcard',
    'cvv',
    'cvc',
    'ssn',
    'apiKey',
    'api_key',
    'token',
    'secret',
    'jwt',
    'authorization',
    'stripe',
    'paypal',
];

/**
 * Recursively redact sensitive fields from object
 * @param {*} obj - Object to redact
 * @param {number} depth - Current recursion depth (max 5)
 * @returns {*} Object with sensitive fields redacted
 */
function redactSensitiveData(obj, depth = 0) {
    if (depth > 5 || typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => redactSensitiveData(item, depth + 1));
    }

    const redacted = {};
    for (const key in obj) {
        // Check if key matches any sensitive pattern
        const isSensitive = SENSITIVE_PATTERNS.some(pattern =>
            key.toLowerCase().includes(pattern.toLowerCase())
        );

        if (isSensitive) {
            redacted[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
            redacted[key] = redactSensitiveData(obj[key], depth + 1);
        } else {
            redacted[key] = obj[key];
        }
    }
    return redacted;
}

/**
 * Middleware: Log request and response bodies
 * Sanitizes sensitive data before logging
 */
function bodyLoggingMiddleware(req, res, next) {
    // Skip logging for health checks and static files
    if (req.path.includes('health') || req.path.includes('static')) {
        return next();
    }

    // Store original send function
    const originalSend = res.send;
    const startTime = Date.now();

    // Capture and sanitize request body
    let requestBody = '';
    if (req.method !== 'GET' && req.body) {
        try {
            const sanitized = redactSensitiveData(req.body);
            requestBody = JSON.stringify(sanitized).substring(0, 500);
        } catch (e) {
            requestBody = '[UNABLE_TO_SERIALIZE]';
        }
    }

    // Capture response body
    let responseBody = '';
    res.send = function (data) {
        try {
            if (typeof data === 'object') {
                responseBody = JSON.stringify(data).substring(0, 500);
            } else {
                responseBody = String(data).substring(0, 500);
            }
        } catch (e) {
            responseBody = '[UNABLE_TO_SERIALIZE]';
        }

        // Log if not GET request or if response is error
        if (req.method !== 'GET' || res.statusCode >= 400) {
            logger.debug('HTTP Body Log', {
                correlationId: req.correlationId,
                method: req.method,
                path: req.path,
                status: res.statusCode,
                requestBody,
                responseBody,
                durationMs: Date.now() - startTime,
                userId: req.user?.sub,
            });
        }

        // Call original send
        return originalSend.call(this, data);
    };

    next();
}

module.exports = bodyLoggingMiddleware;
