export type GenesisOutput = {
  confidence: number; // 0..100
  impact: {
    timeSavedMinutes?: number;
    marginDeltaUsd?: number;
    riskDelta?: "lower" | "higher" | "neutral";
  };
  why: string[]; // 2-3 bullets
  actions: Array<{
    label: "Apply" | "Review" | "Dismiss";
    actionId: string;
  }>;
};
