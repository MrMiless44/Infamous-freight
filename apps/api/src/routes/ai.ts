import { zAICommand } from "@infamous/shared";
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { processAICommand } from "../services/ai.service.js";
import { parseOrThrow } from "../utils/validate.js";

export const ai = Router();

ai.post("/command", requireAuth, async (req, res, next) => {
  try {
    const body = parseOrThrow(zAICommand, req.body);
    res.json(processAICommand(body));
  } catch (e) {
    next(e);
  }
});
