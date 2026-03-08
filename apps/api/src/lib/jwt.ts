import jwt from "jsonwebtoken";
import type { JwtClaims } from "@infamous/shared";
import { env } from "../config/env";

export function verifyAccessToken(token: string): JwtClaims {
  const key = env.jwtPublicKey ?? env.jwtSecret;
  const algorithms = env.jwtPublicKey ? ["RS256"] : ["HS256"];

  return jwt.verify(token, key, {
    algorithms
  }) as JwtClaims;
}
