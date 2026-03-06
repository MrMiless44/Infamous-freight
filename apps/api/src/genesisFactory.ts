import { createGenesis } from "@infamous/genesis";

export function makeGenesis(auth: { tenantId: string; sub: string; role: any }) {
  return createGenesis({
    mode: "server",
    tenantId: auth.tenantId,
    userId: auth.sub,
    role: auth.role,
    alerts: {
      async getShipmentTelemetry() {
        return [];
      },
    },
  });
}
