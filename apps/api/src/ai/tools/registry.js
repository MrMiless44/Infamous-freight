/**
 * AI Tool Registry (allowlist)
 * Only tools declared here can be executed by the AI worker.
 */

const { createShipmentTool, updateShipmentTool } = require("./shipments");
const { notifyUserTool, notifyDriverTool } = require("./notifications");

const TOOL_REGISTRY = {
  create_shipment: createShipmentTool,
  update_shipment: updateShipmentTool,
  notify_user: notifyUserTool,
  notify_driver: notifyDriverTool,
};

function listTools() {
  return Object.keys(TOOL_REGISTRY);
}

function getTool(name) {
  return TOOL_REGISTRY[name] || null;
}

module.exports = { listTools, getTool };
