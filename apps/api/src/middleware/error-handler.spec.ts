import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { z } from "zod";
import { notFound, errorHandler } from "./error-handler.js";

function makeResMock() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function makeReqMock() {
  return {} as Request;
}

const next: NextFunction = vi.fn() as unknown as NextFunction;

describe("error-handler middleware", () => {
  describe("notFound", () => {
    it("responds with 404 and ok:false", () => {
      const req = makeReqMock();
      const res = makeResMock();

      notFound(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: "Route not found",
      });
    });
  });

  describe("errorHandler", () => {
    it("returns 400 with validation details for ZodError", () => {
      const schema = z.object({ name: z.string() });
      let zodErr: ZodError | null = null;
      try {
        schema.parse({ name: 123 });
      } catch (e) {
        zodErr = e as ZodError;
      }

      const req = makeReqMock();
      const res = makeResMock();

      errorHandler(zodErr!, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.ok).toBe(false);
      expect(call.error).toBe("Validation error");
      expect(call.details).toBeDefined();
    });

    it("returns 500 with message for a generic Error", () => {
      const req = makeReqMock();
      const res = makeResMock();
      const err = new Error("Something went wrong");

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: "Something went wrong",
      });
    });

    it("returns 500 with default message for non-Error throwables", () => {
      const req = makeReqMock();
      const res = makeResMock();

      errorHandler("string error", req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: "Internal server error",
      });
    });

    it("returns 500 with default message for null", () => {
      const req = makeReqMock();
      const res = makeResMock();

      errorHandler(null, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: "Internal server error",
      });
    });
  });
});
