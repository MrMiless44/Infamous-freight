/**
 * Role-Based Access Control (RBAC) Types & Constants
 * Defines all roles, permissions, and their relationships
 */

export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  DISPATCH = "DISPATCH",
  DRIVER = "DRIVER",
  BILLING = "BILLING",
  VIEWER = "VIEWER",
}

export enum Permission {
  // User Management
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",

  // Shipment Management
  SHIPMENT_CREATE = "shipment:create",
  SHIPMENT_READ = "shipment:read",
  SHIPMENT_UPDATE = "shipment:update",
  SHIPMENT_ASSIGN = "shipment:assign",
  SHIPMENT_DELETE = "shipment:delete",

  // Dispatch
  DISPATCH_CREATE = "dispatch:create",
  DISPATCH_READ = "dispatch:read",
  DISPATCH_UPDATE = "dispatch:update",
  DISPATCH_CANCEL = "dispatch:cancel",

  // Driver Management
  DRIVER_CREATE = "driver:create",
  DRIVER_READ = "driver:read",
  DRIVER_UPDATE = "driver:update",
  DRIVER_DELETE = "driver:delete",
  DRIVER_VIEW_ALL = "driver:view_all",

  // Billing
  BILLING_READ = "billing:read",
  BILLING_UPDATE = "billing:update",
  BILLING_EXPORT = "billing:export",

  // Queue/Agent Management
  QUEUE_MANAGE = "queue:manage",
  QUEUE_VIEW = "queue:view",
  AGENT_TRIGGER = "agent:trigger",

  // System
  ADMIN_PANEL = "admin:panel",
  AUDIT_LOG_READ = "audit:log:read",
  SETTINGS_MANAGE = "settings:manage",
}

/**
 * Role-to-Permissions mapping
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // Full access
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.SHIPMENT_CREATE,
    Permission.SHIPMENT_READ,
    Permission.SHIPMENT_UPDATE,
    Permission.SHIPMENT_ASSIGN,
    Permission.SHIPMENT_DELETE,
    Permission.DISPATCH_CREATE,
    Permission.DISPATCH_READ,
    Permission.DISPATCH_UPDATE,
    Permission.DISPATCH_CANCEL,
    Permission.DRIVER_CREATE,
    Permission.DRIVER_READ,
    Permission.DRIVER_UPDATE,
    Permission.DRIVER_DELETE,
    Permission.DRIVER_VIEW_ALL,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.BILLING_EXPORT,
    Permission.QUEUE_MANAGE,
    Permission.QUEUE_VIEW,
    Permission.AGENT_TRIGGER,
    Permission.ADMIN_PANEL,
    Permission.AUDIT_LOG_READ,
    Permission.SETTINGS_MANAGE,
  ],

  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.SHIPMENT_CREATE,
    Permission.SHIPMENT_READ,
    Permission.SHIPMENT_UPDATE,
    Permission.SHIPMENT_ASSIGN,
    Permission.DISPATCH_CREATE,
    Permission.DISPATCH_READ,
    Permission.DISPATCH_UPDATE,
    Permission.DISPATCH_CANCEL,
    Permission.DRIVER_CREATE,
    Permission.DRIVER_READ,
    Permission.DRIVER_UPDATE,
    Permission.DRIVER_DELETE,
    Permission.DRIVER_VIEW_ALL,
    Permission.BILLING_READ,
    Permission.QUEUE_MANAGE,
    Permission.QUEUE_VIEW,
    Permission.AGENT_TRIGGER,
    Permission.AUDIT_LOG_READ,
  ],

  [UserRole.DISPATCH]: [
    Permission.SHIPMENT_READ,
    Permission.SHIPMENT_UPDATE,
    Permission.SHIPMENT_ASSIGN,
    Permission.DISPATCH_CREATE,
    Permission.DISPATCH_READ,
    Permission.DISPATCH_UPDATE,
    Permission.DISPATCH_CANCEL,
    Permission.DRIVER_READ,
    Permission.DRIVER_VIEW_ALL,
    Permission.QUEUE_VIEW,
    Permission.AGENT_TRIGGER,
    Permission.AUDIT_LOG_READ,
  ],

  [UserRole.DRIVER]: [
    Permission.SHIPMENT_READ,
    Permission.DRIVER_READ,
    Permission.DRIVER_UPDATE,
    Permission.AUDIT_LOG_READ,
  ],

  [UserRole.BILLING]: [
    Permission.SHIPMENT_READ,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.BILLING_EXPORT,
    Permission.AUDIT_LOG_READ,
  ],

  [UserRole.VIEWER]: [
    Permission.SHIPMENT_READ,
    Permission.DRIVER_READ,
    Permission.BILLING_READ,
    Permission.AUDIT_LOG_READ,
  ],
};

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role has permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/**
 * JWT Claims with RBAC
 */
export interface JWTClaims {
  sub: string; // user ID
  email: string;
  role: UserRole;
  permissions: Permission[];
  org_id?: string;
  iat: number;
  exp: number;
}

/**
 * Resource ownership context
 */
export interface ResourceContext {
  resourceOwnerId?: string; // user ID who created/owns resource
  organizationId?: string; // org context
  teamId?: string; // team context
}

/**
 * Check if user can access resource (ownership or role-based)
 */
export function canAccessResource(
  user: JWTClaims,
  requiredPermission: Permission,
  context: ResourceContext,
): boolean {
  // Check permission
  if (!user.permissions.includes(requiredPermission)) {
    return false;
  }

  // Admin+ can access anything
  if ([UserRole.OWNER, UserRole.ADMIN].includes(user.role)) {
    return true;
  }

  // For non-admins, check ownership if applicable
  if (context.resourceOwnerId && context.resourceOwnerId !== user.sub) {
    // User doesn't own this resource and isn't admin
    return false;
  }

  return true;
}
