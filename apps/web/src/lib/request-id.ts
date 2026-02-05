import crypto from "crypto";
import { NextResponse } from "next/server";

export function getRequestId(req: Request) {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function jsonWithRequestId(req: Request, body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("x-request-id", getRequestId(req));
  return response;
}
