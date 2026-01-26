export type AuditMetadataValue = string | number | boolean | null;

export interface AuditLogEntry {
  message: string;
  metadata: Record<string, AuditMetadataValue>;
  createdAt: Date;
}

export interface AuditLogInput {
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const rawMaxAuditLogs = process.env.MAX_AUDIT_LOGS;
const parsedMaxAuditLogs = rawMaxAuditLogs ? Number(rawMaxAuditLogs) : NaN;

export const MAX_AUDIT_LOGS = Number.isFinite(parsedMaxAuditLogs)
  ? parsedMaxAuditLogs
  : 500;
const ALLOWED_METADATA_KEYS = new Set([
  "action",
  "actorId",
  "actorType",
  "ip",
  "userAgent",
  "organizationId",
  "tenantId",
  "resource",
  "resourceId",
  "requestId",
  "sessionId",
  "status",
  "reason",
  "source",
  "severity",
  "traceId",
  "details",
]);

const PII_KEYS = new Set([
  "email",
  "phone",
  "ssn",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
]);

const MAX_STRING_LENGTH = 256;
const MAX_OBJECT_LENGTH = 512;

const logs: AuditLogEntry[] = [];

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}…`;
};

const sanitizeValue = (key: string, value: unknown): AuditMetadataValue | undefined => {
  if (PII_KEYS.has(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return truncate(value, MAX_STRING_LENGTH);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return null;
  }

  try {
    return truncate(JSON.stringify(value), MAX_OBJECT_LENGTH);
  } catch {
    return "[UNSERIALIZABLE]";
  }
};

const sanitizeMetadata = (
  metadata?: Record<string, unknown>,
): Record<string, AuditMetadataValue> => {
  if (!metadata) {
    return {};
  }

  return Object.entries(metadata).reduce<Record<string, AuditMetadataValue>>(
    (sanitized, [key, value]) => {
      if (!ALLOWED_METADATA_KEYS.has(key)) {
        return sanitized;
      }

      const sanitizedValue = sanitizeValue(key, value);
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }

      return sanitized;
    },
    {},
  );
};

export function recordAuditLog(entry: AuditLogInput): AuditLogEntry {
  const sanitizedMetadata = sanitizeMetadata(entry.metadata);
  const storedEntry: AuditLogEntry = {
    message: entry.message,
    metadata: sanitizedMetadata,
    // Store an internal copy of the Date to prevent external mutation
    createdAt: new Date(entry.createdAt.getTime()),
  };

  logs.push(storedEntry);

  while (logs.length > MAX_AUDIT_LOGS) {
    logs.shift();
  }

  // Return a cloned entry so callers cannot mutate internal log state
  return {
    message: storedEntry.message,
    metadata: { ...storedEntry.metadata },
    createdAt: new Date(storedEntry.createdAt.getTime()),
  };
}

export function getAuditLogs(): AuditLogEntry[] {
  // Return cloned entries to prevent callers from mutating internal state
  return logs.map((entry) => ({
    message: entry.message,
    metadata: { ...entry.metadata },
    createdAt: new Date(entry.createdAt.getTime()),
  }));
}
