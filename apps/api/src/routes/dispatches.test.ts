import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    dispatch: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: vi.fn((req: any, _res: any, next: any) => {
    req.user = {
      tenantId: "tenant-test-1",
      id: "user-1",
      sub: "user-1",
      email: "test@test.com",
      role: "user",
    };
    next();
  }),
}));

import express from "express";
import request from "supertest";
import { prisma } from "../db/prisma.js";
import { errorHandler } from "../middleware/error-handler.js";
import dispatchesRouter from "./dispatches.js";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/dispatches", dispatchesRouter);
  app.use(errorHandler);
  return app;
};

const mockDispatch = {
  id: "dispatch-1",
  tenantId: "tenant-test-1",
  loadId: "load-1",
  driverId: "driver-1",
  status: "PENDING",
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("GET /dispatches", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.mocked(prisma.dispatch.findMany).mockResolvedValue([mockDispatch] as any);
  });

  it("returns paginated list with ok:true", async () => {
    const res = await request(app).get("/dispatches");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("queries only the authenticated tenant", async () => {
    await request(app).get("/dispatches");
    expect(prisma.dispatch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "tenant-test-1" } }),
    );
  });
});

describe("POST /dispatches", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.mocked(prisma.dispatch.create).mockResolvedValue(mockDispatch as any);
  });

  const validBody = { loadId: "load-1", driverId: "driver-1" };

  it("creates a dispatch and returns 201", async () => {
    const res = await request(app).post("/dispatches").send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it("injects tenantId from JWT — not from request body", async () => {
    await request(app).post("/dispatches").send(validBody);
    expect(prisma.dispatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenant-test-1" }),
      }),
    );
  });

  it("returns 400 when loadId is missing", async () => {
    const res = await request(app).post("/dispatches").send({ driverId: "driver-1" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /dispatches/:id", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
  });

  it("returns 404 when dispatch not found for tenant", async () => {
    vi.mocked(prisma.dispatch.findFirst).mockResolvedValue(null);
    const res = await request(app).patch("/dispatches/nonexistent").send({ status: "ASSIGNED" });
    expect(res.status).toBe(404);
    expect(res.body.error?.code).toBe("DISPATCH_NOT_FOUND");
  });

  it("updates status when dispatch belongs to tenant", async () => {
    vi.mocked(prisma.dispatch.findFirst).mockResolvedValue(mockDispatch as any);
    vi.mocked(prisma.dispatch.update).mockResolvedValue({
      ...mockDispatch,
      status: "ASSIGNED",
    } as any);
    const res = await request(app).patch("/dispatches/dispatch-1").send({ status: "ASSIGNED" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("returns 400 for invalid status value", async () => {
    const res = await request(app).patch("/dispatches/dispatch-1").send({ status: "WRONG" });
    expect(res.status).toBe(400);
  });
});
