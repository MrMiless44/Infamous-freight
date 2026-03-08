import type { Request, Response, NextFunction } from "express";

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.organizationId) {
    return res.status(403).json({
      error: "forbidden",
      message: "Missing organization context",
    });
  }

  req.headers["x-organization-id"] = req.auth.organizationId;
  return next();
}
