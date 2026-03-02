const pushNotificationService = require("../../services/pushNotificationService");

/**
 * Tool: notify_user
 * args: { userId?, templateType, data?, clickTarget?, type? }
 */
async function notifyUserTool(ctx, args) {
  const { actor } = ctx;
  const userId = args?.userId ? String(args.userId) : actor.userId;

  const notification = {
    type: args?.type ? String(args.type) : "ai",
    templateType: String(args?.templateType || "urgentAlert"),
    data:
      args?.data && typeof args.data === "object"
        ? args.data
        : { message: String(args?.message || "Update") },
    clickTarget: args?.clickTarget ? String(args.clickTarget) : "/shipments",
  };

  const result = await pushNotificationService.sendToDriver(userId, notification);
  return { userId, notification, result };
}

/**
 * Tool: notify_driver
 * In your system, drivers can be users too. This maps to sendToDriver(userId,...)
 * args: { driverUserId, templateType, data?, clickTarget?, type? }
 */
async function notifyDriverTool(ctx, args) {
  const driverUserId = String(args?.driverUserId || "").trim();
  if (!driverUserId) throw new Error("notify_driver requires driverUserId");

  const notification = {
    type: args?.type ? String(args.type) : "ai",
    templateType: String(args?.templateType || "urgentAlert"),
    data:
      args?.data && typeof args.data === "object"
        ? args.data
        : { message: String(args?.message || "Update") },
    clickTarget: args?.clickTarget ? String(args.clickTarget) : "/shipments",
  };

  const result = await pushNotificationService.sendToDriver(driverUserId, notification);
  return { driverUserId, notification, result };
}

module.exports = { notifyUserTool, notifyDriverTool };
