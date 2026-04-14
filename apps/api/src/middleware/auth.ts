import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";
import type { JwtAccessTokenPayload } from "../modules/auth/auth.types.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";

// Extend JwtAccessTokenPayload locally to accommodate optional tenant claims that may
// be embedded in tokens by the issuer without being part of the base type definition.
interface JwtClaimsWithTenant extends JwtAccessTokenPayload {
  tenantId?: string;
  organizationId?: string;
  orgId?: string;
}

export type AuthenticatedRequest = Request;

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
    return;
  }

  try {
    const claims = verifyAccessToken(authorization.slice(7)) as JwtClaimsWithTenant;

    // Resolve tenant identifier — check `tenantId` first, then alias fields.
    const tenantId: string | undefined =
      claims.tenantId ?? claims.organizationId ?? claims.orgId;

    req.auth = {
      userId: claims.sub,
      role: claims.role,
      tokenType: claims.type,
      organizationId: claims.organizationId ?? tenantId,
      orgId: claims.orgId ?? tenantId,
    };
    req.user = {
      id: claims.sub,
      sub: claims.sub,
      email: claims.email ?? "",
      role: claims.role,
      tenantId,
      organizationId: claims.organizationId ?? tenantId,
    };
    req.tenantId = tenantId;
    req.orgId = claims.orgId ?? tenantId;
    req.organizationId = claims.organizationId ?? tenantId;

    next();
  } catch {
    next(new ApiError(401, "INVALID_ACCESS_TOKEN", "Invalid or expired access token"));
  }
}
