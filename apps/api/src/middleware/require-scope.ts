import type { Request, Response, NextFunction } from "express";

export function requireScope(...requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const scopes = req.auth?.scopes ?? [];
    const ok = requiredScopes.every((scope) => scopes.includes(scope));

    if (!ok) {
      return res.status(403).json({
        error: "Forbidden",
        requiredScopes
      });
    }

    next();
  };
}
