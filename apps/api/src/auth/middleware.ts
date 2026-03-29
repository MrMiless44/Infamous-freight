import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/errors.js";
import { verifyToken } from "./jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const tokenStr = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!tokenStr) return next(new HttpError(401, "Missing Bearer token"));
  try {
    const payload = verifyToken(tokenStr);
    req.auth = {
      userId: payload.sub,
      role: payload.role as "user",
      tokenType: "access" as const,
    };
    next();
  } catch {
    next(new HttpError(401, "Invalid token"));
  }
}
