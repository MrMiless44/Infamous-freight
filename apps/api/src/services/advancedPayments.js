// apps/api/src/services/advancedPayments.js

class AdvancedPaymentsService {
  /**
   * Advanced payment processing for cryptocurrency, BNPL, and digital wallets
   */

  constructor(prisma) {
    this.prisma = prisma;
    this.supportedCryptos = ["BTC", "ETH", "USDC", "USDT"];
    this.bnplProviders = ["klarna", "affirm", "afterpay", "paypal_credit"];
  }

  /**
   * Process cryptocurrency payment
   */
  async processCryptoPayment(paymentData) {
    const { amount, currency, walletAddress, invoiceId } = paymentData;

    if (!this.supportedCryptos.includes(currency)) {
      throw new Error(`Unsupported cryptocurrency: ${currency}`);
    }

    // Calculate conversion rate USD -> crypto
    const rates = {
      BTC: 0.000025, // 1 USD = 0.000025 BTC (example)
      ETH: 0.0005,
      USDC: 1.0,
      USDT: 1.0,
    };

    const cryptoAmount = amount * rates[currency];

    return {
      transactionId: `crypto_${Date.now()}`,
      type: "cryptocurrency",
      currency,
      usdAmount: amount,
      cryptoAmount: cryptoAmount.toFixed(8),
      walletAddress,
      invoiceId,
      status: "pending_confirmation",
      confirmationsRequired: currency === "BTC" ? 3 : 12,
      confirmationsReceived: 0,
      expiresAt: new Date(Date.now() + 30 * 60000), // 30 minutes,
      timestamp: new Date(),
    };
  }

  /**
   * Process BNPL (Buy Now Pay Later) payment
   */
  async processBNPLPayment(paymentData) {
    const { amount, provider, customerId, shipmentId } = paymentData;

    if (!this.bnplProviders.includes(provider)) {
      throw new Error(`Unsupported BNPL provider: ${provider}`);
    }

    // Calculate installment plan
    const installments = this.calculateInstallments(amount, provider);

    return {
      transactionId: `bnpl_${Date.now()}`,
      type: "bnpl",
      provider,
      totalAmount: amount,
      installments,
      customerId,
      shipmentId,
      status: "awaiting_authorization",
      authorizationUrl: `https://${provider}.com/authorize?token=${btoa(JSON.stringify({ customerId, amount }))}`,
      fees: this.calculateBNPLFees(amount, provider),
      timestamp: new Date(),
    };
  }

  /**
   * Calculate installment plan
   */
  calculateInstallments(amount, provider) {
    const providers = {
      klarna: { terms: [2, 3, 6, 12], interestRate: 0.08 },
      affirm: { terms: [3, 6, 12], interestRate: 0.1 },
      afterpay: { terms: [4], interestRate: 0 }, // 4 equal payments
      paypal_credit: { terms: [3, 6, 12], interestRate: 0.07 },
    };

    const config = providers[provider];
    const plans = [];

    for (const months of config.terms) {
      const monthlyPayment = amount / months;
      const interest = amount * config.interestRate * (months / 12);
      const total = amount + interest;

      plans.push({
        months,
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        interest: parseFloat(interest.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        schedule: this.generatePaymentSchedule(monthlyPayment, months),
      });
    }

    return plans;
  }

  /**
   * Generate payment schedule
   */
  generatePaymentSchedule(monthlyPayment, months) {
    const schedule = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      schedule.push({
        installment: i + 1,
        amount: parseFloat(monthlyPayment.toFixed(2)),
        dueDate,
        status: "pending",
      });
    }

    return schedule;
  }

  /**
   * Calculate BNPL fees
   */
  calculateBNPLFees(amount, provider) {
    const fees = {
      klarna: 0.02 * amount, // 2%
      affirm: 0.03 * amount, // 3%
      afterpay: 0.04 * amount, // 4%
      paypal_credit: 0.015 * amount, // 1.5%
    };

    return parseFloat(fees[provider].toFixed(2));
  }

  /**
   * Add funds to digital wallet
   */
  async addFundsToWallet(userId, amount, fundingSource) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    });

    const transaction = {
      walletId: wallet.id,
      type: "credit",
      amount,
      fundingSource,
      status: "pending",
      transactionId: `wallet_${Date.now()}`,
      timestamp: new Date(),
    };

    // Update balance
    const newBalance = wallet.balance + amount;

    return {
      walletId: wallet.id,
      previousBalance: wallet.balance,
      amount,
      newBalance,
      transaction,
      timestamp: new Date(),
    };
  }

  /**
   * Process digital wallet payment
   */
  async processWalletPayment(userId, amount) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: true },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    return {
      transactionId: `wallet_pay_${Date.now()}`,
      type: "wallet_payment",
      userId,
      amount,
      previousBalance: wallet.balance,
      newBalance: wallet.balance - amount,
      status: "completed",
      timestamp: new Date(),
    };
  }

  /**
   * Get payment method options
   */
  getPaymentMethods() {
    return {
      traditional: [
        { id: "card", name: "Credit/Debit Card", fee: 0.029, cap: 1.0 },
        { id: "bank", name: "Bank Transfer", fee: 0.01, cap: 0.5 },
        { id: "paypal", name: "PayPal", fee: 0.034, cap: 2.0 },
      ],
      cryptocurrency: [
        { id: "btc", name: "Bitcoin", fee: 0.001, confirmations: 3 },
        { id: "eth", name: "Ethereum", fee: 0.0005, confirmations: 12 },
        { id: "usdc", name: "USD Coin", fee: 0.0001, confirmations: 6 },
        { id: "usdt", name: "Tether", fee: 0.0001, confirmations: 6 },
      ],
      bnpl: [
        { id: "klarna", name: "Klarna", minAmount: 50, maxAmount: 10000 },
        { id: "affirm", name: "Affirm", minAmount: 50, maxAmount: 15000 },
        { id: "afterpay", name: "Afterpay", minAmount: 0, maxAmount: 5000 },
        { id: "paypal_credit", name: "PayPal Credit", minAmount: 100, maxAmount: 50000 },
      ],
      wallets: [
        { id: "apple_pay", name: "Apple Pay", enabled: true },
        { id: "google_pay", name: "Google Pay", enabled: true },
        { id: "account_wallet", name: "In-App Wallet", enabled: true },
      ],
    };
  }

  /**
   * Reconcile crypto payment
   */
  async reconcileCryptoPayment(transactionId, confirmations, blockHash) {
    return {
      transactionId,
      confirmed: confirmations >= 3,
      confirmations,
      blockHash,
      status: confirmations >= 3 ? "confirmed" : "pending_confirmation",
      timestamp: new Date(),
    };
  }
}

module.exports = { AdvancedPaymentsService };
