import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const loggerModule = require("./logger.js");

export const httpLogger = loggerModule.httpLogger;
export const logger = loggerModule.logger;
export const correlationMiddleware = loggerModule.correlationMiddleware;
export const performanceMiddleware = loggerModule.performanceMiddleware;
export const LOG_LEVEL = loggerModule.LOG_LEVEL;
export const PERF_WARN_THRESHOLD = loggerModule.PERF_WARN_THRESHOLD;
export const PERF_ERROR_THRESHOLD = loggerModule.PERF_ERROR_THRESHOLD;

export default loggerModule;
