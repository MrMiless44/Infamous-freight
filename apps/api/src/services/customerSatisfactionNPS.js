// apps/api/src/services/customerSatisfactionNPS.js

class CustomerSatisfactionNPSService {
  /**
   * Net Promoter Score (NPS) and customer satisfaction tracking
   */

  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Send post-delivery NPS survey
   */
  async sendNPSSurvey(shipmentId, customerId) {
    const survey = {
      shipmentId,
      customerId,
      type: "nps_post_delivery",
      questions: [
        {
          id: 1,
          text: "How likely are you to recommend us to a friend?",
          type: "scale",
          scale: [0, 10],
        },
        {
          id: 2,
          text: "What was your experience like?",
          type: "text",
          optional: false,
        },
        {
          id: 3,
          text: "How satisfied were you with delivery time?",
          type: "scale",
          scale: [1, 5],
        },
        {
          id: 4,
          text: "How satisfied were you with package condition?",
          type: "scale",
          scale: [1, 5],
        },
        {
          id: 5,
          text: "Would you use our service again?",
          type: "yes_no",
        },
      ],
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: "pending",
    };

    return survey;
  }

  /**
   * Process survey response
   */
  async processSurveyResponse(surveyId, responses) {
    const npsScore = responses.find((r) => r.questionId === 1)?.value;

    // Classify respondent
    let respondentType;
    if (npsScore >= 9) {
      respondentType = "PROMOTER";
    } else if (npsScore >= 7) {
      respondentType = "PASSIVE";
    } else {
      respondentType = "DETRACTOR";
    }

    const feedback = {
      npsScore,
      respondentType,
      responses,
      sentiment: this.analyzeSentiment(responses),
      actionItems: this.identifyActionItems(responses),
      createdAt: new Date(),
    };

    return feedback;
  }

  /**
   * Analyze sentiment from text response
   */
  analyzeSentiment(responses) {
    const textResponse = responses.find((r) => r.type === "text")?.value || "";

    const positive = [
      "excellent",
      "great",
      "amazing",
      "fantastic",
      "perfect",
      "satisfied",
      "happy",
    ];
    const negative = ["bad", "poor", "terrible", "slow", "damaged", "unsatisfied", "angry"];

    const positiveCount = positive.filter((word) =>
      textResponse.toLowerCase().includes(word),
    ).length;
    const negativeCount = negative.filter((word) =>
      textResponse.toLowerCase().includes(word),
    ).length;

    if (positiveCount > negativeCount) return "POSITIVE";
    if (negativeCount > positiveCount) return "NEGATIVE";
    return "NEUTRAL";
  }

  /**
   * Identify action items from feedback
   */
  identifyActionItems(responses) {
    const actions = [];
    const textResponse = responses.find((r) => r.type === "text")?.value || "";

    if (textResponse.toLowerCase().includes("slow")) {
      actions.push({ type: "DELIVERY_TIME", priority: "MEDIUM" });
    }
    if (textResponse.toLowerCase().includes("damaged")) {
      actions.push({ type: "PACKAGING", priority: "HIGH" });
    }
    if (textResponse.toLowerCase().includes("driver")) {
      actions.push({ type: "DRIVER_TRAINING", priority: "MEDIUM" });
    }

    return actions;
  }

  /**
   * Calculate NPS score (0-100)
   */
  calculateNPS(surveys) {
    const promoters = surveys.filter((s) => s.npsScore >= 9).length;
    const detractors = surveys.filter((s) => s.npsScore <= 6).length;
    const total = surveys.length;

    return ((promoters - detractors) / total) * 100;
  }

  /**
   * Get satisfaction metrics
   */
  async getSatisfactionMetrics(timeRange = "30d") {
    // Mock data - in production use prisma queries with date filtering
    const surveys = [
      { npsScore: 9, respondentType: "PROMOTER", sentiment: "POSITIVE" },
      { npsScore: 8, respondentType: "PASSIVE", sentiment: "POSITIVE" },
      { npsScore: 6, respondentType: "DETRACTOR", sentiment: "NEGATIVE" },
    ];

    const npsScore = this.calculateNPS(surveys);
    const promoterPercentage =
      (surveys.filter((s) => s.respondentType === "PROMOTER").length / surveys.length) * 100;
    const detractorPercentage =
      (surveys.filter((s) => s.respondentType === "DETRACTOR").length / surveys.length) * 100;

    return {
      npsScore: Math.round(npsScore),
      promoters: Math.round(promoterPercentage),
      passives: Math.round(100 - promoterPercentage - detractorPercentage),
      detractors: Math.round(detractorPercentage),
      respondentCount: surveys.length,
      responseRate: "35%",
      sentiment: {
        positive: 45,
        neutral: 35,
        negative: 20,
      },
    };
  }

  /**
   * Get loyalty segments
   */
  async getLoyaltySegments() {
    return {
      champions: { count: 450, npsScore: "95+", churnRisk: "VERY_LOW" },
      satisfied: { count: 1200, npsScore: "70-95", churnRisk: "LOW" },
      neutral: { count: 800, npsScore: "30-70", churnRisk: "MEDIUM" },
      atrisk: { count: 250, npsScore: "<30", churnRisk: "HIGH" },
    };
  }
}

module.exports = { CustomerSatisfactionNPSService };
