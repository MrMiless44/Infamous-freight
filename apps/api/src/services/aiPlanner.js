/**
 * Deterministic planner: converts a natural command into tool calls.
 * Safe defaults: only creates/updates shipments + sends notifications when explicitly asked.
 */

function parseCreateShipment(command) {
  // Example: "create shipment from Dallas to Houston"
  const m = command.match(/create shipment from (.+?) to (.+)$/i);
  if (!m) return null;
  return { origin: m[1].trim(), destination: m[2].trim() };
}

function parseUpdateShipment(command) {
  // Example: "set shipment <id> to IN_TRANSIT"
  const m = command.match(/set shipment ([a-z0-9-]+) to ([a-z_]+)$/i);
  if (!m) return null;
  return { shipmentId: m[1].trim(), status: m[2].trim().toUpperCase() };
}

function parseNotify(command) {
  // Example: "notify me shipment created"
  if (!/notify/i.test(command)) return null;
  return { templateType: "urgentAlert", data: { message: command } };
}

function planFromCommand(commandRaw) {
  const command = String(commandRaw || "").trim();
  if (!command) return { tools: [] };

  const tools = [];

  const create = parseCreateShipment(command);
  if (create) {
    tools.push({ name: "create_shipment", arguments: create });
  }

  const upd = parseUpdateShipment(command);
  if (upd) {
    tools.push({ name: "update_shipment", arguments: upd });
  }

  const note = parseNotify(command);
  if (note) {
    tools.push({ name: "notify_user", arguments: note });
  }

  return { tools };
}

module.exports = { planFromCommand };
