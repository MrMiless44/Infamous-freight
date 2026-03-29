import { Router } from "express";
import { prisma } from "../db/prisma.js";

const db = prisma as any;
export const tenants: Router = Router();

tenants.post("/", async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    if (name.length < 2) return res.status(400).json({ error: "Invalid tenant name" });
    const row = await db.tenant.create({ data: { name } });
    res.status(201).json({ id: row.id, name: row.name });
  } catch (e) {
    next(e);
  }
});
