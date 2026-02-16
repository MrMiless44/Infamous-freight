// apps/api/src/services/voiceCommands.js

class VoiceCommandService {
  /**
   * Voice command processing for hands-free interaction
   */

  constructor() {
    this.commands = this.initializeCommands();
  }

  /**
   * Initialize supported voice commands
   */
  initializeCommands() {
    return {
      "track shipment": this.trackShipment,
      "where is my package": this.trackShipment,
      "check status": this.checkStatus,
      "schedule pickup": this.schedulePickup,
      "cancel order": this.cancelOrder,
      refund: this.requestRefund,
      "call driver": this.callDriver,
      "rate driver": this.rateDriver,
      "get quote": this.getQuote,
      "contact support": this.contactSupport,
    };
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(voiceInput, userId) {
    // Convert speech to text (in production, use speech-to-text API)
    const text = await this.transcribeAudio(voiceInput);

    // Match command
    let matchedCommand = null;
    let confidence = 0;

    for (const [command, handler] of Object.entries(this.commands)) {
      const similarity = this.calculateSimilarity(text.toLowerCase(), command);
      if (similarity > confidence) {
        confidence = similarity;
        matchedCommand = handler.bind(this);
      }
    }

    if (confidence > 0.7 && matchedCommand) {
      const result = await matchedCommand(userId, text);
      return {
        success: true,
        command: Object.entries(this.commands).find((e) => e[1] === matchedCommand)?.[0],
        confidence,
        result,
        response: this.formatVoiceResponse(result),
      };
    }

    return {
      success: false,
      confidence,
      error: "Command not recognized",
      response: 'Sorry, I didn\'t understand that. Try "track shipment" or "get quote".',
    };
  }

  /**
   * Voice command handlers
   */
  async trackShipment(userId, input) {
    const orderId = this.extractParameter(input, "order");
    return { action: "track", orderId };
  }

  async checkStatus(userId, input) {
    return { action: "status", type: "general" };
  }

  async schedulePickup(userId, input) {
    const time = this.extractParameter(input, "time");
    return { action: "schedule", type: "pickup", time };
  }

  async cancelOrder(userId, input) {
    const orderId = this.extractParameter(input, "order");
    return { action: "cancel", orderId };
  }

  async requestRefund(userId, input) {
    const orderId = this.extractParameter(input, "order");
    return { action: "refund", orderId, needsHuman: true };
  }

  async callDriver(userId, input) {
    return { action: "call", type: "driver", initiateCall: true };
  }

  async rateDriver(userId, input) {
    const rating = this.extractParameter(input, "rating");
    return { action: "rate", rating };
  }

  async getQuote(userId, input) {
    const from = this.extractParameter(input, "from");
    const to = this.extractParameter(input, "to");
    return { action: "quote", origin: from, destination: to };
  }

  async contactSupport(userId, input) {
    return { action: "support", initiateChat: true };
  }

  /**
   * Calculate string similarity
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  getEditDistance(s1, s2) {
    const costs = {};

    for (let i = 0; i <= s1.length; i++) {
      costs[i] = i;
    }

    for (let j = 1; j <= s2.length; j++) {
      costs[0] = j;
      let nw = j - 1;

      for (let i = 1; i <= s1.length; i++) {
        const cj = costs[i];
        costs[i] = Math.min(costs[i] + 1, costs[i - 1] + 1, nw + (s1[i - 1] === s2[j - 1] ? 0 : 1));
        nw = cj;
      }
    }

    return costs[s1.length];
  }

  /**
   * Extract parameter from voice input
   */
  extractParameter(input, paramName) {
    const patterns = {
      order: /order\s+([A-Z0-9]+)/i,
      time: /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      rating: /(\d)\s*star/i,
      from: /from\s+([a-z\s]+)\s+to/i,
      to: /to\s+([a-z\s]+)$/i,
    };

    const match = input.match(patterns[paramName]);
    return match ? match[1] : null;
  }

  /**
   * Format response for voice output
   */
  formatVoiceResponse(result) {
    const responses = {
      track: `Tracking your shipment now.`,
      status: `Let me check that for you.`,
      schedule: `Scheduling a pickup.`,
      cancel: `Cancelling your order.`,
      refund: `Let me connect you with support for the refund.`,
      call: `Calling your driver.`,
      rate: `Recording your rating.`,
      quote: `Calculating your quote.`,
      support: `Connecting to support.`,
    };

    return responses[result.action] || "Processing your request.";
  }

  /**
   * Transcribe audio (placeholder - use real speech-to-text API)
   */
  async transcribeAudio(voiceInput) {
    // In production: use Google Speech-to-Text, AWS Transcribe, or similar
    return "track shipment";
  }
}

module.exports = { VoiceCommandService };
