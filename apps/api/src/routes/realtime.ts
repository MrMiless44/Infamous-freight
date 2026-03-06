import { Router } from "express";
import { authenticate } from "../middleware/security.js";
import { sseHandler } from "../realtime/sse.js";

export const realtime = Router();

realtime.get("/stream", authenticate as any, sseHandler);
