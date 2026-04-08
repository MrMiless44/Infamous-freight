import { createRequire } from "node:module";

import { logger } from "../lib/logger.js";

const require = createRequire(import.meta.url);

let warnedLegacyUnavailable = false;

type LegacyEmailService = {
  sendEmail?: (...args: any[]) => Promise<any>;
  sendShipmentNotification?: (...args: any[]) => Promise<any>;
  sendDriverAssignment?: (...args: any[]) => Promise<any>;
  sendAdminAlert?: (...args: any[]) => Promise<any>;
  sendBatch?: (...args: any[]) => Promise<any>;
};

function loadLegacy(): LegacyEmailService {
  try {
    return require("./emailService.cjs") as LegacyEmailService;
  } catch (error: any) {
    if (error?.code === "MODULE_NOT_FOUND") {
      if (!warnedLegacyUnavailable) {
        warnedLegacyUnavailable = true;
        logger.warn(
          { reason: error.message },
          "Legacy email service unavailable; email operations are no-op",
        );
      }
      return {};
    }

    throw error;
  }
}

export async function sendEmail(...args: any[]): Promise<any> {
  const legacy = loadLegacy();
  return legacy.sendEmail ? legacy.sendEmail(...args) : null;
}

export async function sendShipmentNotification(...args: any[]): Promise<any> {
  const legacy = loadLegacy();
  return legacy.sendShipmentNotification ? legacy.sendShipmentNotification(...args) : null;
}

export async function sendDriverAssignment(...args: any[]): Promise<any> {
  const legacy = loadLegacy();
  return legacy.sendDriverAssignment ? legacy.sendDriverAssignment(...args) : null;
}

export async function sendAdminAlert(...args: any[]): Promise<any> {
  const legacy = loadLegacy();
  return legacy.sendAdminAlert ? legacy.sendAdminAlert(...args) : null;
}

export async function sendBatch(...args: any[]): Promise<any> {
  const legacy = loadLegacy();
  return legacy.sendBatch ? legacy.sendBatch(...args) : null;
}

export default {
  sendEmail,
  sendShipmentNotification,
  sendDriverAssignment,
  sendAdminAlert,
  sendBatch,
};
