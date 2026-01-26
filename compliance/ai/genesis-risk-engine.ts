export interface GenesisRiskInput {
  transactionId: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  sessionAnomalies: string[];
}

export interface GenesisRiskOutput {
  riskScore: number;
  enforcementRecommendation: 'none' | 'monitor' | 'restrict' | 'suspend';
  alerts: string[];
  auditEntries: string[];
}

const clampScore = (value: number): number => Math.max(0, Math.min(1, value));

export const evaluateGenesisRisk = (input: GenesisRiskInput): GenesisRiskOutput => {
  const alerts: string[] = [];
  let score = 0.15;

  if (input.kycStatus !== 'approved') {
    alerts.push('KYC status is not approved.');
    score += 0.35;
  }

  if (input.sessionAnomalies.length > 0) {
    alerts.push('Session anomalies detected.');
    score += Math.min(0.25, input.sessionAnomalies.length * 0.05);
  }

  if (input.ipAddress.startsWith('0.0.0.')) {
    alerts.push('IP address flagged as invalid.');
    score += 0.2;
  }

  const riskScore = clampScore(score);
  const enforcementRecommendation =
    riskScore >= 0.85
      ? 'suspend'
      : riskScore >= 0.65
        ? 'restrict'
        : riskScore >= 0.4
          ? 'monitor'
          : 'none';

  return {
    riskScore,
    enforcementRecommendation,
    alerts,
    auditEntries: [
      `Genesis AI evaluated transaction ${input.transactionId} for user ${input.userId}.`,
      `Risk score: ${riskScore.toFixed(2)}.`,
    ],
  };
};
