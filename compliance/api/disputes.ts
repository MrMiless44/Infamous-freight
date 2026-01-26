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

export const disputesApi = {
  create: (input: DisputeCreateInput): DisputeRecord => {
    return {
      id: 'dispute_0000000000',
      userId: input.userId,
      transactionId: input.transactionId,
      processor: input.processor,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
  },
  get: (id: string): DisputeRecord => {
    return {
      id,
      userId: 'user_0000000000',
      transactionId: 'txn_0000000000',
      processor: 'stripe',
      status: 'under_review',
      createdAt: new Date().toISOString(),
    };
  },
  update: (id: string, input: DisputeUpdateInput): DisputeRecord => {
    return {
      id,
      userId: 'user_0000000000',
      transactionId: 'txn_0000000000',
      processor: 'stripe',
      status: input.status,
      createdAt: new Date().toISOString(),
    };
  },
};
