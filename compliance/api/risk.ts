export interface RiskScore {
  id: string;
  userId: string;
  score: number;
  factors: Record<string, unknown>;
  createdAt: string;
}

export interface RiskScoreInput {
  userId: string;
  factors: Record<string, unknown>;
}

export const riskApi = {
  score: (input: RiskScoreInput): RiskScore => {
    return {
      id: 'risk_0000000000',
      userId: input.userId,
      score: 0.42,
      factors: input.factors,
      createdAt: new Date().toISOString(),
    };
  },
  getByUser: (userId: string): RiskScore => {
    return {
      id: 'risk_0000000000',
      userId,
      score: 0.42,
      factors: {
        deviceFingerprint: 'verified',
        ipReputation: 'neutral',
        kycStatus: 'approved',
      },
      createdAt: new Date().toISOString(),
    };
  },
};
