import { zCreateShipment, zTenantId } from "@infamous/shared";
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/prisma.js";
import { listShipments, updateShipmentStatus } from "../services/shipments.service.js";
import { parseOrThrow } from "../utils/validate.js";

export const shipments = Router();

shipments.get("/", requireAuth, async (req, res, next) => {
  try {
    const tenantId = zTenantId.parse((req as any).auth.tenantId);
    res.json({ data: await listShipments(tenantId) });
  } catch (e) {
    next(e);
  }
});

shipments.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = parseOrThrow(zCreateShipment, req.body);
    const row = await prisma.shipment.create({
      data: {
        tenantId: body.tenantId,
        ref: body.ref,
        originCity: body.originCity,
        originState: body.originState,
        destCity: body.destCity,
        destState: body.destState,
        weightLb: body.weightLb,
        rateCents: body.rateCents
      }
    });
    res.status(201).json({ id: row.id });
  } catch (e) {
    next(e);
  }
});

shipments.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const tenantId = zTenantId.parse((req as any).auth.tenantId);
    const status = String(req.body.status ?? "");
    await updateShipmentStatus(tenantId, req.params.id, status);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
