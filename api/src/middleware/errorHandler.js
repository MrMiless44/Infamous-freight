// Global error handler with enhanced logging and monitoring
const Sentry = require('@sentry/node');
const { logger } = require('./logger');

function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const errorId = req.correlationId || `${Date.now()}-${Math.random()}`;

    // Structured error logging with context
    logger.error(
        {
            method: req.method,
            path: req.originalUrl || req.path,
            status,
            error: message,
            stack: err.stack,
            user: req.user?.sub,
            correlationId: errorId,
            hostname: req.hostname,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        },
        'Request failed'
    );

    // Sentry capture with rich context
    if (Sentry && process.env.SENTRY_DSN) {
        Sentry.captureException(err, {
            tags: {
                path: req.path,
                method: req.method,
                status: status,
                errorId: errorId,
            },
            contexts: {
                request: {
                    method: req.method,
                    url: req.originalUrl || req.path,
                    headers: req.headers,
                    body: req.body ? JSON.stringify(req.body) : undefined,
                    ip: req.ip,
                },
                http: {
                    status_code: status,
                },
            },
            user: req.user ? { id: req.user.sub, email: req.user.email } : undefined,
        });
    }

    // Sensitive error message handling
    const clientMessage = status >= 500 ? 'Internal Server Error' : message;
    const responseBody = {
        error: clientMessage,
        errorId: errorId,
    };

    // Include error details in development
    if (process.env.NODE_ENV === 'development') {
        responseBody.details = message;
        responseBody.stack = err.stack;
    }

    res.status(status).json(responseBody);
}

module.exports = errorHandler;
