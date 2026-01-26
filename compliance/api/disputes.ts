export type DisputeStatus = 'open' | 'under_review' | 'approved' | 'denied';

export interface DisputeRecord {
  id: string;
  userId: string;
  transactionId: string;
  processor: string;
  status: DisputeStatus;
  createdAt: string;
}

export interface DisputeCreateInput {
  userId: string;
  transactionId: string;
  processor: string;
}

export interface DisputeUpdateInput {
  status: DisputeStatus;
}

const disputesStore = new Map<string, DisputeRecord>();

export const disputesApi = {
  create: (input: DisputeCreateInput): DisputeRecord => {
    const id =
      'dispute_' +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);

    const record: DisputeRecord = {
      id,
      userId: input.userId,
      transactionId: input.transactionId,
      processor: input.processor,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    disputesStore.set(id, record);

    return record;
  },
  get: (id: string): DisputeRecord => {
    const record = disputesStore.get(id);
    if (!record) {
      throw new Error(`Dispute with id ${id} not found`);
    }
    return record;
  },
  update: (id: string, input: DisputeUpdateInput): DisputeRecord => {
    const existing = disputesStore.get(id);
    if (!existing) {
      throw new Error(`Dispute with id ${id} not found`);
    }

    const updated: DisputeRecord = {
      ...existing,
      status: input.status,
    };

    disputesStore.set(id, updated);

    return updated;
  },
};
