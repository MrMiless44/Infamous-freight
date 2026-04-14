import { Router } from "express";
import { z } from "zod";
import { pool } from "../lib/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router: Router = Router();

const createBrokerSchema = z.object({
  companyName: z.string().min(1),
  mcNumber: z.string().min(1),
  creditScore: z.number().int().min(0).max(100).default(70),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { rows } = await pool.query(
      "SELECT * FROM brokers WHERE tenant_id = $1 ORDER BY company_name ASC",
      [user.tenantId],
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    if (!user.tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }
    const { companyName, mcNumber, creditScore } = createBrokerSchema.parse(req.body);
    const { rows } = await pool.query(
      "INSERT INTO brokers (tenant_id, company_name, mc_number, credit_score) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.tenantId, companyName, mcNumber, creditScore],
    );
    res.status(201).json({ ok: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
