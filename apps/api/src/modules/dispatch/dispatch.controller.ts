import type { Request, Response } from "express";
import { DispatchService } from "./dispatch.service.js";

const service = new DispatchService();

export class DispatchController {
  async recommend(req: Request, res: Response) {
    const loadId = String(req.params.loadId);
    const data = await service.recommend(req.auth!.organizationId, loadId);
    res.json({ loadId, recommendations: data });
  }

  async assign(req: Request, res: Response) {
    const data = await service.assign(
      req.auth!.organizationId,
      req.auth!.sub,
      String(req.params.loadId),
      String(req.params.driverId)
    );

    res.json(data);
  }
}
