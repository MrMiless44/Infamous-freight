import type { Scope } from "@infamous/shared";
import type { NextFunction, Request, Response } from "express";
import { requireScope as requireScopeBase } from "./security";

// Typed wrapper around the canonical requireScope implementation in ./security
export function requireScope(scope: Scope) {
  // Delegate to the existing middleware to ensure consistent authz behavior
  return requireScopeBase(scope as any) as (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void;
}
