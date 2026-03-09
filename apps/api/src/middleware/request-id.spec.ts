import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requestId } from "./request-id.js";

function makeResMock() {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: vi.fn((key: string, value: string) => {
      headers[key.toLowerCase()] = value;
    }),
    _headers: headers,
  } as unknown as Response;
  return { res, headers };
}

function makeReqMock(xRequestId?: string) {
  const req = {
    headers: xRequestId ? { "x-request-id": xRequestId } : {},
    header: vi.fn((name: string) =>
      xRequestId && name.toLowerCase() === "x-request-id"
        ? xRequestId
        : undefined,
    ),
  } as unknown as Request;
  return req;
}

const next: NextFunction = vi.fn() as unknown as NextFunction;

describe("requestId middleware", () => {
  it("calls next()", () => {
    const nextFn = vi.fn() as unknown as NextFunction;
    const req = makeReqMock();
    const { res } = makeResMock();

    requestId(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledOnce();
  });

  it("generates a UUID when x-request-id header is absent", () => {
    const req = makeReqMock();
    const { res, headers } = makeResMock();

    requestId(req, res, next);

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(headers["x-request-id"]).toMatch(uuidRegex);
  });

  it("forwards an existing x-request-id header from the request", () => {
    const existingId = "custom-request-id-123";
    const req = makeReqMock(existingId);
    const { res, headers } = makeResMock();

    requestId(req, res, next);

    expect(headers["x-request-id"]).toBe(existingId);
  });

  it("sets x-request-id on req.headers", () => {
    const req = makeReqMock();
    const { res } = makeResMock();

    requestId(req, res, next);

    const id = (req as { headers: Record<string, string> }).headers["x-request-id"];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });

  it("generated IDs are unique across calls", () => {
    const ids = new Set<string>();

    for (let i = 0; i < 20; i++) {
      const req = makeReqMock();
      const { res, headers } = makeResMock();
      requestId(req, res, next);
      ids.add(headers["x-request-id"]);
    }

    expect(ids.size).toBe(20);
  });
});
