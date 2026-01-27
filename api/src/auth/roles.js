// Lightweight RBAC role and permission mapping

/** @type {('OWNER'|'ADMIN'|'DISPATCHER'|'DRIVER'|'BILLING'|'READ_ONLY'|'SHIPPER'|'SYSTEM')} */
// Exported as JSDoc for IDE support

const rolePermissions = {
    OWNER: [
        "job:create",
        "job:view",
        "job:cancel",
        "job:accept",
        "job:pickup",
        "job:deliver",
        "offer:fanout",
        "offer:accept",
        "payout:run",
        "admin:ops",
        "billing:manage",
        "user:manage",
    ],
    SHIPPER: ["job:create", "job:view", "job:cancel"],
    DRIVER: ["job:view", "job:accept", "job:pickup", "job:deliver", "offer:accept"],
    DISPATCHER: ["job:create", "job:view", "job:cancel", "job:assign"],
    BILLING: ["job:view", "billing:manage", "payout:run"],
    READ_ONLY: ["job:view", "audit:view"],
    ADMIN: [
        "job:create",
        "job:view",
        "job:cancel",
        "job:accept",
        "job:pickup",
        "job:deliver",
        "offer:fanout",
        "offer:accept",
        "payout:run",
        "admin:ops",
    ],
    SYSTEM: ["offer:fanout", "payout:run"],
};

function hasPerm(role, perm) {
    return Array.isArray(rolePermissions[role]) && rolePermissions[role].includes(perm);
}

module.exports = {
    rolePermissions,
    hasPerm,
};
