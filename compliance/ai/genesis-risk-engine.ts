const HIGH_VALUE_TRANSACTION_THRESHOLD = 5000;
const HIGH_VALUE_TRANSACTION_RISK_POINTS = 30;
const UNVERIFIED_KYC_RISK_POINTS = 50;
const IP_MISMATCH_RISK_POINTS = 20;
const HIGH_RISK_LEVEL_THRESHOLD = 70;
const MEDIUM_RISK_LEVEL_THRESHOLD = 40;

export function calculateRisk(transaction: any, user: any) {
  let score = 0;

  if (transaction.amount > HIGH_VALUE_TRANSACTION_THRESHOLD) {
    score += HIGH_VALUE_TRANSACTION_RISK_POINTS;
  }
  if (!user.kycVerified) {
    score += UNVERIFIED_KYC_RISK_POINTS;
  }
  if (transaction.ipMismatch) {
    score += IP_MISMATCH_RISK_POINTS;
  }

  return {
    score,
    level:
      score > HIGH_RISK_LEVEL_THRESHOLD
        ? "HIGH"
        : score > MEDIUM_RISK_LEVEL_THRESHOLD
          ? "MEDIUM"
          : "LOW",
  };
}
