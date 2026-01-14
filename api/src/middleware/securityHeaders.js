const helmet = require("helmet");
const { logger } = require('./logger');

function securityHeaders(app) {
  // Comprehensive security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", process.env.CORS_ORIGINS || 'http://localhost:3000'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : [],
        },
        reportUri: process.env.CSP_REPORT_URI,
      },
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  // SameSite cookie protection
  app.use((req, res, next) => {
    const oldSet = res.set.bind(res);
    res.set = function (key, val) {
      if (key?.toLowerCase() === 'set-cookie') {
        val = Array.isArray(val) ? val : [val];
        val = val.map(v => {
          if (!v.includes('SameSite')) {
            v += '; SameSite=Strict';
          }
          return v;
        });
      }
      return oldSet(key, val);
    };
    next();
  });
}

function handleCSPViolation(req, res) {
  const violation = req.body;
  logger.warn(
    {
      type: 'csp-violation',
      violatedDirective: violation['violated-directive'],
      blockedURI: violation['blocked-uri'],
      originalPolicy: violation['original-policy'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
    },
    'CSP Violation'
  );
  res.status(204).end();
}

module.exports = {
  securityHeaders,
  handleCSPViolation,
};
