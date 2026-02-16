// apps/api/src/services/aiChatbot.js

class AIChatbotService {
  /**
   * AI-powered customer support chatbot
   * Handles FAQs, order tracking, issue resolution
   */

  constructor(prisma) {
    this.prisma = prisma;
    this.intentPatterns = {
      order_tracking: /track|where|delivery|status/i,
      pricing: /price|cost|quote|calculate/i,
      payment: /payment|refund|billing|charge/i,
      contact: /phone|email|support|help/i,
      account: /account|login|password|register/i,
    };
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userId, message, conversationId) {
    // Classify intent
    const intent = this.classifyIntent(message);

    // Get context from conversation history
    const history = await this.getConversationHistory(conversationId);

    // Generate response based on intent
    let response;

    switch (intent) {
      case "order_tracking":
        response = await this.handleOrderTracking(userId, message);
        break;
      case "pricing":
        response = await this.handlePricing(message);
        break;
      case "payment":
        response = await this.handlePayment(userId, message);
        break;
      case "account":
        response = await this.handleAccount(userId, message);
        break;
      default:
        response = await this.handleGeneral(message);
    }

    // Save to conversation
    await this.saveChatMessage(conversationId, userId, message, response, intent);

    return {
      response,
      intent,
      confidence: 0.85,
      suggestedActions: this.getSuggestedActions(intent),
      escalated: response.needsHuman || false,
    };
  }

  /**
   * Handle order tracking requests
   */
  async handleOrderTracking(userId, message) {
    // Extract order ID from message
    const orderId = this.extractOrderId(message);

    if (!orderId) {
      return {
        text: "I can help you track your shipment! Could you provide your order ID or tracking number?",
        action: "request_order_id",
      };
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: orderId },
    });

    if (!shipment) {
      return {
        text: "I couldn't find that order. Can you double-check the order ID?",
        needsHuman: true,
      };
    }

    return {
      text: `Your shipment is currently ${shipment.status}. ${this.getStatusMessage(shipment.status)}`,
      tracking: {
        status: shipment.status,
        location: shipment.currentLocation,
        estimatedDelivery: shipment.estimatedDelivery,
        driver: shipment.driverName,
      },
    };
  }

  /**
   * Handle pricing questions
   */
  async handlePricing(message) {
    // Check if user is asking for a quote
    if (message.includes("quote") || message.includes("calculate")) {
      return {
        text: "I'd be happy to help calculate shipping costs! Please provide: origin, destination, weight, and delivery speed.",
        action: "start_quote_wizard",
      };
    }

    return {
      text: "Our pricing is calculated based on distance, weight, and delivery speed. Here's our base rate: $10 base + $2.50/mile + $0.15/lb. Would you like me to calculate a specific quote?",
      details: {
        baseCharge: 10,
        perMile: 2.5,
        perPound: 0.15,
      },
    };
  }

  /**
   * Handle payment/refund questions
   */
  async handlePayment(userId, message) {
    if (message.includes("refund")) {
      return {
        text: "We offer full refunds for cancelled orders or failed deliveries. What's your order ID?",
        action: "request_order_for_refund",
      };
    }

    if (message.includes("payment method")) {
      return {
        text: "We accept credit cards, debit cards, PayPal, and Apple Pay. Which would you prefer?",
        methods: ["credit_card", "paypal", "apple_pay"],
      };
    }

    return {
      text: "How can I help with payment or billing?",
      options: ["refund", "payment_method", "invoice", "billing_question"],
    };
  }

  /**
   * Handle account-related questions
   */
  async handleAccount(userId, message) {
    if (message.includes("password")) {
      return {
        text: 'To reset your password, go to Settings → Security or click "Forgot Password" at login. Check your email for instructions.',
        action: "send_password_reset",
      };
    }

    if (message.includes("delete") || message.includes("close")) {
      return {
        text: "To delete your account, please contact our support team directly. They'll verify your identity and process the deletion within 30 days per GDPR.",
        needsHuman: true,
      };
    }

    return {
      text: "What do you need help with regarding your account?",
      options: ["profile", "password", "settings", "delete_account"],
    };
  }

  /**
   * Handle general questions (FAQ fallback)
   */
  async handleGeneral(message) {
    // Simple keyword matching for common questions
    if (message.includes("hours") || message.includes("available")) {
      return { text: "We're available 24/7. Chat support responds within 2 minutes." };
    }

    if (message.includes("coverage") || message.includes("area")) {
      return {
        text: "We serve all 50 US states and Canada. Can I help you with a specific location?",
      };
    }

    return {
      text: "I'm not sure about that. Would you like me to connect you with a human agent?",
      needsHuman: true,
    };
  }

  /**
   * Classify intent from user message
   */
  classifyIntent(message) {
    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(message)) {
        return intent;
      }
    }
    return "general";
  }

  /**
   * Extract order ID from message
   */
  extractOrderId(message) {
    const match = message.match(/[A-Z0-9]{8,12}/);
    return match ? match[0] : null;
  }

  /**
   * Get status-specific message
   */
  getStatusMessage(status) {
    const messages = {
      pending: "Your shipment is being prepared for pickup.",
      picked_up: "Your shipment is on its way!",
      in_transit: "Your package is currently in transit.",
      out_for_delivery: "Your package is out for delivery today!",
      delivered: "Your package has been delivered.",
      failed: "Delivery attempted but unsuccessful. Please call or go online for details.",
    };

    return messages[status] || "Status update coming soon.";
  }

  /**
   * Get suggested actions for user
   */
  getSuggestedActions(intent) {
    const actions = {
      order_tracking: ["view_full_tracking", "update_delivery_address", "contact_driver"],
      pricing: ["get_real_quote", "compare_speeds", "save_quote"],
      payment: ["view_invoices", "update_payment_method", "download_receipt"],
      account: ["view_profile", "payment_methods", "preferences"],
    };

    return actions[intent] || [];
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId, limit = 10) {
    return await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Save chat message
   */
  async saveChatMessage(conversationId, userId, userMessage, botResponse, intent) {
    return await this.prisma.chatMessage.create({
      data: {
        conversationId,
        userId,
        userMessage,
        botResponse: JSON.stringify(botResponse),
        intent,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Generate FAQ responses
   */
  async getFAQResponse(question) {
    const faqs = {
      "delivery-time":
        "Standard delivery takes 3-5 business days. Express is 1-2 days, overnight is next day.",
      tracking:
        "Track your shipment anytime at the link in your confirmation email or your account dashboard.",
      cancellation:
        "Orders can be cancelled within 1 hour of placement. After that, contact support.",
      damage: "Report damage within 48 hours for a full refund or replacement.",
    };

    // Simple matching
    for (const [key, answer] of Object.entries(faqs)) {
      if (question.toLowerCase().includes(key)) {
        return answer;
      }
    }

    return null;
  }
}

module.exports = { AIChatbotService };
