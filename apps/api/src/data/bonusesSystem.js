/**
 * Comprehensive Bonus & Rewards System - 2026 Edition
 * Multi-tier rewards, referrals, loyalty, and performance bonuses
 * Supports users, drivers, and customers
 */

const BONUSES_SYSTEM = {
  // ============================================================================
  // REFERRAL BONUS PROGRAM
  // ============================================================================

  referralProgram: {
    active: true,
    description: "Earn rewards for referring new customers and drivers",

    customerReferral: {
      id: "ref_customer",
      name: "Customer Referral Bonus",
      description: "Earn bonus when referred customer completes first shipment",

      referrer: {
        reward: 50.0, // $50 credit
        currency: "USD",
        condition: "Referred customer completes first paid shipment",
        maxMonthly: 5000.0, // $5,000/month cap
      },

      referred: {
        reward: 25.0, // $25 credit
        currency: "USD",
        condition: "Completes first paid shipment",
        validityDays: 30,
      },

      tiers: {
        bronze: {
          level: 1,
          referralsNeeded: 1,
          bonus: 50.0,
          monthlyBonus: 100.0,
        },
        silver: {
          level: 2,
          referralsNeeded: 5,
          bonus: 75.0,
          monthlyBonus: 500.0,
        },
        gold: {
          level: 3,
          referralsNeeded: 10,
          bonus: 100.0,
          monthlyBonus: 1500.0,
        },
        platinum: {
          level: 4,
          referralsNeeded: 20,
          bonus: 150.0,
          monthlyBonus: 3000.0,
        },
      },
    },

    driverReferral: {
      id: "ref_driver",
      name: "Driver Referral Bonus",
      description: "Earn for recruiting new drivers to the network",

      referrer: {
        reward: 100.0, // $100 for recruiting
        currency: "USD",
        condition: "Referred driver completes 10 shipments",
        bonus100Shipments: 250.0, // Extra bonus at 100 shipments
        bonus500Shipments: 500.0, // Extra bonus at 500 shipments
      },

      referred: {
        signupBonus: 50.0,
        firstShipmentBonus: 25.0,
        tenthShipmentBonus: 50.0,
        condition: "Must be active for 30+ days",
      },
    },
  },

  // ============================================================================
  // LOYALTY REWARDS PROGRAM
  // ============================================================================

  loyaltyProgram: {
    active: true,
    description: "Earn points on every shipment and redeem for rewards",
    pointsPerDollar: 1, // 1 point per $1 spent

    tiers: {
      bronze: {
        level: 1,
        pointsNeeded: 0,
        pointsMultiplier: 1.0,
        benefits: ["Earn 1 point per $1", "Birthday bonus: 50 points", "Monthly newsletter"],
        rewardsDiscount: 0.0,
      },

      silver: {
        level: 2,
        pointsNeeded: 1000,
        pointsMultiplier: 1.25,
        monthlyBonus: 100,
        benefits: [
          "Earn 1.25 points per $1",
          "Monthly 100 bonus points",
          "Birthday bonus: 100 points",
          "5% discount on future shipments",
          "Priority customer support",
          "Exclusive email offers",
        ],
        rewardsDiscount: 0.05,
        freeShipments: {
          "50Points": 2.5,
          "100Points": 5.0,
          "250Points": 15.0,
          "500Points": 50.0,
        },
      },

      gold: {
        level: 3,
        pointsNeeded: 5000,
        pointsMultiplier: 1.5,
        monthlyBonus: 250,
        quarterlyBonus: 500,
        benefits: [
          "Earn 1.5 points per $1",
          "Monthly 250 bonus points",
          "Quarterly 500 bonus points",
          "Birthday bonus: 250 points",
          "10% discount on future shipments",
          "Free express shipping (1x/month)",
          "Dedicated account support",
          "Exclusive VIP events",
          "Priority feature access",
        ],
        rewardsDiscount: 0.1,
        freeShipments: {
          "50Points": 3.5,
          "100Points": 7.0,
          "250Points": 20.0,
          "500Points": 75.0,
        },
      },

      platinum: {
        level: 4,
        pointsNeeded: 10000,
        pointsMultiplier: 2.0,
        monthlyBonus: 500,
        quarterlyBonus: 1000,
        annualBonus: 5000,
        benefits: [
          "Earn 2 points per $1",
          "Monthly 500 bonus points",
          "Quarterly 1,000 bonus points",
          "Annual 5,000 bonus points",
          "Birthday bonus: 500 points",
          "15% discount on all shipments",
          "Unlimited free express shipping",
          "Concierge support 24/7",
          "Private management account",
          "Custom integrations",
          "Early access to new features",
          "Invite-only events",
          "Annual $1,000 credit",
        ],
        rewardsDiscount: 0.15,
        freeShipments: {
          "50Points": 5.0,
          "100Points": 10.0,
          "250Points": 30.0,
          "500Points": 100.0,
        },
        annualCredit: 1000.0,
      },
    },

    redemption: {
      minimumPoints: 50,
      maxPointsPerMonth: 5000,
      conversionRate: 0.05, // $0.05 per point
      options: [
        "Account credit",
        "Free shipments",
        "Discount codes",
        "Premium features",
        "Partner rewards",
      ],
    },
  },

  // ============================================================================
  // PERFORMANCE BONUSES - DRIVERS
  // ============================================================================

  driverPerformanceBonus: {
    active: true,
    description: "Bonuses for driver performance metrics",

    deliveryAccuracy: {
      name: "On-Time Delivery Bonus",
      description: "Bonus for maintaining high on-time delivery rate",
      metrics: {
        "99-100%": { bonus: 500.0, interval: "month" },
        "95-98%": { bonus: 250.0, interval: "month" },
        "90-94%": { bonus: 100.0, interval: "month" },
      },
      requirements: {
        minShipments: 50,
        period: "month",
      },
    },

    customerRatings: {
      name: "Customer Satisfaction Bonus",
      description: "Bonus for excellent customer ratings",
      metrics: {
        "4.9-5.0": { bonus: 300.0, interval: "month" },
        "4.7-4.8": { bonus: 150.0, interval: "month" },
        "4.5-4.6": { bonus: 75.0, interval: "month" },
      },
      requirements: {
        minRatings: 20,
        period: "month",
      },
    },

    safetyRecord: {
      name: "Safety Bonus",
      description: "Bonus for accident-free operation",
      metrics: {
        zeroAccidents_3months: 250.0,
        zeroAccidents_6months: 750.0,
        zeroAccidents_12months: 2000.0,
      },
    },

    volumeIncentive: {
      name: "Volume Incentive Bonus",
      description: "Bonus tiers based on monthly shipment volume",
      metrics: {
        "100-250": { bonus: 200.0, percent: 0.02 },
        "251-500": { bonus: 500.0, percent: 0.03 },
        "501-1000": { bonus: 1000.0, percent: 0.04 },
        "1001+": { bonus: 2500.0, percent: 0.05 },
      },
    },

    referralBonus: {
      name: "Driver Recruitment Bonus",
      description: "Bonus for recruiting other drivers",
      perRecruit: 100.0,
      at50Recruits: 2500.0,
      at100Recruits: 7500.0,
    },
  },

  // ============================================================================
  // MILESTONE BONUSES - CUSTOMERS
  // ============================================================================

  customerMilestones: {
    active: true,
    description: "One-time bonuses for achieving milestones",

    shipmentMilestones: {
      10: { bonus: 10.0, description: "10 shipments" },
      25: { bonus: 25.0, description: "25 shipments" },
      50: { bonus: 50.0, description: "50 shipments" },
      100: { bonus: 100.0, description: "100 shipments" },
      250: { bonus: 250.0, description: "250 shipments" },
      500: { bonus: 500.0, description: "500 shipments" },
      1000: { bonus: 1000.0, description: "1,000 shipments" },
    },

    volumeMilestones: {
      500: { bonus: 50.0, description: "$500 spent" },
      1000: { bonus: 100.0, description: "$1,000 spent" },
      5000: { bonus: 500.0, description: "$5,000 spent" },
      10000: { bonus: 1000.0, description: "$10,000 spent" },
      25000: { bonus: 2500.0, description: "$25,000 spent" },
      50000: { bonus: 5000.0, description: "$50,000 spent" },
    },

    tenure: {
      "3months": { bonus: 25.0, description: "3 months active" },
      "6months": { bonus: 75.0, description: "6 months active" },
      "1year": { bonus: 200.0, description: "1 year active" },
      "2years": { bonus: 500.0, description: "2 years active" },
      "5years": { bonus: 1500.0, description: "5 years active" },
    },
  },

  // ============================================================================
  // PROMOTIONAL BONUSES - TIME-LIMITED
  // ============================================================================

  promotionalBonuses: {
    active: true,
    description: "Limited-time promotional bonus offers",

    newYearPromotion: {
      name: "New Year Bonus",
      period: "January 1-31",
      bonus: 50.0,
      description: "First shipment gets $50 bonus",
      requirements: ["newCustomer", "firstShipment"],
    },

    springPromotion: {
      name: "Spring Refresh",
      period: "March 1-April 30",
      bonus: 100.0,
      pointsMultiplier: 1.5,
      description: "Double points on all shipments",
      requirements: ["activeCustomer"],
    },

    summerBonus: {
      name: "Summer Shipping Bonus",
      period: "June 1-August 31",
      volumeBonus: 0.05, // 5% extra on shipments
      description: "5% extra credit on volume",
      requirements: ["100+ShipmentsPerMonth"],
    },

    holidayPromotion: {
      name: "Holiday Bonus",
      period: "November 1-December 31",
      bonus: 150.0,
      description: "Holiday season special bonuses",
      requirements: ["activeCustomer"],
    },

    flashDeals: {
      name: "Flash Bonus Deals",
      frequency: "Weekly",
      bonus: 25.0,
      description: "Random bonus offers via email",
      requirements: ["optedIn"],
    },
  },

  // ============================================================================
  // PARTNERSHIP & CO-MARKETING BONUSES
  // ============================================================================

  partnershipBonuses: {
    active: true,
    description: "Bonuses through partnerships and integrations",

    ecommercePlatforms: {
      shopify: {
        name: "Shopify Integration Bonus",
        bonus: 25.0,
        description: "First month free integration",
        requirements: ["shopifyMerchant", "connectAccount"],
      },
      woocommerce: {
        name: "WooCommerce Bonus",
        bonus: 25.0,
        description: "Free integration setup",
      },
      magento: {
        name: "Magento Bonus",
        bonus: 50.0,
        description: "Enhanced integration bonus",
      },
    },

    paymentGateway: {
      stripe: {
        bonus: 50.0,
        description: "Connect Stripe account",
        pointsMultiplier: 1.1,
      },
      paypal: {
        bonus: 50.0,
        description: "Connect PayPal account",
        pointsMultiplier: 1.1,
      },
    },

    socialMedia: {
      review: {
        name: "Social Review Bonus",
        bonus: 10.0,
        description: "Leave review on Google/Trustpilot",
      },
      referralLink: {
        name: "Share Referral Link Bonus",
        bonus: 5.0,
        description: "Share referral link on social media",
        maxMonthly: 50.0,
      },
    },
  },

  // ============================================================================
  // SEASONAL & SPECIAL OCCASION BONUSES
  // ============================================================================

  seasonalBonuses: {
    active: true,

    birthday: {
      name: "Birthday Bonus",
      bonus: "varies", // Based on loyalty tier
      description: "Special bonus during birthday month",
      bronze: 25.0,
      silver: 50.0,
      gold: 100.0,
      platinum: 250.0,
    },

    anniversary: {
      name: "Account Anniversary Bonus",
      bonus: "varies",
      description: "Bonus on account creation anniversary",
      year1: 25.0,
      year2: 50.0,
      year3: 100.0,
      year5: 250.0,
    },

    blackFriday: {
      name: "Black Friday Bonus",
      period: "November 24-27",
      bonus: 200.0,
      description: "Double points on all shipments",
      pointsMultiplier: 2.0,
    },

    cyberMonday: {
      name: "Cyber Monday Bonus",
      period: "December 1-2",
      bonus: 150.0,
      description: "Online exclusive bonus",
      pointsMultiplier: 1.5,
    },
  },

  // ============================================================================
  // ENTERPRISE BONUSES
  // ============================================================================

  enterpriseBonuses: {
    active: true,
    description: "Bonuses for enterprise customers",

    volumeCommitment: {
      name: "Volume Commitment Bonus",
      description: "Bonus for committing to annual volume",
      tiers: {
        $10k: { bonus: 500.0, discount: 0.05 },
        $25k: { bonus: 1500.0, discount: 0.1 },
        $50k: { bonus: 3000.0, discount: 0.15 },
        $100k: { bonus: 7500.0, discount: 0.2 },
        "$250k+": { bonus: 20000.0, discount: 0.25 },
      },
    },

    integrationBonus: {
      name: "Custom Integration Bonus",
      bonus: 2500.0,
      description: "Bonus for implementing custom API",
    },

    dedicatedAccount: {
      name: "Dedicated Account Manager",
      bonus: "included",
      description: "Free dedicated support tier",
    },

    quarterlyBonus: {
      name: "Quarterly Performance Bonus",
      bonus: "varies",
      description: "Quarterly bonuses based on performance",
      metrics: ["volumeGrowth", "customerRetention", "referrals"],
    },
  },

  // ============================================================================
  // BONUS REDEMPTION RULES
  // ============================================================================

  redemptionRules: {
    minimumAmount: 5.0,
    maximumPerTransaction: 10000.0,
    validityPeriod: 365, // days

    methods: {
      accountCredit: {
        name: "Account Credit",
        conversionRate: 1.0, // 1:1
        instant: true,
        description: "Apply bonus directly to account",
      },

      freeShipment: {
        name: "Free Shipment",
        conversionRate: 0.5, // $1 bonus = $0.50 value
        description: "Use as shipment credit",
      },

      discountCode: {
        name: "Discount Code",
        conversionRate: 0.8, // $1 bonus = $0.80 discount
        description: "Convert to discount code",
      },

      cashback: {
        name: "Cashback",
        conversionRate: 0.75, // $1 bonus = $0.75 cashback
        processingTime: 5, // days
        minAmount: 25.0,
      },
    },

    restrictions: {
      notCombinableWith: ["promotionalPricing", "bulkDiscounts"],
      onePerShipment: false,
      taxable: true,
      nonRefundable: true,
    },
  },

  // ============================================================================
  // BONUS TRACKING & ANALYTICS
  // ============================================================================

  tracking: {
    enabled: true,
    metrics: [
      "totalBonusesIssued",
      "totalBonusesRedeemed",
      "averageBonusPerCustomer",
      "bonusROI",
      "customerRetentionRate",
      "referralConversion",
    ],

    reporting: {
      frequency: "daily",
      breakdown: ["byType", "byCustomer", "byRegion", "byTier"],
    },
  },

  // ============================================================================
  // ANTI-FRAUD MEASURES
  // ============================================================================

  fraud: {
    detection: {
      enabled: true,
      rules: [
        "unusualActivityPattern",
        "multipleAccountsFromSameIP",
        "rapidRedemption",
        "referralLoops",
        "unusualVolumeSurge",
      ],
    },

    verification: {
      phoneVerification: true,
      emailVerification: true,
      addressVerification: true,
    },

    suspension: {
      enabled: true,
      conditions: ["fraudDetected", "violatesTerms", "multipleViolations"],
    },
  },

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  config: {
    enabled: true,
    version: "2026.01",
    currency: "USD",
    regions: "all",

    maxMonthlyBonus: 10000.0,
    maxAnnualBonus: 100000.0,

    automatedExecution: true,
    notificationEnabled: true,
    dashboardVisible: true,

    supportEmail: "bonuses@infamousfreight.com",
    helpArticle: "https://help.infamousfreight.com/bonuses",
  },
};

module.exports = BONUSES_SYSTEM;
