import type { NextFunction, Request, Response } from "express";

export function tenantContext(req: Request, _res: Response, next: NextFunction) {
  const anyReq = req as any;

  // Prefer tenant/organization information set by upstream authentication middleware.
  const user = anyReq.user;
  let tenantId: string | undefined =
    user?.organizationId ??
    user?.tenantId ??
    req.header("x-organization-id") ??
    req.header("x-tenant-id") ??
    undefined;

  if (tenantId) {
    // Attach a normalized tenant identifier for downstream DB scoping.
    anyReq.tenantId = tenantId;
    // Also expose as organizationId for compatibility with org-centric code paths.
    if (!anyReq.organizationId) {
      anyReq.organizationId = tenantId;
    }
  }
  next();
}
