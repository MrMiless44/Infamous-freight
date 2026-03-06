import { Router } from "express";
import { sseHandler } from "../realtime/sse.js";

export const realtime = Router();

realtime.get("/stream", sseHandler);
