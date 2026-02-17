// Distributed Tracing Service
// Integrates Jaeger for request tracing

const initTracer = require('jaeger-client').initTracer;
const { Tags, opentracing } = require('opentracing');
const jaegerConfig = require('../config/jaeger-client-config.json');

let tracer;

const initJaeger = (serviceName) => {
    const config = {
        serviceName: serviceName,
        sampler: jaegerConfig.sampler,
        reporter: {
            agentHost: process.env.JAEGER_AGENT_HOST || 'jaeger-agent',
            agentPort: process.env.JAEGER_AGENT_PORT || 6831,
            logSpans: true,
        },
        logger: require('winston').createLogger({
            format: 'json',
            defaultMeta: { service: serviceName },
        }),
    };

    const options = {
        logger: console,
        sampler: {
            type: 'const',
            param: 1,
        },
    };

    tracer = initTracer(config, options);
    return tracer;
};

const getTracer = () => {
    if (!tracer) {
        throw new Error('Tracer not initialized. Call initJaeger() first.');
    }
    return tracer;
};

// Middleware for Express to create spans for each request
const tracingMiddleware = (req, res, next) => {
    const wireCtx = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
    const span = tracer.startSpan(req.path, {
        childOf: wireCtx,
        tags: {
            [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
            [Tags.HTTP_METHOD]: req.method,
            [Tags.HTTP_URL]: req.url,
            [Tags.COMPONENT]: 'express',
        },
    });

    // Store span in request for child spans
    req.span = span;

    // Add tracing headers to response
    tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, res.getHeaders());

    res.on('finish', () => {
        span.setTag(Tags.HTTP_STATUS_CODE, res.statusCode);
        if (res.statusCode >= 400) {
            span.setTag(Tags.ERROR, true);
            span.log({
                event: 'http_error',
                message: `HTTP ${res.statusCode}`,
            });
        }
        span.finish();
    });

    next();
};

// Create child spans for database operations
const createDatabaseSpan = (req, operation, query) => {
    const span = tracer.startSpan(`db.${operation}`, {
        childOf: req.span,
        tags: {
            [Tags.DB_TYPE]: 'postgresql',
            [Tags.DB_OPERATION]: operation,
            [Tags.COMPONENT]: 'postgres',
        },
    });

    // Sanitize query for logging (don't log sensitive data)
    const sanitizedQuery = query.substring(0, 100);
    span.log({
        event: 'db_query',
        message: sanitizedQuery,
        timestamp: Date.now(),
    });

    return span;
};

// Create child spans for cache operations
const createCacheSpan = (req, operation, key) => {
    const span = tracer.startSpan(`cache.${operation}`, {
        childOf: req.span,
        tags: {
            [Tags.DB_TYPE]: 'redis',
            [Tags.COMPONENT]: 'redis',
            'cache.key': key,
            'cache.operation': operation,
        },
    });

    return span;
};

// Create child spans for external API calls
const createExternalSpan = (req, service, operation, url) => {
    const span = tracer.startSpan(`external.${service}.${operation}`, {
        childOf: req.span,
        tags: {
            [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
            [Tags.HTTP_METHOD]: 'GET',
            [Tags.HTTP_URL]: url,
            [Tags.COMPONENT]: service,
        },
    });

    return span;
};

// Inject tracing context into HTTP headers for outgoing requests
const injectTracingHeaders = (span, headers = {}) => {
    tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, headers);
    return headers;
};

module.exports = {
    initJaeger,
    getTracer,
    tracingMiddleware,
    createDatabaseSpan,
    createCacheSpan,
    createExternalSpan,
    injectTracingHeaders,
};
