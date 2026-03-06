import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/security.js";
import { sseBroadcast } from "../realtime/sse.js";

export const loadboard = Router();

loadboard.get("/", authenticate as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.organizationId ?? "");
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
    const skip = (page - 1) * pageSize;

    const q = String(req.query.q ?? "").trim();
    const originState = String(req.query.originState ?? "").trim();
    const destState = String(req.query.destState ?? "").trim();
    const status = String(req.query.status ?? "").trim().toUpperCase();

    const where: any = { organizationId: tenantId };
    if (status) where.status = status;
    if (originState) where.originState = originState;
    if (destState) where.destState = destState;
    if (q) {
      where.OR = [
        { originCity: { contains: q, mode: "insensitive" } },
        { destCity: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await Promise.all([
      (prisma as any).load.count({ where }),
      (prisma as any).load.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
    ]);

    res.json({ page, pageSize, total, data: rows });
  } catch (e) {
    next(e);
  }
});

loadboard.post("/:id/claim", authenticate as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.organizationId ?? "");
    const userId = String((req as any).auth?.userId ?? "");
    const load = await (prisma as any).load.findFirst({ where: { id: req.params.id, organizationId: tenantId } });
    if (!load) return res.status(404).json({ error: "Load not found" });
    if (load.status !== "OPEN") return res.status(409).json({ error: "Load not open" });

    await (prisma as any).load.update({
      where: { id: load.id },
      data: { status: "CLAIMED", claimedByUserId: userId, claimedAt: new Date() }
    });

    sseBroadcast(tenantId, "load.updated", { id: load.id, status: "CLAIMED" });
    res.json({ ok: true, id: load.id });
  } catch (e) {
    next(e);
  }
});
