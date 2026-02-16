// apps/api/src/routes/phase9.advanced.js
const router = require("express").Router();
const { limiters } = require("../middleware/security");
const { authenticate, requireScope, auditLog } = require("../middleware/security");

// Import Phase 9 services
const { AdvancedPaymentsService } = require("../services/advancedPayments");
const { MobileWalletService } = require("../services/mobileWallet");
const { PushNotificationService } = require("../services/pushNotifications");
const { MultiFactorAuthService } = require("../services/multiFactorAuth");
const { AdvancedSearchService } = require("../services/advancedSearch");
const { WebhookSystemService } = require("../services/webhookSystem");
const { EmailTemplatingService } = require("../services/emailTemplating");
const { SMSNotificationService } = require("../services/smsNotifications");
const { AdminDashboardService } = require("../services/adminDashboard");
const { ContentManagementService } = require("../services/contentManagement");
const { APIVersioningService } = require("../services/apiVersioning");

/**
 * Advanced Payments
 */
router.post(
  "/payments/crypto",
  limiters.billing,
  authenticate,
  requireScope("payments:cryptocurrency"),
  auditLog,
  async (req, res, next) => {
    try {
      const paymentService = new AdvancedPaymentsService(req.prisma);
      const result = await paymentService.processCryptoPayment(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/payments/bnpl",
  limiters.billing,
  authenticate,
  requireScope("payments:bnpl"),
  auditLog,
  async (req, res, next) => {
    try {
      const paymentService = new AdvancedPaymentsService(req.prisma);
      const result = await paymentService.processBNPLPayment(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Mobile Wallet
 */
router.post("/wallet/load", limiters.billing, authenticate, auditLog, async (req, res, next) => {
  try {
    const walletService = new MobileWalletService(req.prisma);
    const result = await walletService.loadMoneyToWallet(
      req.user.sub,
      req.body.amount,
      req.body.fundingMethod,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/wallet/balance", limiters.general, authenticate, async (req, res, next) => {
  try {
    const walletService = new MobileWalletService(req.prisma);
    const result = await walletService.getWalletBalance(req.user.sub);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Push Notifications
 */
router.post("/notifications/push", limiters.general, authenticate, async (req, res, next) => {
  try {
    const notificationService = new PushNotificationService(req.prisma);
    const result = await notificationService.sendPushNotification(req.user.sub, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Multi-Factor Authentication
 */
router.post(
  "/auth/mfa/totp/enable",
  limiters.auth,
  authenticate,
  auditLog,
  async (req, res, next) => {
    try {
      const mfaService = new MultiFactorAuthService(req.prisma);
      const result = await mfaService.enableTOTP(req.user.sub);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.post("/auth/mfa/verify", limiters.auth, authenticate, async (req, res, next) => {
  try {
    const mfaService = new MultiFactorAuthService(req.prisma);
    const result = await mfaService.verifyTOTP(req.user.sub, req.body.token);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Advanced Search
 */
router.get("/search/shipments", limiters.general, authenticate, async (req, res, next) => {
  try {
    const searchService = new AdvancedSearchService();
    const result = await searchService.searchShipments(req.query.q, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/search/autocomplete", limiters.general, authenticate, async (req, res, next) => {
  try {
    const searchService = new AdvancedSearchService();
    const result = await searchService.autocomplete(req.query.q, req.query.category);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Webhooks
 */
router.post(
  "/webhooks/register",
  limiters.general,
  authenticate,
  requireScope("webhooks:manage"),
  auditLog,
  async (req, res, next) => {
    try {
      const webhookService = new WebhookSystemService(req.prisma);
      const result = await webhookService.registerWebhook(req.user.sub, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.get("/webhooks", limiters.general, authenticate, async (req, res, next) => {
  try {
    const webhookService = new WebhookSystemService(req.prisma);
    const result = await webhookService.listWebhooks(req.user.sub);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Email Templates
 */
router.post("/email/send", limiters.general, authenticate, async (req, res, next) => {
  try {
    const emailService = new EmailTemplatingService();
    const result = await emailService.queueEmail(
      req.body.email,
      req.body.template,
      req.body.variables,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * SMS Notifications
 */
router.post("/sms/send", limiters.general, authenticate, async (req, res, next) => {
  try {
    const smsService = new SMSNotificationService(req.prisma);
    const result = await smsService.sendSMS(req.body.phoneNumber, req.body.message);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Admin Dashboard
 */
router.get(
  "/admin/dashboard",
  limiters.general,
  authenticate,
  requireScope("admin:dashboard"),
  async (req, res, next) => {
    try {
      const adminService = new AdminDashboardService(req.prisma);
      const result = await adminService.getDashboardOverview();
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/admin/users",
  limiters.general,
  authenticate,
  requireScope("admin:users"),
  async (req, res, next) => {
    try {
      const adminService = new AdminDashboardService(req.prisma);
      const result = await adminService.getUserManagementData(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Content Management
 */
router.get("/content", limiters.general, async (req, res, next) => {
  try {
    const cmsService = new ContentManagementService(req.prisma);
    const result = await cmsService.getAllContent(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/content/featured", limiters.general, async (req, res, next) => {
  try {
    const cmsService = new ContentManagementService(req.prisma);
    const result = await cmsService.getFeaturedContent();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * API Versioning
 */
router.get("/versions", limiters.general, async (req, res, next) => {
  try {
    const versionService = new APIVersioningService();
    const result = versionService.listAllVersions();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/versions/:version", limiters.general, async (req, res, next) => {
  try {
    const versionService = new APIVersioningService();
    const result = versionService.getVersionInfo(req.params.version);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
