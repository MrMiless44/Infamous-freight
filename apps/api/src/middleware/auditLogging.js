/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Audit Log Middleware - Track data mutations with before/after values
 *
 * Uses Prisma $use hook to capture CREATE, UPDATE, DELETE operations
 * Stores complete audit trail for compliance and forensics
 */

const { prisma } = require("../db");
const { logger } = require("./logger");

// Operations to audit
const AUDITABLE_OPERATIONS = ["create", "update", "delete"];

// Models to audit (can be expanded)
const AUDITABLE_MODELS = [
  "Shipment",
  "ShipmentTracking",
  "User",
  "Organization",
  "BillingRecord",
  "Invoice",
  "PaymentMethod",
  "Webhook",
  "ApiKey",
];

/**
 * Transform Prisma model name to lowercase for storage
 * Shipment -> shipments
 */
function getModelName(model) {
  return model.charAt(0).toLowerCase() + model.slice(1).toLowerCase() + "s";
}

/**
 * Capture before/after values for UPDATE operations
 */
async function captureUpdateChanges(model, whereClause, updateData) {
  try {
    // Fetch current record
    const before = await prisma[model].findUnique({
      where: whereClause,
    });

    if (!before) return null;

    // Calculate changes
    const changes = {};
    Object.keys(updateData || {}).forEach((field) => {
      const oldVal = before[field];
      const newVal = updateData[field];
      if (oldVal !== newVal) {
        changes[field] = [oldVal, newVal];
      }
    });

    return changes;
  } catch (err) {
    logger.error("Failed to capture update changes", { error: err.message });
    return null;
  }
}

/**
 * Write audit log entry
 */
async function writeAuditLog(
  action,
  model,
  resourceId,
  userId,
  changes = null,
  organizationId = null,
) {
  try {
    await prisma.AuditLog.create({
      data: {
        action: action.toUpperCase(),
        resource: getModelName(model),
        resourceId,
        userId,
        organizationId,
        changes: changes ? JSON.stringify(changes) : null,
        timestamp: new Date(),
      },
    }).catch((err) => {
      // If AuditLog table doesn't exist, log warning but don't fail
      if (err.message.includes("AuditLog") || err.message.includes("audit")) {
        logger.warn("AuditLog table not found, audit logging disabled");
        return null;
      }
      throw err;
    });
  } catch (err) {
    logger.error("Failed to write audit log", {
      error: err.message,
      resource: model,
      action,
    });
    // Non-blocking: don't fail request if audit fails
  }
}

/**
 * Initialize Prisma audit logging middleware
 * Should be called after Prisma client initialization but before routes
 */
function initializeAuditLogging(prismaClient) {
  prismaClient.$use(async (params, next) => {
    // Execute the actual query
    const result = await next(params);

    // Only audit specific operations and models
    if (!AUDITABLE_OPERATIONS.includes(params.action)) {
      return result;
    }

    if (!AUDITABLE_MODELS.includes(params.model)) {
      return result;
    }

    try {
      // Extract resource ID based on model
      let resourceId = null;
      if (params.action === "delete" && params.args.where) {
        resourceId = params.args.where.id || Object.values(params.args.where)[0];
      } else if (params.action === "update" && params.args.where) {
        resourceId = params.args.where.id || Object.values(params.args.where)[0];
      } else if (params.action === "create") {
        resourceId = result.id || null;
      }

      // Capture changes for UPDATE operations
      let changes = null;
      if (params.action === "update") {
        changes = await captureUpdateChanges(params.model, params.args.where, params.args.data);
      }

      // Extract user ID from context (if available)
      const userId = global.currentUserId || "system";
      const organizationId = global.currentOrganizationId || null;

      // Write audit log (non-blocking)
      setImmediate(() => {
        writeAuditLog(params.action, params.model, resourceId, userId, changes, organizationId);
      });
    } catch (err) {
      logger.error("Audit logging failed", { error: err.message });
    }

    return result;
  });
}

/**
 * Middleware to set audit context (user ID, organization ID)
 * Should be placed after authentication middleware
 */
function auditContextMiddleware(req, res, next) {
  // Set global context for Prisma middleware
  global.currentUserId = req.user?.sub || "system";
  global.currentOrganizationId = req.auth?.organizationId || null;
  next();
}

module.exports = {
  initializeAuditLogging,
  auditContextMiddleware,
  writeAuditLog,
};
