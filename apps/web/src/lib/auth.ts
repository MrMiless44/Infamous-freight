export function getDemoAuth() {
  return {
    token: process.env.DEMO_JWT ?? "PASTE_A_JWT_HERE",
    tenantId: process.env.DEMO_TENANT ?? "PASTE_TENANT_ID_HERE"
  };
}
