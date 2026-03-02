const { randomUUID } = require("crypto");
const {
  validateShipmentUpdate,
  logStatusChange,
} = require("../../services/shipmentValidator");
const { emitShipmentUpdate } = require("../../services/websocket");

/**
 * Tool: create_shipment
 * args: { origin, destination, trackingId?, reference?, driverId? }
 */
async function createShipmentTool(ctx, args) {
  const { prisma, actor } = ctx;
  const origin = String(args?.origin || "").trim();
  const destination = String(args?.destination || "").trim();
  const driverId = args?.driverId ? String(args.driverId) : null;

  if (!origin || !destination) {
    throw new Error("create_shipment requires origin and destination");
  }

  const reference = args?.reference ? String(args.reference) : null;
  const trackingId = args?.trackingId
    ? String(args.trackingId)
    : reference || `TRK-${randomUUID().replace(/-/g, "").slice(0, 12)}`;

  const shipment = await prisma.shipment.create({
    data: {
      trackingId,
      reference: reference || trackingId,
      userId: actor.userId,
      origin,
      destination,
      driverId,
      status: "CREATED",
    },
    include: {
      driver: { select: { id: true, name: true, phone: true, status: true } },
    },
  });

  // Emit websocket update (best-effort)
  try {
    emitShipmentUpdate(shipment.id, { type: "created", shipment });
  } catch (_) {}

  return {
    shipmentId: shipment.id,
    trackingId: shipment.trackingId,
    status: shipment.status,
  };
}

/**
 * Tool: update_shipment
 * args: { shipmentId, status?, driverId? }
 */
async function updateShipmentTool(ctx, args) {
  const { prisma, actor } = ctx;
  const shipmentId = String(args?.shipmentId || "").trim();
  if (!shipmentId) throw new Error("update_shipment requires shipmentId");

  const existing = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, userId: true, status: true, driverId: true, trackingId: true },
  });

  if (!existing) throw new Error("Shipment not found");

  // Safety: AI can only mutate shipments owned by the actor unless you add admin-mode later
  if (existing.userId !== actor.userId) {
    throw new Error("Forbidden: cannot modify shipment not owned by actor");
  }

  const updates = {};
  if (args?.status !== undefined) updates.status = String(args.status);
  if (args?.driverId !== undefined) updates.driverId = args.driverId ? String(args.driverId) : null;

  const validation = validateShipmentUpdate(existing, updates);
  if (!validation.valid) {
    throw new Error(`Invalid shipment transition: ${validation.errors.join(", ")}`);
  }

  const shipment = await prisma.shipment.update({
    where: { id: shipmentId },
    data: updates,
    include: {
      driver: { select: { id: true, name: true, phone: true, status: true } },
    },
  });

  // Audit trail (best-effort)
  if (updates.status) {
    try {
      logStatusChange({
        shipmentId: shipment.id,
        fromStatus: existing.status,
        toStatus: updates.status,
        userId: actor.userId,
        reason: "AI tool update",
      });
    } catch (_) {}
  }

  // Emit websocket update (best-effort)
  try {
    emitShipmentUpdate(shipment.id, { type: "updated", shipment, changes: updates });
  } catch (_) {}

  return {
    shipmentId: shipment.id,
    trackingId: shipment.trackingId,
    status: shipment.status,
  };
}

module.exports = { createShipmentTool, updateShipmentTool };
