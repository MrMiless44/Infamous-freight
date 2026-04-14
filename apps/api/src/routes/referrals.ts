import { randomBytes } from "node:crypto";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

/**
 * Referral Program API Routes
 * Tier-based rewards: Free users get $10 credit, Pro users get $50
 */

const router: Router = Router();

function generateReferralCode(): string {
  return "ref_" + randomBytes(6).toString("hex").toUpperCase();
}

// GET /api/referrals/link - Get user's referral link
router.get("/link", requireAuth, (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const referralCode = (user as any).referral_code ?? generateReferralCode();
    const appBaseUrl = process.env.APP_BASE_URL ?? "https://infamous-freight.com";

    res.json({
      success: true,
      referral_link: `${appBaseUrl}?ref=${referralCode}`,
      referral_code: referralCode,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/referrals/stats - Get referral stats
router.get("/stats", requireAuth, (_req, res) => {
  res.status(501).json({
    success: false,
    error: "Referral stats not yet implemented",
  });
});

// POST /api/referrals/redeem - Redeem accumulated referral credits
router.post("/redeem", requireAuth, (_req, res) => {
  res.status(501).json({
    success: false,
    error: "Referral redemption not yet implemented",
  });
});

export default router;
