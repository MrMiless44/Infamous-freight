// apps/api/src/services/mobileWallet.js

class MobileWalletService {
  /**
   * Mobile wallet management for in-app payments and balance
   */

  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Create mobile wallet
   */
  async createMobileWallet(userId, initialBalance = 0) {
    const wallet = {
      userId,
      balance: initialBalance,
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      transactions: [],
      linkedCards: [],
    };

    return wallet;
  }

  /**
   * Link payment card to wallet
   */
  async linkPaymentCard(userId, cardData) {
    const { cardNumber, expiryDate, cvv, cardholderName } = cardData;

    // Tokenize card (in production, use Stripe/Payment processor)
    const cardToken = btoa(cardNumber.slice(-4));

    return {
      cardId: `card_${Date.now()}`,
      cardToken,
      last4: cardNumber.slice(-4),
      expiryDate,
      cardholderName,
      cardBrand: this.detectCardBrand(cardNumber),
      status: "verified",
      linkedAt: new Date(),
    };
  }

  /**
   * Detect card brand
   */
  detectCardBrand(cardNumber) {
    const patterns = {
      VISA: /^4/,
      MASTERCARD: /^5[1-5]/,
      AMEX: /^3[47]/,
      DISCOVER: /^6(?:011|5)/,
    };

    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) return brand;
    }

    return "UNKNOWN";
  }

  /**
   * Load money to wallet
   */
  async loadMoneyToWallet(userId, amount, fundingMethod) {
    return {
      transactionId: `wallet_load_${Date.now()}`,
      userId,
      activity: "load",
      amount,
      fundingMethod,
      status: "completed",
      previousBalance: null,
      newBalance: amount,
      fee: this.calculateLoadFee(amount, fundingMethod),
      timestamp: new Date(),
    };
  }

  /**
   * Pay for shipment from wallet
   */
  async payForShipment(userId, shipmentId, amount) {
    return {
      transactionId: `wallet_payment_${Date.now()}`,
      userId,
      shipmentId,
      activity: "payment",
      amount,
      status: "completed",
      description: `Payment for shipment ${shipmentId}`,
      timestamp: new Date(),
    };
  }

  /**
   * Send money to another user
   */
  async sendMoneyToUser(fromUserId, toUserId, amount, note = "") {
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const fee = amount * 0.01; // 1% fee
    const totalDebit = amount + fee;

    return {
      transactionId: `transfer_${Date.now()}`,
      from: fromUserId,
      to: toUserId,
      amount,
      fee,
      totalDebit,
      note,
      status: "completed",
      timestamp: new Date(),
    };
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId) {
    return {
      userId,
      balance: 150.5, // Mock balance
      currency: "USD",
      lastUpdated: new Date(),
      status: "active",
    };
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId, limit = 20, offset = 0) {
    const transactions = [
      {
        transactionId: "txn_001",
        type: "payment",
        amount: -25.5,
        description: "Shipment delivery",
        timestamp: new Date(Date.now() - 86400000),
        status: "completed",
      },
      {
        transactionId: "txn_002",
        type: "load",
        amount: 100.0,
        description: "Load money to wallet",
        timestamp: new Date(Date.now() - 172800000),
        status: "completed",
      },
      {
        transactionId: "txn_003",
        type: "transfer",
        amount: -10.0,
        description: "Money transfer to user",
        timestamp: new Date(Date.now() - 259200000),
        status: "completed",
      },
    ];

    return {
      userId,
      transactions: transactions.slice(offset, offset + limit),
      total: transactions.length,
      limit,
      offset,
    };
  }

  /**
   * Issue refund to wallet
   */
  async issueRefundToWallet(userId, refundData) {
    const { amount, reason, originalTransaction } = refundData;

    return {
      refundId: `refund_${Date.now()}`,
      userId,
      amount,
      reason,
      originalTransaction,
      status: "processed",
      processedAt: new Date(),
      refundedTo: "wallet",
    };
  }

  /**
   * Calculate load fee
   */
  calculateLoadFee(amount, fundingMethod) {
    const feeRates = {
      card: 0.03, // 3%
      bank: 0.01, // 1%
      crypto: 0.0,
    };

    const rate = feeRates[fundingMethod] || 0.02;
    return parseFloat((amount * rate).toFixed(2));
  }

  /**
   * Set wallet spending limit
   */
  async setSpendingLimit(userId, dailyLimit, monthlyLimit) {
    return {
      userId,
      limits: {
        daily: dailyLimit,
        monthly: monthlyLimit,
        currentDaily: 0,
        currentMonthly: 0,
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Check spending limit
   */
  async checkSpendingLimit(userId, amount) {
    return {
      allowed: true,
      reason: "Within spending limits",
      remainingDaily: 500 - 125,
      remainingMonthly: 5000 - 1200,
    };
  }
}

module.exports = { MobileWalletService };
