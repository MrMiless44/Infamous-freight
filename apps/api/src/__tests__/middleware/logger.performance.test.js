const {
  correlationMiddleware,
  performanceMiddleware,
  logger,
  PERF_WARN_THRESHOLD,
  PERF_ERROR_THRESHOLD,
} = require("../../middleware/logger");

describe("Logger Middleware", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("correlationMiddleware sets correlation id and headers", () => {
    const req = { headers: {} };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    correlationMiddleware(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(req.startTime).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith("x-correlation-id", req.correlationId);
    expect(next).toHaveBeenCalled();
  });

  test("performanceMiddleware logs warn for slow responses", () => {
    const req = {
      method: "GET",
      originalUrl: "/api/health",
      ip: "127.0.0.1",
      get: jest.fn(),
      user: { sub: "user-1" },
      correlationId: "corr-1",
    };
    const res = { statusCode: 200, on: jest.fn() };
    const next = jest.fn();
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});

    jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(PERF_WARN_THRESHOLD + 10);

    performanceMiddleware(req, res, next);

    const finishHandler = res.on.mock.calls.find(([event]) => event === "finish")[1];
    finishHandler();

    expect(warnSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test("performanceMiddleware logs error for very slow responses", () => {
    const req = {
      method: "GET",
      originalUrl: "/api/health",
      ip: "127.0.0.1",
      get: jest.fn(),
      user: { sub: "user-1" },
      correlationId: "corr-2",
    };
    const res = { statusCode: 500, on: jest.fn() };
    const next = jest.fn();
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});

    jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(PERF_ERROR_THRESHOLD + 10);

    performanceMiddleware(req, res, next);

    const finishHandler = res.on.mock.calls.find(([event]) => event === "finish")[1];
    finishHandler();

    expect(errorSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
