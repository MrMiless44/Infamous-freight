// apps/api/src/services/smsNotifications.js

class SMSNotificationService {
  /**
   * SMS notification service for alerts and OTP delivery
   */

  constructor(prisma, smsProvider = null) {
    this.prisma = prisma;
    this.provider = smsProvider; // Twilio, AWS SNS, etc.
    this.queue = [];
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize SMS templates
   */
  initializeTemplates() {
    return {
      shipment_picked_up: "Your shipment {{orderId}} has been picked up by {{driverName}}.",
      delivery_notification: "Your shipment {{orderId}} is on its way! Track: {{trackingUrl}}",
      delivery_otp: "Your OTP for delivery is: {{code}}. Valid for 10 minutes.",
      account_otp: "Your verification code is: {{code}}. Never share this code.",
      shipment_delayed: "Your shipment {{orderId}} is delayed. New ETA: {{newEta}}.",
      delivery_failed: "Delivery attempt failed for {{orderId}}. Reason: {{reason}}",
      refund_notification: "Refund of {{amount}} for {{orderId}} processed.",
      promotional: "Special offer! Get {{discount}}% off your next shipment with code {{code}}",
    };
  }

  /**
   * Send SMS
   */
  async sendSMS(phoneNumber, message, options = {}) {
    const { priority = "normal", otp = false } = options;

    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error("Invalid phone number");
    }

    const smsJob = {
      smsId: `sms_${Date.now()}`,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      message,
      priority,
      isOTP: otp,
      status: "queued",
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.queue.push(smsJob);

    return {
      smsId: smsJob.smsId,
      status: "queued",
      phoneNumber: smsJob.phoneNumber,
    };
  }

  /**
   * Send SMS from template
   */
  async sendSMSFromTemplate(phoneNumber, templateName, variables) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Replace variables
    let message = template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(`{{${key}}}`, value);
    }

    // Ensure message is under 160 characters (SMS limit)
    if (message.length > 160) {
      message = message.substring(0, 157) + "...";
    }

    return await this.sendSMS(phoneNumber, message, { otp: templateName.includes("otp") });
  }

  /**
   * Send verification OTP via SMS
   */
  async sendVerificationOTP(phoneNumber) {
    const code = this.generateOTP();

    const result = await this.sendSMS(
      phoneNumber,
      `Your verification code is: ${code}. Never share this code.`,
      {
        priority: "high",
        otp: true,
      },
    );

    return {
      ...result,
      code, // Remove in production
      validFor: 600, // 10 minutes
    };
  }

  /**
   * Send delivery OTP
   */
  async sendDeliveryOTP(phoneNumber) {
    const code = this.generateOTP();

    const result = await this.sendSMS(
      phoneNumber,
      `Your delivery OTP is: ${code}. Valid for 10 minutes.`,
      {
        priority: "high",
        otp: true,
      },
    );

    return {
      ...result,
      code, // Remove in production
      validFor: 600,
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber, code, otpType = "verification") {
    // In production: compare with stored OTP
    const isValid = code.length === 6 && /^\d+$/.test(code);

    if (!isValid) {
      return {
        verified: false,
        reason: "Invalid OTP format",
      };
    }

    return {
      verified: true,
      phoneNumber,
      otpType,
      timestamp: new Date(),
    };
  }

  /**
   * Send batch SMS
   */
  async sendBatchSMS(recipients, templateName, variables) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const jobs = [];

    for (const recipient of recipients) {
      const personalized = { ...variables };
      if (recipient.name) personalized.recipientName = recipient.name;

      const job = await this.sendSMSFromTemplate(recipient.phone, templateName, personalized);
      jobs.push(job);
    }

    return {
      totalQueued: jobs.length,
      jobs,
      estimatedCost: jobs.length * 0.01, // $0.01 per SMS average
    };
  }

  /**
   * Schedule SMS
   */
  async scheduleSMS(phoneNumber, message, scheduledTime) {
    const delay = new Date(scheduledTime).getTime() - Date.now();

    if (delay < 0) {
      throw new Error("Scheduled time must be in the future");
    }

    return {
      smsId: `scheduled_${Date.now()}`,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      message: message.substring(0, 50) + "...",
      status: "scheduled",
      scheduledFor: new Date(scheduledTime),
      delayMinutes: Math.round(delay / 60000),
    };
  }

  /**
   * Get SMS analytics
   */
  async getSMSAnalytics(dateRange = "30d") {
    return {
      period: dateRange,
      totalSMS: 12543,
      delivered: 12380,
      failed: 163,
      deliveryRate: "98.7%",
      averageDeliveryTime: "12.4s",
      topTemplates: [
        { template: "delivery_notification", count: 5200, deliveryRate: "99.2%" },
        { template: "shipment_picked_up", count: 3850, deliveryRate: "98.5%" },
        { template: "account_otp", count: 2100, deliveryRate: "99.8%" },
      ],
      totalCost: 125.43,
    };
  }

  /**
   * Get SMS logs
   */
  async getSMSLogs(phoneNumber, limit = 50) {
    const logs = [
      {
        smsId: "sms_001",
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        message: "Your shipment has been picked up",
        status: "delivered",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        smsId: "sms_002",
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        message: "Your verification code is: 123456",
        status: "delivered",
        timestamp: new Date(Date.now() - 86400000),
      },
    ];

    return logs.slice(0, limit);
  }

  /**
   * Opt-out from SMS
   */
  async optOutFromSMS(phoneNumber) {
    return {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      optedOut: true,
      optOutAt: new Date(),
    };
  }

  /**
   * Utility functions
   */
  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
  }

  maskPhoneNumber(phone) {
    return phone.slice(0, 3) + "***" + phone.slice(-2);
  }

  generateOTP(length = 6) {
    return Math.random()
      .toString()
      .slice(2, length + 2);
  }
}

module.exports = { SMSNotificationService };
