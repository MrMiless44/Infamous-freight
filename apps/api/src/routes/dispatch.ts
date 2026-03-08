import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireScope } from "../middleware/requireScope.js";
import { DispatchOptimizer } from "../services/dispatch/dispatch-optimizer.js";

export const dispatchRouter = Router();
const optimizer = new DispatchOptimizer();

dispatchRouter.post(
  "/:loadId/recommend",
  requireScope("dispatch.recommend"),
  async (req, res, next) => {
    try {
      const organizationId = req.auth!.organizationId;
      const { loadId } = req.params;

      if (!loadId || typeof loadId !== "string") {
        return res.status(400).json({ error: "Invalid loadId" });
      }

      const db = prisma as any;
      const load = await db.load.findFirst({
        where: { id: loadId, organizationId },
      });

      if (!load) {
        return res.status(404).json({ error: "Load not found" });
      }

      const drivers = await db.driver.findMany({
        where: {
          organizationId,
          status: "AVAILABLE",
        },
        include: {
          truck: true,
        },
      });

      const rankings = optimizer.rankDrivers(load, drivers);

      return res.json({
        loadId,
        organizationId,
        recommendations: rankings,
      });
    } catch (error) {
      return next(error);
    }
  },
);

dispatchRouter.post(
  "/:loadId/assign/:driverId",
  requireScope("dispatch.assign"),
  async (req, res, next) => {
    try {
      const organizationId = req.auth!.organizationId;
      const { loadId, driverId } = req.params;

      if (
        !loadId ||
        typeof loadId !== "string" ||
        !driverId ||
        typeof driverId !== "string"
      ) {
        return res
          .status(400)
          .json({ error: "Invalid loadId or driverId" });
      }

      const db = prisma as any;
      const [load, driver] = await Promise.all([
        db.load.findFirst({ where: { id: loadId, organizationId } }),
        db.driver.findFirst({
          where: { id: driverId, organizationId },
          include: { truck: true },
        }),
      ]);

      if (!load || !driver) {
        return res
          .status(404)
          .json({ error: "Load or driver not found" });
      }

      await db.load.update({
        where: { id: load.id },
        data: {
          driverId: driver.id,
          status: "ASSIGNED",
        },
      });

      return res.json({
        success: true,
        loadId,
        driverId,
      });
    } catch (error) {
      return next(error);
    }
  },
);
