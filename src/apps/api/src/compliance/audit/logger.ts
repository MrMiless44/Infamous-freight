export interface AuditLogEntry {
  action: string;
  createdAt: Date;
  metadata: AuditLogMetadata;
}

export interface AuditLogInput {
  action: string;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

export type AuditLogMetadata = Record<string, string | number | boolean | null>;

export const MAX_AUDIT_LOGS = Math.max(
  0,
  Number.parseInt(process.env.MAX_AUDIT_LOGS ?? "500", 10) || 500,
);

const MAX_METADATA_KEYS = 20;
const MAX_STRING_LENGTH = 200;
const MAX_ARRAY_LENGTH = 20;

const ALLOWED_METADATA_KEYS = new Set([
  "action",
  "actorId",
  "correlationId",
  "durationMs",
  "entityId",
  "entityType",
  "errorCode",
  "ip",
  "method",
  "organizationId",
  "path",
  "reason",
  "requestId",
  "resource",
  "resourceId",
  "resourceType",
  "status",
  "userAgent",
  "userId",
]);

const REDACTED_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "ssn",
  "socialSecurityNumber",
  "creditCard",
  "cardNumber",
  "cvv",
  "email",
  "phone",
  "address",
]);

const logs: AuditLogEntry[] = [];

function sanitizeMetadata(
  metadata: Record<string, unknown> | null | undefined,
): AuditLogMetadata {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const sanitized: AuditLogMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (sanitized && Object.keys(sanitized).length >= MAX_METADATA_KEYS) {
      break;
    }

    if (REDACTED_KEYS.has(key)) {
      continue;
    }

    if (!ALLOWED_METADATA_KEYS.has(key)) {
      continue;
    }

    const sanitizedValue = sanitizeValue(value);
    if (sanitizedValue !== undefined) {
      sanitized[key] = sanitizedValue;
    }
  }

  return sanitized;
}

function sanitizeValue(
  value: unknown,
): string | number | boolean | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const truncated = value.slice(0, MAX_ARRAY_LENGTH);
    const stringified = truncated.map((entry) => {
      if (typeof entry === "string") {
        return truncateString(entry);
      }
      if (typeof entry === "number" || typeof entry === "boolean") {
        return String(entry);
      }
      return "[unsupported]";
    });
    return truncateString(stringified.join(","));
  }

  try {
    return truncateString(JSON.stringify(value));
  } catch {
    return "[unserializable]";
  }
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return value.slice(0, MAX_STRING_LENGTH);
}

function sanitizeAction(action: string): string {
  if (typeof action !== "string") {
    return "";
  }
  return truncateString(action);
}

function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

export function recordAuditLog(entry: AuditLogInput): AuditLogEntry {
  const sanitizedMetadata = sanitizeMetadata(entry.metadata);
  const createdAt = isValidDate(entry.createdAt)
    ? entry.createdAt
    : new Date();
  const logEntry: AuditLogEntry = {
    action: entry.action,
    createdAt,
    metadata: sanitizedMetadata,
  };

  logs.push(logEntry);
  while (logs.length > MAX_AUDIT_LOGS) {
    logs.shift();
  }

  return logEntry;
}

export function getAuditLogs(): AuditLogEntry[] {
  return [...logs];
}
