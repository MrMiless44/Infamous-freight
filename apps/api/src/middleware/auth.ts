import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";

export type AuthenticatedRequest = Request;

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
    return;
  }

  try {
    const claims = verifyAccessToken(authorization.slice(7));

    req.auth = {
      userId: claims.sub,
      role: claims.role,
      tokenType: claims.type,
      organizationId: undefined,
      orgId: undefined,
    };
    req.user = {
      id: claims.sub,
      email: claims.email ?? "",
      role: claims.role,
      tenantId: "",
    };
    req.tenantId = "";
    req.orgId = undefined;
    req.organizationId = undefined;

    next();
  } catch {
    next(new ApiError(401, "INVALID_ACCESS_TOKEN", "Invalid or expired access token"));
  }
}
