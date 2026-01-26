export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const createAuditLogEntry = (input: Omit<AuditLogEntry, 'id' | 'createdAt'>): AuditLogEntry => {
  return {
    id: 'audit_0000000000',
    actor: input.actor,
    action: input.action,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };
};
