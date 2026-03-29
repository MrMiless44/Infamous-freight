import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to require a valid tenant context.
 * Checks for tenantId from auth or query parameters.
 */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  const tenantId = (req as any).tenantId || (req as any).user?.tenantId || req.query.tenantId;
  if (!tenantId) {
    res.status(400).json({ ok: false, error: "Tenant context required" });
    return;
  }
  (req as any).tenantId = String(tenantId);
  next();
}
